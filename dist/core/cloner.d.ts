import type { ClonerConfig, CloneResult } from '../types/index.js';
export declare class DiscordCloner {
    private sourceClient;
    private targetClient;
    private sourceREST;
    private targetREST;
    private config;
    private rateLimiter;
    private proxyManager;
    private axiosInstance;
    constructor(config: ClonerConfig);
    initialize(): Promise<void>;
    private loginClient;
    /**
     * Canary test method — verifies that the source & target clients,
     * tokens, REST APIs, and basic cloning operations are functional.
     *
     * This prevents full clone runs from failing midway.
     */
    canary(): Promise<void>;
    cloneGuild(sourceGuildId: string, targetGuildId?: string): Promise<CloneResult>;
    private createGuild;
    private deleteAllContent;
    private deleteChannels;
    private deleteEmojis;
    private deleteRoles;
    private cloneRoles;
    private logRoleError;
    private cloneChannels;
    private categorizeChannels;
    private getChannelType;
    private getChannelName;
    private getChannelPosition;
    private getParentId;
    private createChannel;
    private detectChannelType;
    private createCategoryChannel;
    private buildTextChannelOptions;
    private createAnnouncementChannel;
    private createForumChannel;
    private createTextChannel;
    private createVoiceChannel;
    private createChannelFallback;
    private cloneEmojis;
    private cloneSingleEmoji;
    private downloadEmoji;
    private uploadEmoji;
    destroy(): Promise<void>;
}
//# sourceMappingURL=cloner.d.ts.map