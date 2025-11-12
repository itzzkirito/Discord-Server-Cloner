import chalk from 'chalk';
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["SUCCESS"] = "SUCCESS";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static formatTime() {
        return new Date().toLocaleTimeString();
    }
    static info(message) {
        console.log(`${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.white(LogLevel.INFO)}${chalk.blue(']')} ${message}`);
    }
    static success(message) {
        console.log(`${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.green(LogLevel.SUCCESS)}${chalk.blue(']')} ${chalk.green(message)}`);
    }
    static warning(message) {
        console.log(`${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.yellow(LogLevel.WARNING)}${chalk.blue(']')} ${chalk.yellow(message)}`);
    }
    static error(message, error) {
        console.error(`${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.red(LogLevel.ERROR)}${chalk.blue(']')} ${chalk.red(message)}`);
        if (error) {
            console.error(chalk.red(error.stack || error.message));
        }
    }
    static debug(message) {
        if (process.env.DEBUG === 'true') {
            console.log(`${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.gray(LogLevel.DEBUG)}${chalk.blue(']')} ${chalk.gray(message)}`);
        }
    }
}
//# sourceMappingURL=logger.js.map