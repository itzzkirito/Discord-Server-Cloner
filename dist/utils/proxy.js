import { Logger } from './logger.js';
export class ProxyManager {
    proxies = [];
    currentIndex = 0;
    rotationMode = 'round-robin';
    cloneCount = 0;
    rotationInterval = 5; // Rotate every 5 clones
    currentProxy;
    constructor(config, rotationInterval) {
        if (config) {
            if (Array.isArray(config)) {
                this.proxies = config;
            }
            else {
                this.proxies = [config];
            }
            this.initializeProxies();
            // Set initial proxy
            if (this.proxies.length > 0) {
                this.currentProxy = this.proxies[0];
            }
        }
        if (rotationInterval !== undefined) {
            this.rotationInterval = rotationInterval;
        }
    }
    initializeProxies() {
        if (this.proxies.length === 0)
            return;
        if (this.proxies.length === 1) {
            Logger.success(`Proxy initialized: ${this.getProxyUrl(this.proxies[0])}`);
        }
        else {
            Logger.success(`Initialized ${this.proxies.length} proxies with ${this.rotationMode} rotation (rotates every ${this.rotationInterval} clones)`);
            this.proxies.forEach((proxy, index) => {
                Logger.info(`  [${index + 1}] ${this.getProxyUrl(proxy)}`);
            });
        }
    }
    getProxyUrl(proxy) {
        const protocol = proxy.protocol || 'http';
        const auth = proxy.username && proxy.password
            ? `${proxy.username}:***@`
            : '';
        return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
    }
    /**
     * Increment clone count and rotate proxy if needed
     */
    incrementCloneCount() {
        this.cloneCount++;
        // Rotate proxy every N clones
        if (this.proxies.length > 1 && this.cloneCount % this.rotationInterval === 0) {
            this.rotateProxy();
        }
    }
    /**
     * Rotate to next proxy
     */
    rotateProxy() {
        if (this.proxies.length <= 1)
            return;
        if (this.rotationMode === 'random') {
            const randomIndex = Math.floor(Math.random() * this.proxies.length);
            this.currentIndex = randomIndex;
        }
        else {
            // Round-robin
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        }
        this.currentProxy = this.proxies[this.currentIndex];
        Logger.info(`🔄 Proxy rotated to [${this.currentIndex + 1}/${this.proxies.length}]: ${this.getProxyUrl(this.currentProxy)}`);
    }
    /**
     * Get the current proxy (doesn't rotate automatically)
     */
    getNextProxy() {
        if (this.proxies.length === 0) {
            return undefined;
        }
        if (this.proxies.length === 1) {
            return this.proxies[0];
        }
        // Return current proxy, rotation happens via incrementCloneCount
        return this.currentProxy || this.proxies[0];
    }
    /**
     * Get rotation interval
     */
    getRotationInterval() {
        return this.rotationInterval;
    }
    /**
     * Set rotation interval
     */
    setRotationInterval(interval) {
        this.rotationInterval = interval;
        Logger.info(`Proxy rotation interval set to: every ${interval} clones`);
    }
    /**
     * Get current clone count
     */
    getCloneCount() {
        return this.cloneCount;
    }
    /**
     * Reset clone count
     */
    resetCloneCount() {
        this.cloneCount = 0;
    }
    /**
     * Get current proxy configuration for axios/fetch
     */
    getProxyAgent() {
        const proxy = this.getNextProxy();
        if (!proxy) {
            return undefined;
        }
        const protocol = proxy.protocol || 'http';
        const auth = proxy.username && proxy.password
            ? `${proxy.username}:${proxy.password}@`
            : '';
        return {
            host: proxy.host,
            port: proxy.port,
            protocol,
            auth: proxy.username && proxy.password
                ? {
                    username: proxy.username,
                    password: proxy.password,
                }
                : undefined,
            proxyUrl: `${protocol}://${auth}${proxy.host}:${proxy.port}`,
        };
    }
    /**
     * Get all proxies
     */
    getAllProxies() {
        return [...this.proxies];
    }
    /**
     * Get proxy count
     */
    getProxyCount() {
        return this.proxies.length;
    }
    /**
     * Set rotation mode
     */
    setRotationMode(mode) {
        this.rotationMode = mode;
        Logger.info(`Proxy rotation mode set to: ${mode}`);
    }
    isEnabled() {
        return this.proxies.length > 0;
    }
    destroy() {
        this.proxies = [];
        this.currentIndex = 0;
    }
}
//# sourceMappingURL=proxy.js.map