import log4js from "log4js";

// Custom JSON layout so logs are always structured.
log4js.addLayout("json-with-fields", () => {
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
  appenders: {
    console: { type: "stdout", layout: { type: "json-with-fields" } },
  },
  categories: {
    default: { appenders: ["console"], level: "info" },
    auth: { appenders: ["console"], level: "info" },
  },
});

export const logger = log4js.getLogger();
export const authLogger = log4js.getLogger("auth");
