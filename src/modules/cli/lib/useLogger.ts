import { useEffect, useState } from "react";
import { logger, LogMessage } from "./logger";

export const useLogger = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = logger.subscribe((logMessage: LogMessage) => {
      setLogs((prevLogs) => [
        ...prevLogs,
        `[${logMessage.level.toUpperCase()}] ${logMessage.message}`,
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    logger.clearLogs();
  };

  const addLog = (message: string) => {
    logger.info(message);
  };

  const logInfo = (message: string) => {
    logger.info(message);
  };

  const logWarn = (message: string) => {
    logger.warn(message);
  };

  const logError = (message: string) => {
    logger.error(message);
  };

  const logDebug = (message: string) => {
    logger.debug(message);
  };

  return {
    logs,
    clearLogs,
    addLog,
    logInfo,
    logWarn,
    logError,
    logDebug,
  };
};
