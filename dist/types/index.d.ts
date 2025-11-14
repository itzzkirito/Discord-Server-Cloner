export interface ClonerConfig {
    sourceToken: string;
    targetToken: string;
    proxy?: ProxyConfig;
    proxies?: ProxyConfig[];
    options: ClonerOptions;
    rateLimit: RateLimitConfig;
}
export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    protocol?: 'http' | 'https';
}
export interface ClonerOptions {
    cloneGuilds: boolean;
    cloneChannels: boolean;
    cloneRoles: boolean;
    cloneEmojis: boolean;
    cloneBans?: boolean;
    cloneVoiceStates?: boolean;
}
export interface RateLimitConfig {
    delay: number;
    maxConcurrentRequests: number;
}
export interface CloneProgress {
    current: number;
    total: number;
    item: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
export interface CloneResult {
    success: boolean;
    item: string;
    error?: string;
    data?: any;
}
export interface GuildCloneData {
    name: string;
    icon?: string;
    description?: string;
    features?: string[];
    verificationLevel?: number;
    defaultMessageNotifications?: number;
    explicitContentFilter?: number;
    afkChannelId?: string;
    afkTimeout?: number;
    systemChannelId?: string;
    systemChannelFlags?: number;
}
//# sourceMappingURL=index.d.ts.map