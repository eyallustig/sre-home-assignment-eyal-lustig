import { Kafka, logLevel as KafkaLogLevel } from "kafkajs";
import express from "express";
import { logger } from "./logging/logger.js";

const brokers =
  process.env.KAFKA_BROKERS?.split(",").map((b) => b.trim()) || [
    "kafka:9092",
  ];
const topic = process.env.KAFKA_TOPIC || "tidb_changes";
const groupId = process.env.KAFKA_GROUP || "helfy-cdc-consumer";

const topicPartitions = Number(
  process.env.KAFKA_TOPIC_PARTITIONS || process.env.TOPIC_PARTITIONS || 1
);
const topicReplication = Number(
  process.env.KAFKA_TOPIC_REPLICATION ||
    process.env.TOPIC_REPLICATION ||
    1
);
const topicCreateAttempts = Number(
  process.env.KAFKA_TOPIC_CREATE_ATTEMPTS ||
    process.env.TOPIC_CREATE_ATTEMPTS ||
    10
);
const topicCreateBackoffMs = Number(
  process.env.KAFKA_TOPIC_CREATE_BACKOFF_MS ||
    process.env.TOPIC_CREATE_BACKOFF_MS ||
    1000
);
const topicCreateBackoffMaxMs = Number(
  process.env.KAFKA_TOPIC_CREATE_BACKOFF_MAX_MS ||
    process.env.TOPIC_CREATE_BACKOFF_MAX_MS ||
    30000
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ready = false;

async function ensureTopicExists(kafka) {
  for (let attempt = 1; attempt <= topicCreateAttempts; attempt++) {
    const admin = kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: topicPartitions,
            replicationFactor: topicReplication,
          },
        ],
        waitForLeaders: true,
      });
      logger.info({
        action: "topic_ready",
        topic,
        partitions: topicPartitions,
        replication: topicReplication,
        attempt,
      });
      await admin.disconnect();
      return;
    } catch (err) {
      logger.warn({
        action: "topic_create_retry",
        topic,
        attempt,
        error: err.message,
      });
      try {
        await admin.disconnect();
      } catch (_) {
        // ignore
      }
      if (attempt === topicCreateAttempts) {
        throw err;
      }
      const backoff = Math.min(
        topicCreateBackoffMs * attempt,
        topicCreateBackoffMaxMs
      );
      await sleep(backoff);
    }
  }
}

async function start() {
  const kafka = new Kafka({
    brokers,
    logLevel: KafkaLogLevel.NOTHING,
    retry: {
      retries: 30,
      initialRetryTime: 1000,
      maxRetryTime: 30000,
    },
  });

  const consumer = kafka.consumer({ groupId });

  consumer.on(consumer.events.CRASH, ({ payload }) => {
    logger.error({
      action: "consumer_crash",
      error: payload?.error?.message,
    });
    ready = false;
  });

  await ensureTopicExists(kafka);
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  ready = true;
  logger.info({
    action: "consumer_started",
    brokers,
    topic,
    groupId,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value ? message.value.toString("utf8") : "";
      try {
        const data = JSON.parse(raw);
        logger.info({
          action: "cdc_event",
          topic,
          partition,
          offset: message.offset,
          change_type: data.type,
          database: data.database,
          table: data.table,
          ts: data.ts,
          data: data.data,
          old: data.old,
        });
      } catch (err) {
        logger.error({
          action: "cdc_parse_error",
          topic,
          partition,
          offset: message.offset,
          error: err.message,
          raw,
        });
      }
    },
  });

  // Simple HTTP health endpoint
  const app = express();
  const PORT = process.env.HEALTH_PORT || 8081;
  app.get("/health", (req, res) => {
    if (ready) {
      res.json({ status: "ok", topic, groupId });
    } else {
      res.status(503).json({ status: "starting", topic, groupId });
    }
  });
  app.listen(PORT, () => {
    logger.info({ action: "consumer_health_started", port: PORT });
  });
}

start().catch((err) => {
  logger.error({ action: "consumer_start_error", error: err.message });
  process.exit(1);
});
