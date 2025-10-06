import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, json, colorize } = format;

// Console log format
const consoleLogFormat = printf(({ level, message }) => {
  return `${level}: ${message}`;
});

// Winston logger
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      format: combine(colorize(), consoleLogFormat),
    }),
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: process.env.RETENTION_PERIOD_LOGGER,
    }),
  ],
});

export default logger;
