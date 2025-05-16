type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

type LogSubscriber = (log: LogMessage) => void;

class Logger {
  private subscribers: LogSubscriber[] = [];
  private logs: LogMessage[] = [];

  constructor() {}

  public info(message: string): void {
    this.log("info", message);
  }

  public warn(message: string): void {
    this.log("warn", message);
  }

  public error(message: string): void {
    this.log("error", message);
  }

  public debug(message: string): void {
    this.log("debug", message);
  }

  private log(level: LogLevel, message: string): void {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date(),
    };

    this.logs.push(logMessage);

    this.subscribers.forEach((subscriber) => {
      subscriber(logMessage);
    });

    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  public subscribe(subscriber: LogSubscriber): () => void {
    this.subscribers.push(subscriber);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    };
  }

  public getLogs(): LogMessage[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
