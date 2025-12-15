import log4js from "log4js";

log4js.addLayout("json-consumer", () => {
  return (event) => {
    const [first] = event.data;
    const payload =
      first && typeof first === "object" && !Array.isArray(first)
        ? first
        : { message: event.data.join(" ") };
    return JSON.stringify({
      timestamp: event.startTime.toISOString(),
      level: event.level.levelStr,
      category: event.categoryName,
      ...payload,
    });
  };
});

log4js.configure({
  appenders: { console: { type: "stdout", layout: { type: "json-consumer" } } },
  categories: { default: { appenders: ["console"], level: "info" } },
});

export const logger = log4js.getLogger("consumer");
