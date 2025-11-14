import type { ProxyConfig } from '../types/index.js';
export declare class ProxyManager {
    private proxies;
    private currentIndex;
    private rotationMode;
    private cloneCount;
    private rotationInterval;
    private currentProxy;
    constructor(config?: ProxyConfig | ProxyConfig[], rotationInterval?: number);
    private initializeProxies;
    private getProxyUrl;
    /**
     * Increment clone count and rotate proxy if needed
     */
    incrementCloneCount(): void;
    /**
     * Rotate to next proxy
     */
    private rotateProxy;
    /**
     * Get the current proxy (doesn't rotate automatically)
     */
    getNextProxy(): ProxyConfig | undefined;
    /**
     * Get rotation interval
     */
    getRotationInterval(): number;
    /**
     * Set rotation interval
     */
    setRotationInterval(interval: number): void;
    /**
     * Get current clone count
     */
    getCloneCount(): number;
    /**
     * Reset clone count
     */
    resetCloneCount(): void;
    /**
     * Get current proxy configuration for axios/fetch
     */
    getProxyAgent(): any;
    /**
     * Get all proxies
     */
    getAllProxies(): ProxyConfig[];
    /**
     * Get proxy count
     */
    getProxyCount(): number;
    /**
     * Set rotation mode
     */
    setRotationMode(mode: 'round-robin' | 'random'): void;
    isEnabled(): boolean;
    destroy(): void;
}
//# sourceMappingURL=proxy.d.ts.map