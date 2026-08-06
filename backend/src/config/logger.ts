import pino, { type LoggerOptions } from "pino";
import { env } from "./env";

const loggerOptions: LoggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",

  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "req.headers.authorization",
      "req.body.password",
      "req.body.refreshToken",
    ],
    censor: "[REDACTED]",
  },

  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
};

export const logger = pino(loggerOptions);