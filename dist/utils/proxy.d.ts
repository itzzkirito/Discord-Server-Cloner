import type { ProxyConfig } from '../types/index.js';
export declare class ProxyManager {
    private proxy?;
    private config?;
    constructor(config?: ProxyConfig);
    private initializeProxy;
    getProxyAgent(): any;
    isEnabled(): boolean;
    destroy(): void;
}
//# sourceMappingURL=proxy.d.ts.map