import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import log4js from "log4js";

const app = express();
const PORT = process.env.WEB_PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log4js.addLayout("json-web", () => {
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
  appenders: { console: { type: "stdout", layout: { type: "json-web" } } },
  categories: { default: { appenders: ["console"], level: "info" } },
});

const logger = log4js.getLogger("web");

const publicDir = path.join(__dirname, "public");
app.use((req, res, next) => {
  logger.info({
    action: "http_request",
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Web app listening on port ${PORT}`);
});
