import httpProxy from 'http-proxy';
import type { ProxyConfig } from '../types/index.js';
import { Logger } from './logger.js';

export class ProxyManager {
  private proxy?: httpProxy;
  private config?: ProxyConfig;

  constructor(config?: ProxyConfig) {
    this.config = config;
    if (config) {
      this.initializeProxy();
    }
  }

  private initializeProxy(): void {
    if (!this.config) return;

    this.proxy = httpProxy.createProxyServer({
      target: {
        host: this.config.host,
        port: this.config.port,
        protocol: this.config.protocol || 'http',
      },
      changeOrigin: true,
      secure: false,
    });

    if (this.config.username && this.config.password) {
      this.proxy.on('proxyReq', (proxyReq) => {
        const auth = Buffer.from(
          `${this.config!.username}:${this.config!.password}`
        ).toString('base64');
        proxyReq.setHeader('Proxy-Authorization', `Basic ${auth}`);
      });
    }

    this.proxy.on('error', (err) => {
      Logger.error('Proxy error:', err);
    });

    Logger.success(`Proxy initialized: ${this.config.protocol || 'http'}://${this.config.host}:${this.config.port}`);
  }

  getProxyAgent(): any {
    if (!this.proxy || !this.config) {
      return undefined;
    }

    // Return proxy configuration for use with axios/fetch
    const protocol = this.config.protocol || 'http';
    const auth = this.config.username && this.config.password
      ? `${this.config.username}:${this.config.password}@`
      : '';

    return {
      host: this.config.host,
      port: this.config.port,
      protocol,
      auth: this.config.username && this.config.password
        ? {
            username: this.config.username,
            password: this.config.password,
          }
        : undefined,
      proxyUrl: `${protocol}://${auth}${this.config.host}:${this.config.port}`,
    };
  }

  isEnabled(): boolean {
    return this.proxy !== undefined;
  }

  destroy(): void {
    if (this.proxy) {
      this.proxy.close();
      this.proxy = undefined;
    }
  }
}

