export declare enum LogLevel {
    INFO = "INFO",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}
export declare class Logger {
    private static formatTime;
    static info(message: string): void;
    static success(message: string): void;
    static warning(message: string): void;
    static error(message: string, error?: Error): void;
    static debug(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map