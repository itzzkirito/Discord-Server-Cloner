import type { RateLimitConfig } from '../types/index.js';
export declare class RateLimiter {
    private queue;
    private running;
    private maxConcurrent;
    private maxRetries;
    private baseRetryDelay;
    constructor(config: RateLimitConfig);
    /**
     * Execute a function with rate limiting and automatic retry on rate limit errors
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Execute a function with automatic rate limit handling and retry logic
     */
    private executeWithRetry;
    /**
     * Check if an error is a rate limit error (429)
     */
    private isRateLimitError;
    /**
     * Extract retry-after value from error response
     */
    private extractRetryAfter;
    /**
     * Check if this is a global rate limit
     */
    private isGlobalRateLimit;
    /**
     * Log rate limit information if available
     */
    private logRateLimitInfo;
    /**
     * Sleep utility
     */
    private sleep;
    private processQueue;
    waitForCompletion(): Promise<void>;
}
//# sourceMappingURL=rateLimiter.d.ts.map