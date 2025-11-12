import chalk from 'chalk';

export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  private static formatTime(): string {
    return new Date().toLocaleTimeString();
  }

  static info(message: string): void {
    console.log(
      `${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.white(LogLevel.INFO)}${chalk.blue(']')} ${message}`
    );
  }

  static success(message: string): void {
    console.log(
      `${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.green(LogLevel.SUCCESS)}${chalk.blue(']')} ${chalk.green(message)}`
    );
  }

  static warning(message: string): void {
    console.log(
      `${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.yellow(LogLevel.WARNING)}${chalk.blue(']')} ${chalk.yellow(message)}`
    );
  }

  static error(message: string, error?: Error): void {
    console.error(
      `${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.red(LogLevel.ERROR)}${chalk.blue(']')} ${chalk.red(message)}`
    );
    if (error) {
      console.error(chalk.red(error.stack || error.message));
    }
  }

  static debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      console.log(
        `${chalk.blue('[')}${chalk.cyan(this.formatTime())}${chalk.blue(']')} ${chalk.blue('[')}${chalk.gray(LogLevel.DEBUG)}${chalk.blue(']')} ${chalk.gray(message)}`
      );
    }
  }
}

