// import { createLogger, format, transports } from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";

// const { combine, timestamp, json, colorize } = format;

// // Custom format for console logging with colors
// const consoleLogFormat = format.combine(
//   format.colorize(),
//   format.printf(({ level, message, timestamp }) => {
//     return `${level}: ${message}`;
//   })
// );

// // Create a Winston logger
// const logger = createLogger({
//   level: "info",
//   format: combine(colorize(), timestamp(), json()),
//   transports: [
//     new transports.Console({
//       format: consoleLogFormat,
//     }),
//     new transports.File({ filename: "app.log" }),
//   ],
// });

// export default logger;

import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, json, colorize } = format;

// Console log format
const consoleLogFormat = printf(({ level, message }) => {
  return `${level}: ${message}`;
});

// Winston logger
const logger = createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      format: combine(colorize(), consoleLogFormat),
    }),
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",       
      datePattern: "DD-MM-YYYY",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",                      
    }),
  ],
});

export default logger;
