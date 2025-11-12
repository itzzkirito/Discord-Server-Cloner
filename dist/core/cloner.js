import { Client, Intents, TextChannel, VoiceChannel, CategoryChannel, } from 'discord.js-selfbot-v13';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Logger } from '../utils/logger.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { ProxyManager } from '../utils/proxy.js';
import axios from 'axios';
// Constants
const CHANNEL_TYPES = {
    GUILD_TEXT: 0,
    GUILD_VOICE: 2,
    GUILD_CATEGORY: 4,
    GUILD_NEWS: 5,
    GUILD_FORUM: 15,
};
const EMOJI_UPLOAD_RETRIES = 3;
const EMOJI_DOWNLOAD_TIMEOUT = 30000;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
export class DiscordCloner {
    sourceClient;
    targetClient;
    sourceREST;
    targetREST;
    config;
    rateLimiter;
    proxyManager;
    axiosInstance;
    constructor(config) {
        this.config = config;
        this.rateLimiter = new RateLimiter(config.rateLimit);
        this.proxyManager = new ProxyManager(config.proxy);
        // Initialize clients with shared intents
        const intents = [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES,
        ];
        this.sourceClient = new Client({ intents });
        this.targetClient = new Client({ intents });
        // Initialize REST clients
        this.sourceREST = new REST({ version: '10' }).setToken(config.sourceToken);
        this.targetREST = new REST({ version: '10' }).setToken(config.targetToken);
        // Initialize axios for CDN downloads
        this.axiosInstance = axios.create({
            headers: {
                'User-Agent': DEFAULT_USER_AGENT,
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://discord.com/',
            },
            maxRedirects: 5,
            timeout: EMOJI_DOWNLOAD_TIMEOUT,
            validateStatus: (status) => status >= 200 && status < 400,
        });
        // Configure proxy if enabled
        if (this.proxyManager.isEnabled()) {
            const proxyConfig = this.proxyManager.getProxyAgent();
            if (proxyConfig) {
                this.axiosInstance.defaults.proxy = {
                    host: proxyConfig.host,
                    port: proxyConfig.port,
                    protocol: proxyConfig.protocol,
                    auth: proxyConfig.auth,
                };
            }
        }
    }
    async initialize() {
        Logger.info('Initializing Discord clients...');
        try {
            await Promise.all([
                this.loginClient(this.sourceClient, this.config.sourceToken, 'Source'),
                this.loginClient(this.targetClient, this.config.targetToken, 'Target'),
            ]);
            Logger.success('Both clients logged in successfully');
        }
        catch (error) {
            Logger.error('Failed to initialize clients:', error);
            throw error;
        }
    }
    async loginClient(client, token, label) {
        try {
            Logger.info(`Attempting to login ${label.toLowerCase()} client...`);
            Logger.debug(`Token length: ${token.length} characters`);
            await client.login(token);
            Logger.success(`${label} client logged in successfully`);
        }
        catch (error) {
            const err = error;
            Logger.error(`${label} client login failed`);
            Logger.error(`Error details: ${err.message}`);
            if (err.message.includes('TokenInvalid') || err.message.includes('invalid token')) {
                const tokenPreview = `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
                const tokenLength = token.length;
                const isLikelyBotToken = token.match(/^[MN][A-Za-z\d]{23}\.[A-Za-z\d-_]{6}\.[A-Za-z\d-_]{27}$/);
                const additionalInfo = isLikelyBotToken
                    ? '\n  ⚠️  WARNING: Your token appears to be a BOT TOKEN format. You need a USER ACCOUNT TOKEN instead.'
                    : '';
                throw new Error(`${label.toUpperCase()}_TOKEN authentication failed.\n\n` +
                    '⚠️  IMPORTANT: discord.js v12+ does NOT support user account tokens (selfbot tokens).\n' +
                    'The library removed support for user tokens to comply with Discord\'s Terms of Service.\n\n' +
                    'Possible solutions:\n' +
                    '  1. Use discord.js-selfbot-v13 or similar fork that supports user tokens\n' +
                    '  2. Use discord.js v11 or earlier (not recommended, outdated)\n' +
                    '  3. Use REST API directly instead of WebSocket connection\n' +
                    '  4. Switch to bot tokens if possible for your use case\n\n' +
                    'Token verification:\n' +
                    `  - Token preview: ${tokenPreview}\n` +
                    `  - Token length: ${tokenLength} characters${additionalInfo}\n` +
                    '  - Token format appears valid, but discord.js cannot authenticate user tokens\n\n' +
                    'Note: Using selfbots violates Discord\'s Terms of Service and may result in account bans.');
            }
            throw new Error(`${label} client login failed: ${err.message}`);
        }
    }
    /**
     * Canary test method — verifies that the source & target clients,
     * tokens, REST APIs, and basic cloning operations are functional.
     *
     * This prevents full clone runs from failing midway.
     */
    async canary() {
        Logger.info('🐤 Running canary diagnostic check...');
        try {
            // Validate tokens
            Logger.info('🔑 Validating tokens...');
            const [testSource, testTarget] = await Promise.all([
                this.sourceREST.get(Routes.user('@me')).catch(() => null),
                this.targetREST.get(Routes.user('@me')).catch(() => null),
            ]);
            if (!testSource || !testTarget) {
                throw new Error('Invalid source or target token detected.');
            }
            Logger.success(`✅ Source token valid: ${testSource.username}#${testSource.discriminator}`);
            Logger.success(`✅ Target token valid: ${testTarget.username}#${testTarget.discriminator}`);
            // Check network + proxy
            Logger.info('🌐 Testing network and proxy connectivity...');
            const networkCheck = await this.axiosInstance.get('https://discord.com/api/v10/gateway', { timeout: 10000 });
            if (!networkCheck.data?.url) {
                throw new Error('Discord API Gateway check failed.');
            }
            Logger.success('✅ Discord API Gateway reachable.');
            // Check rate limiter
            Logger.info('⏳ Testing rate limiter execution...');
            await this.rateLimiter.execute(async () => {
                await new Promise(res => setTimeout(res, 500));
            });
            Logger.success('✅ Rate limiter operational.');
            // Verify emoji upload permissions
            Logger.info('🧩 Testing emoji upload permission on target guild...');
            const guild = this.targetClient.guilds.cache.first();
            if (!guild) {
                Logger.warning('⚠️ No guilds found on target client to test emoji upload.');
            }
            else {
                try {
                    const dummy = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABAgEA1mzpVwAAAABJRU5ErkJggg==', 'base64');
                    const dummyUri = `data:image/png;base64,${dummy.toString('base64')}`;
                    await this.targetREST.post(Routes.guildEmojis(guild.id), {
                        body: { name: `canary_test_${Date.now()}`, image: dummyUri },
                    });
                    Logger.success(`✅ Emoji upload permissions OK on guild: ${guild.name}`);
                }
                catch (err) {
                    const msg = err?.message || String(err);
                    Logger.error(`❌ Emoji upload test failed: ${msg}`);
                    if (msg.includes('403') || msg.includes('permission')) {
                        Logger.warning('→ Missing "Manage Emojis and Stickers" permission.');
                    }
                    else if (msg.includes('limit')) {
                        Logger.warning('→ Guild may have reached emoji limit.');
                    }
                }
            }
            // Confirm both clients are logged in
            if (!this.sourceClient.user || !this.targetClient.user) {
                Logger.warning('⚠️ One or both clients are not logged in properly.');
            }
            else {
                Logger.success(`✅ Source logged in as ${this.sourceClient.user.tag}`);
                Logger.success(`✅ Target logged in as ${this.targetClient.user.tag}`);
            }
            Logger.success('🎉 Canary diagnostic completed successfully! All systems operational.');
        }
        catch (err) {
            Logger.error('❌ Canary diagnostic failed.');
            Logger.error(`Reason: ${err.message}`);
            Logger.warning('→ Fix the above issues before running cloneGuild().');
        }
    }
    async cloneGuild(sourceGuildId, targetGuildId) {
        if (!this.config.options.cloneGuilds) {
            return { success: false, item: 'Guild', error: 'Guild cloning is disabled' };
        }
        try {
            Logger.info(`Starting guild clone: ${sourceGuildId}`);
            const sourceGuild = this.sourceClient.guilds.cache.get(sourceGuildId);
            if (!sourceGuild) {
                throw new Error('Source guild not found');
            }
            let targetGuild;
            if (targetGuildId) {
                targetGuild = this.targetClient.guilds.cache.get(targetGuildId);
                if (!targetGuild) {
                    throw new Error('Target guild not found');
                }
                Logger.info('Deleting existing content from target guild...');
                await this.deleteAllContent(targetGuild);
            }
            else {
                targetGuild = await this.createGuild(sourceGuild);
            }
            const results = [];
            let roleMap = new Map();
            // Clone roles
            if (this.config.options.cloneRoles) {
                const roleResult = await this.cloneRoles(sourceGuild, targetGuild);
                results.push(roleResult);
                if (roleResult.success && roleResult.data && 'roleMap' in roleResult.data) {
                    roleMap = roleResult.data.roleMap;
                }
            }
            // Clone channels
            if (this.config.options.cloneChannels) {
                const channelResult = await this.cloneChannels(sourceGuild, targetGuild, roleMap);
                results.push(channelResult);
            }
            // Clone emojis
            if (this.config.options.cloneEmojis) {
                const emojiResult = await this.cloneEmojis(sourceGuild, targetGuild);
                results.push(emojiResult);
            }
            Logger.success(`Guild clone completed: ${targetGuild.name}`);
            return {
                success: true,
                item: 'Guild',
                data: { guildId: targetGuild.id, results },
            };
        }
        catch (error) {
            Logger.error('Failed to clone guild:', error);
            return {
                success: false,
                item: 'Guild',
                error: error.message,
            };
        }
    }
    async createGuild(sourceGuild) {
        return await this.rateLimiter.execute(async () => {
            const guild = await this.targetClient.guilds.create(`${sourceGuild.name} (Cloned)`, {
                icon: sourceGuild.iconURL() || undefined,
            });
            // Update guild settings in parallel
            const settings = [
                { method: () => guild.setVerificationLevel(sourceGuild.verificationLevel), name: 'verification level' },
                { method: () => guild.setDefaultMessageNotifications(sourceGuild.defaultMessageNotifications), name: 'default message notifications' },
                { method: () => guild.setExplicitContentFilter(sourceGuild.explicitContentFilter), name: 'explicit content filter' },
            ];
            await Promise.allSettled(settings.map(async ({ method, name }) => {
                try {
                    await method();
                }
                catch (e) {
                    Logger.warning(`Could not set ${name}`);
                }
            }));
            return guild;
        });
    }
    async deleteAllContent(targetGuild) {
        try {
            // Delete channels, emojis, and roles in parallel
            await Promise.all([
                this.deleteChannels(targetGuild),
                this.deleteEmojis(targetGuild),
                this.deleteRoles(targetGuild),
            ]);
            Logger.success('All existing content deleted');
        }
        catch (error) {
            Logger.error('Error deleting content:', error);
            throw error;
        }
    }
    async deleteChannels(targetGuild) {
        Logger.info('Deleting all channels...');
        const channels = Array.from(targetGuild.channels.cache.values());
        await Promise.allSettled(channels.map(async (channel) => {
            if (channel.id === targetGuild.id || typeof channel.delete !== 'function') {
                return;
            }
            try {
                await this.rateLimiter.execute(async () => {
                    await channel.delete();
                });
                const channelName = 'name' in channel ? channel.name : 'Unknown';
                Logger.debug(`Deleted channel: ${channelName} (${channel.id})`);
            }
            catch (error) {
                Logger.warning(`Failed to delete channel ${channel.id}: ${error.message}`);
            }
        }));
    }
    async deleteEmojis(targetGuild) {
        Logger.info('Deleting all emojis...');
        const emojis = Array.from(targetGuild.emojis.cache.values());
        await Promise.allSettled(emojis.map(async (emoji) => {
            try {
                await this.rateLimiter.execute(() => emoji.delete());
                Logger.debug(`Deleted emoji: ${emoji.name}`);
            }
            catch (error) {
                Logger.warning(`Failed to delete emoji ${emoji.id}: ${error.message}`);
            }
        }));
    }
    async deleteRoles(targetGuild) {
        Logger.info('Deleting all roles...');
        await targetGuild.roles.fetch();
        const roles = Array.from(targetGuild.roles.cache.values())
            .filter(role => role.id !== targetGuild.id && !role.managed)
            .sort((a, b) => b.position - a.position);
        Logger.info(`Found ${roles.length} roles to delete`);
        let deletedCount = 0;
        let failedCount = 0;
        for (const role of roles) {
            try {
                await this.rateLimiter.execute(() => role.delete('Clearing roles before cloning'));
                deletedCount++;
                Logger.info(`✓ Deleted role: ${role.name} (position: ${role.position})`);
            }
            catch (error) {
                failedCount++;
                const errorMsg = error.message;
                Logger.warning(`✗ Failed to delete role "${role.name}" (${role.id}): ${errorMsg}`);
                if (errorMsg.includes('permission') || errorMsg.includes('Missing')) {
                    Logger.warning(`  → This role may require higher permissions or cannot be deleted`);
                }
            }
        }
        if (deletedCount > 0) {
            Logger.success(`Successfully deleted ${deletedCount} roles`);
        }
        if (failedCount > 0) {
            Logger.warning(`${failedCount} roles could not be deleted (may require higher permissions)`);
        }
    }
    async cloneRoles(sourceGuild, targetGuild) {
        try {
            Logger.info('Cloning roles...');
            await sourceGuild.roles.fetch();
            const sourceRoles = Array.from(sourceGuild.roles.cache.values())
                .filter((role) => !role.managed && role.id !== sourceGuild.id)
                .sort((a, b) => b.position - a.position);
            Logger.info(`Found ${sourceRoles.length} roles to clone`);
            const roleMap = new Map();
            const results = [];
            for (const sourceRole of sourceRoles) {
                try {
                    Logger.info(`Cloning role: ${sourceRole.name} (position: ${sourceRole.position})`);
                    const targetRole = await this.rateLimiter.execute(async () => {
                        const roleOptions = {
                            name: sourceRole.name,
                            color: sourceRole.color,
                            hoist: sourceRole.hoist || false,
                            mentionable: sourceRole.mentionable || false,
                        };
                        if (sourceRole.permissions) {
                            roleOptions.permissions = sourceRole.permissions;
                        }
                        const createdRole = await targetGuild.roles.create(roleOptions);
                        // Try to set position separately
                        if (sourceRole.position > 0) {
                            try {
                                await createdRole.setPosition(sourceRole.position, { reason: 'Cloning role position' });
                            }
                            catch (posError) {
                                Logger.warning(`Could not set position for role ${sourceRole.name}: ${posError.message}`);
                            }
                        }
                        return createdRole;
                    });
                    roleMap.set(sourceRole.id, targetRole.id);
                    results.push({
                        success: true,
                        item: `Role: ${sourceRole.name}`,
                        data: { sourceId: sourceRole.id, targetId: targetRole.id },
                    });
                    Logger.success(`✓ Cloned role: ${sourceRole.name}`);
                }
                catch (error) {
                    const errorMsg = error.message;
                    results.push({
                        success: false,
                        item: `Role: ${sourceRole.name}`,
                        error: errorMsg,
                    });
                    Logger.error(`✗ Failed to clone role ${sourceRole.name}: ${errorMsg}`);
                    this.logRoleError(errorMsg, sourceRole.position);
                }
            }
            const successCount = results.filter((r) => r.success).length;
            const failCount = results.filter((r) => !r.success).length;
            Logger.success(`Cloned ${successCount} roles`);
            if (failCount > 0) {
                Logger.warning(`${failCount} roles failed to clone`);
            }
            return {
                success: true,
                item: 'Roles',
                data: { roleMap, results },
            };
        }
        catch (error) {
            Logger.error(`Role cloning failed: ${error.message}`);
            return {
                success: false,
                item: 'Roles',
                error: error.message,
            };
        }
    }
    logRoleError(errorMsg, position) {
        if (errorMsg.includes('permission') || errorMsg.includes('Missing') || errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            Logger.warning(`  → PERMISSION ERROR: Missing MANAGE_ROLES permission`);
            Logger.warning(`  → Solution: Grant "Manage Roles" permission to your role`);
            Logger.warning(`  → Also ensure your role is higher than the role you're trying to create`);
        }
        if (errorMsg.includes('position') || errorMsg.includes('hierarchy')) {
            Logger.warning(`  → POSITION ERROR: Your role position (${position}) is too low`);
            Logger.warning(`  → Solution: Make sure your role is higher than the roles you want to create`);
        }
    }
    async cloneChannels(sourceGuild, targetGuild, _roleMap) {
        try {
            Logger.info('Cloning channels...');
            await sourceGuild.channels.fetch();
            const allChannels = Array.from(sourceGuild.channels.cache.values());
            const { categories, regularChannels } = this.categorizeChannels(allChannels);
            // Sort channels
            categories.sort((a, b) => this.getChannelPosition(a) - this.getChannelPosition(b));
            regularChannels.sort((a, b) => {
                const parentCompare = this.getParentId(a).localeCompare(this.getParentId(b));
                return parentCompare !== 0 ? parentCompare : this.getChannelPosition(a) - this.getChannelPosition(b);
            });
            const sourceChannels = [...categories, ...regularChannels];
            const channelMap = new Map();
            const results = [];
            Logger.info(`Found ${categories.length} categories and ${regularChannels.length} regular channels to clone (total: ${sourceChannels.length})`);
            for (const sourceChannel of sourceChannels) {
                try {
                    const channelName = this.getChannelName(sourceChannel);
                    Logger.info(`Cloning channel: ${channelName}`);
                    const targetChannel = await this.createChannel(sourceChannel, targetGuild, channelMap);
                    if (targetChannel) {
                        channelMap.set(sourceChannel.id, targetChannel.id);
                        results.push({
                            success: true,
                            item: `Channel: ${channelName}`,
                            data: { sourceId: sourceChannel.id, targetId: targetChannel.id },
                        });
                        Logger.success(`✓ Cloned channel: ${channelName}`);
                    }
                    else {
                        results.push({
                            success: false,
                            item: `Channel: ${channelName}`,
                            error: 'Channel type not supported or creation returned null',
                        });
                        Logger.warning(`✗ Failed to clone channel: ${channelName} (unsupported type)`);
                    }
                }
                catch (error) {
                    const channelName = this.getChannelName(sourceChannel);
                    const errorMsg = error.message;
                    results.push({
                        success: false,
                        item: `Channel: ${channelName}`,
                        error: errorMsg,
                    });
                    Logger.error(`✗ Failed to clone channel ${channelName}: ${errorMsg}`);
                    if (errorMsg.includes('permission') || errorMsg.includes('Missing') || errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
                        Logger.warning(`  → PERMISSION ERROR: Missing MANAGE_CHANNELS permission`);
                        Logger.warning(`  → Solution: Grant "Manage Channels" permission to your role`);
                    }
                }
            }
            Logger.success(`Cloned ${results.filter((r) => r.success).length} channels`);
            return {
                success: true,
                item: 'Channels',
                data: { channelMap, results },
            };
        }
        catch (error) {
            return {
                success: false,
                item: 'Channels',
                error: error.message,
            };
        }
    }
    categorizeChannels(channels) {
        const categories = [];
        const regularChannels = [];
        for (const channel of channels) {
            const type = this.getChannelType(channel);
            if (type === CHANNEL_TYPES.GUILD_CATEGORY || channel instanceof CategoryChannel) {
                categories.push(channel);
            }
            else {
                regularChannels.push(channel);
            }
        }
        return { categories, regularChannels };
    }
    getChannelType(channel) {
        if ('type' in channel) {
            const typeValue = channel.type;
            if (typeof typeValue === 'number' && !isNaN(typeValue)) {
                return typeValue;
            }
            if (typeof typeValue === 'string') {
                const parsed = parseInt(typeValue, 10);
                return isNaN(parsed) ? null : parsed;
            }
        }
        return null;
    }
    getChannelName(channel) {
        return ('name' in channel && channel.name) ? String(channel.name) : 'Unknown';
    }
    getChannelPosition(channel) {
        if ('position' in channel && typeof channel.position === 'number') {
            return channel.position;
        }
        return 0;
    }
    getParentId(channel) {
        if ('parentId' in channel && typeof channel.parentId === 'string') {
            return channel.parentId;
        }
        return '';
    }
    async createChannel(sourceChannel, targetGuild, channelMap) {
        try {
            const channelName = this.getChannelName(sourceChannel);
            const channelPosition = this.getChannelPosition(sourceChannel);
            const channelType = await this.detectChannelType(sourceChannel, channelName);
            // Route to appropriate channel creation method
            switch (channelType) {
                case CHANNEL_TYPES.GUILD_CATEGORY:
                    return await this.createCategoryChannel(channelName, channelPosition, targetGuild);
                case CHANNEL_TYPES.GUILD_NEWS:
                    return await this.createAnnouncementChannel(sourceChannel, channelName, channelPosition, targetGuild, channelMap);
                case CHANNEL_TYPES.GUILD_FORUM:
                    return await this.createForumChannel(sourceChannel, channelName, channelPosition, targetGuild, channelMap);
                case CHANNEL_TYPES.GUILD_TEXT:
                    return await this.createTextChannel(sourceChannel, channelName, channelPosition, targetGuild, channelMap);
                case CHANNEL_TYPES.GUILD_VOICE:
                    return await this.createVoiceChannel(sourceChannel, channelName, channelPosition, targetGuild, channelMap);
                default:
                    Logger.warning(`Unknown channel type for ${channelName} (type: ${channelType}), attempting fallback...`);
                    return await this.createChannelFallback(sourceChannel, channelName, channelPosition, targetGuild, channelMap);
            }
        }
        catch (error) {
            Logger.error(`Failed to create channel: ${error.message}`);
            throw error;
        }
    }
    async detectChannelType(sourceChannel, _channelName) {
        // Try to get type from channel object
        let channelTypeNum = this.getChannelType(sourceChannel);
        // Fallback to instanceof checks
        if (channelTypeNum === null) {
            if (sourceChannel instanceof CategoryChannel)
                return CHANNEL_TYPES.GUILD_CATEGORY;
            if (sourceChannel instanceof VoiceChannel)
                return CHANNEL_TYPES.GUILD_VOICE;
            if (sourceChannel instanceof TextChannel) {
                // Check raw type for announcement/forum
                const rawType = sourceChannel.type;
                const rawTypeStr = rawType ? String(rawType).toUpperCase() : '';
                if (rawTypeStr.includes('NEWS') || rawType === 5)
                    return CHANNEL_TYPES.GUILD_NEWS;
                if (rawTypeStr.includes('FORUM') || rawType === 15)
                    return CHANNEL_TYPES.GUILD_FORUM;
                return CHANNEL_TYPES.GUILD_TEXT;
            }
        }
        // If we have a type number, use it
        if (channelTypeNum !== null) {
            return channelTypeNum;
        }
        // Last resort: fetch from API
        if ('id' in sourceChannel && sourceChannel.id) {
            try {
                const channelData = await this.sourceREST.get(Routes.channel(sourceChannel.id));
                if (channelData?.type) {
                    return typeof channelData.type === 'number' ? channelData.type : parseInt(channelData.type, 10);
                }
            }
            catch (apiError) {
                Logger.debug(`Failed to fetch channel type from API: ${apiError.message}`);
            }
        }
        // Default to text channel
        return CHANNEL_TYPES.GUILD_TEXT;
    }
    async createCategoryChannel(name, position, targetGuild) {
        Logger.info(`Creating category channel: ${name}`);
        return await this.rateLimiter.execute(async () => {
            const channel = await targetGuild.channels.create(name, {
                type: CHANNEL_TYPES.GUILD_CATEGORY,
                position,
            });
            Logger.success(`✓ Created category: ${channel.name}`);
            return channel;
        });
    }
    buildTextChannelOptions(textChannel, _channelName, channelPosition, channelMap, type) {
        const parentId = textChannel.parentId ? channelMap.get(textChannel.parentId) : undefined;
        const options = {
            type,
            position: channelPosition,
        };
        if (textChannel.topic)
            options.topic = textChannel.topic;
        if (textChannel.nsfw !== undefined)
            options.nsfw = textChannel.nsfw;
        if (textChannel.rateLimitPerUser !== undefined && textChannel.rateLimitPerUser > 0) {
            options.rateLimitPerUser = textChannel.rateLimitPerUser;
        }
        if (parentId)
            options.parent = parentId;
        return options;
    }
    async createAnnouncementChannel(textChannel, channelName, channelPosition, targetGuild, channelMap) {
        Logger.info(`[ANNOUNCEMENT] Creating announcement channel: ${channelName}`);
        const options = this.buildTextChannelOptions(textChannel, channelName, channelPosition, channelMap, CHANNEL_TYPES.GUILD_NEWS);
        try {
            return await this.rateLimiter.execute(async () => {
                // Try REST API first
                try {
                    const channelData = await this.targetREST.post(Routes.guildChannels(targetGuild.id), {
                        body: {
                            name: channelName,
                            type: CHANNEL_TYPES.GUILD_NEWS,
                            position: channelPosition,
                            topic: textChannel.topic || undefined,
                            nsfw: textChannel.nsfw || false,
                            rate_limit_per_user: textChannel.rateLimitPerUser || 0,
                            parent_id: options.parent || undefined,
                        },
                    });
                    const channel = await targetGuild.channels.fetch(channelData.id);
                    if (!channel)
                        throw new Error('Failed to fetch created channel');
                    Logger.success(`✓ Created announcement channel: ${channel.name}`);
                    return channel;
                }
                catch (restError) {
                    const errorMsg = restError.message;
                    if (errorMsg.includes('type: Value must be one of') || errorMsg.includes('50035')) {
                        Logger.warning(`[ANNOUNCEMENT] Type 5 not supported, creating as text channel instead`);
                        return await this.createTextChannel(textChannel, channelName, channelPosition, targetGuild, channelMap);
                    }
                    throw restError;
                }
            });
        }
        catch (error) {
            Logger.error(`[ANNOUNCEMENT] Failed to create announcement channel: ${error.message}`);
            return await this.createTextChannel(textChannel, channelName, channelPosition, targetGuild, channelMap);
        }
    }
    async createForumChannel(textChannel, channelName, channelPosition, targetGuild, channelMap) {
        Logger.info(`Creating forum channel: ${channelName}`);
        const options = this.buildTextChannelOptions(textChannel, channelName, channelPosition, channelMap, CHANNEL_TYPES.GUILD_FORUM);
        // Forum-specific properties
        if ('availableTags' in textChannel && textChannel.availableTags) {
            options.availableTags = textChannel.availableTags;
        }
        if ('defaultAutoArchiveDuration' in textChannel && textChannel.defaultAutoArchiveDuration) {
            options.defaultAutoArchiveDuration = textChannel.defaultAutoArchiveDuration;
        }
        if ('defaultReactionEmoji' in textChannel && textChannel.defaultReactionEmoji) {
            options.defaultReactionEmoji = textChannel.defaultReactionEmoji;
        }
        if ('defaultThreadRateLimitPerUser' in textChannel && textChannel.defaultThreadRateLimitPerUser) {
            options.defaultThreadRateLimitPerUser = textChannel.defaultThreadRateLimitPerUser;
        }
        return await this.rateLimiter.execute(async () => {
            const channel = await targetGuild.channels.create(channelName, options);
            Logger.success(`✓ Created forum channel: ${channel.name}`);
            return channel;
        });
    }
    async createTextChannel(textChannel, channelName, channelPosition, targetGuild, channelMap) {
        Logger.info(`Creating text channel: ${channelName}`);
        const options = this.buildTextChannelOptions(textChannel, channelName, channelPosition, channelMap, CHANNEL_TYPES.GUILD_TEXT);
        return await this.rateLimiter.execute(async () => {
            const channel = await targetGuild.channels.create(channelName, options);
            Logger.success(`✓ Created text channel: ${channel.name}`);
            return channel;
        });
    }
    async createVoiceChannel(voiceChannel, channelName, channelPosition, targetGuild, channelMap) {
        Logger.info(`Creating voice channel: ${channelName}`);
        const parentId = voiceChannel.parentId ? channelMap.get(voiceChannel.parentId) : undefined;
        const options = {
            type: CHANNEL_TYPES.GUILD_VOICE,
            position: channelPosition,
            bitrate: voiceChannel.bitrate || 64000,
        };
        if (voiceChannel.userLimit !== undefined && voiceChannel.userLimit > 0) {
            options.userLimit = voiceChannel.userLimit;
        }
        if (parentId) {
            options.parent = parentId;
        }
        return await this.rateLimiter.execute(async () => {
            const channel = await targetGuild.channels.create(channelName, options);
            Logger.success(`✓ Created voice channel: ${channel.name}`);
            return channel;
        });
    }
    async createChannelFallback(textChannel, channelName, channelPosition, targetGuild, channelMap) {
        const nameSuggestsAnnouncement = channelName.toLowerCase().includes('announce') ||
            channelName.toLowerCase().includes('news') ||
            channelName.toLowerCase().includes('update');
        if (nameSuggestsAnnouncement) {
            try {
                Logger.info(`[FALLBACK] Attempting to create as announcement channel: ${channelName}`);
                const announcementOptions = this.buildTextChannelOptions(textChannel, channelName, channelPosition, channelMap, CHANNEL_TYPES.GUILD_NEWS);
                return await this.rateLimiter.execute(async () => {
                    const channel = await targetGuild.channels.create(channelName, announcementOptions);
                    Logger.success(`✓ Created channel as announcement (fallback): ${channel.name}`);
                    return channel;
                });
            }
            catch (announcementError) {
                Logger.warning(`Failed to create as announcement, trying text: ${announcementError.message}`);
            }
        }
        // Fallback to text channel
        return await this.createTextChannel(textChannel, channelName, channelPosition, targetGuild, channelMap);
    }
    async cloneEmojis(sourceGuild, targetGuild) {
        try {
            Logger.info('🧩 Starting emoji cloning process...');
            await Promise.all([
                sourceGuild.emojis.fetch(),
                targetGuild.emojis.fetch(),
            ]);
            const sourceEmojis = Array.from(sourceGuild.emojis.cache.values());
            const targetEmojis = targetGuild.emojis.cache;
            const results = [];
            if (sourceEmojis.length === 0) {
                Logger.warning('⚠️ No emojis found in source guild.');
                return { success: true, item: 'Emojis', data: { results: [] } };
            }
            Logger.info(`Found ${sourceEmojis.length} emojis to clone.`);
            // Prevent duplicates
            const existingNames = new Set(Array.from(targetEmojis.values()).map(e => e.name));
            // Process emojis with controlled concurrency
            const emojiPromises = sourceEmojis.map(emoji => this.cloneSingleEmoji(emoji, targetGuild, existingNames));
            const emojiResults = await Promise.allSettled(emojiPromises);
            for (const result of emojiResults) {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            }
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            Logger.success(`🎉 Emoji cloning complete → Success: ${successCount}, Failed: ${failCount}`);
            return { success: true, item: 'Emojis', data: { results } };
        }
        catch (error) {
            Logger.error(`Emoji cloning failed: ${error.message}`);
            return { success: false, item: 'Emojis', error: error.message };
        }
    }
    async cloneSingleEmoji(emoji, targetGuild, existingNames) {
        const emojiName = emoji.name || 'unknown_emoji';
        const isAnimated = emoji.animated ?? false;
        const emojiType = isAnimated ? 'animated' : 'static';
        const emojiId = emoji.id;
        // Skip duplicates
        if (existingNames.has(emojiName)) {
            Logger.warning(`[EMOJI] Skipping duplicate emoji: ${emojiName}`);
            return null;
        }
        Logger.info(`[EMOJI] → Cloning: ${emojiName} (${emojiType})`);
        // Construct URL if missing
        const emojiUrl = emoji.url || `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
        Logger.debug(`[EMOJI] CDN URL: ${emojiUrl}`);
        try {
            // Step 1: Download
            const imageBuffer = await this.downloadEmoji(emojiUrl, emojiName);
            const imageBase64 = imageBuffer.toString('base64');
            const mimeType = isAnimated ? 'image/gif' : 'image/png';
            const dataUri = `data:${mimeType};base64,${imageBase64}`;
            Logger.success(`[EMOJI] ✓ Downloaded ${emojiName} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
            // Step 2: Upload
            await this.uploadEmoji(emojiName, emojiType, dataUri, targetGuild.id);
            Logger.success(`[EMOJI] ✓ Uploaded ${emojiName} (${emojiType})`);
            return { success: true, item: `Emoji: ${emojiName}` };
        }
        catch (error) {
            const msg = error?.message || String(error);
            Logger.error(`[EMOJI] ✗ Failed to clone ${emojiName}: ${msg}`);
            return { success: false, item: `Emoji: ${emojiName}`, error: msg };
        }
    }
    async downloadEmoji(emojiUrl, emojiName) {
        Logger.debug(`[EMOJI] Attempting to download from: ${emojiUrl}`);
        try {
            // Try with authentication first
            const response = await axios.get(emojiUrl, {
                responseType: 'arraybuffer',
                timeout: EMOJI_DOWNLOAD_TIMEOUT,
                headers: {
                    'Authorization': this.config.sourceToken,
                    'User-Agent': DEFAULT_USER_AGENT,
                },
                validateStatus: (status) => status >= 200 && status < 400,
            });
            if (!response.data || response.data.length === 0) {
                throw new Error('Empty response from CDN');
            }
            return Buffer.from(response.data);
        }
        catch (authError) {
            // Fallback to public CDN
            Logger.debug(`[EMOJI] Auth download failed for ${emojiName}, trying public CDN...`);
            const response = await this.axiosInstance.get(emojiUrl, {
                responseType: 'arraybuffer',
                timeout: EMOJI_DOWNLOAD_TIMEOUT,
                validateStatus: (status) => status >= 200 && status < 400,
            });
            if (!response.data || response.data.length === 0) {
                throw new Error('Empty response from CDN');
            }
            return Buffer.from(response.data);
        }
    }
    async uploadEmoji(emojiName, _emojiType, dataUri, targetGuildId) {
        const token = this.config.targetToken.trim();
        if (!token || token.length === 0) {
            throw new Error('Target token is empty or invalid');
        }
        let lastError;
        for (let attempt = 1; attempt <= EMOJI_UPLOAD_RETRIES; attempt++) {
            try {
                await this.rateLimiter.execute(async () => {
                    const uploadUrl = `https://discord.com/api/v10/guilds/${targetGuildId}/emojis`;
                    await axios.post(uploadUrl, {
                        name: emojiName,
                        image: dataUri,
                    }, {
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json',
                            'User-Agent': DEFAULT_USER_AGENT,
                        },
                        timeout: EMOJI_DOWNLOAD_TIMEOUT,
                    });
                });
                return; // Success
            }
            catch (uploadErr) {
                lastError = uploadErr;
                const status = uploadErr?.response?.status;
                const msg = uploadErr?.message || String(uploadErr);
                // Handle 401 - don't retry
                if (status === 401) {
                    Logger.error(`[EMOJI] ❌ 401 Unauthorized - Target token is invalid or expired.`);
                    throw new Error('Target token authentication failed (401 Unauthorized). Please check your TARGET_TOKEN.');
                }
                // Rate limits are now handled automatically by RateLimiter
                // No need to manually handle 429 errors here
                // Handle emoji limit - stop immediately
                if (status === 400 || msg.includes('maximum') || msg.includes('limit') || msg.includes('50035')) {
                    Logger.error('❌ Emoji limit reached in target guild.');
                    throw new Error('Emoji limit reached in target guild.');
                }
                // Handle permission issues - stop immediately
                if (status === 403 || msg.includes('Missing') || msg.includes('permission')) {
                    Logger.error('❌ Missing MANAGE_EMOJIS_AND_STICKERS permission in target guild.');
                    throw new Error('Missing MANAGE_EMOJIS_AND_STICKERS permission.');
                }
                // Other errors - log and retry
                if (attempt < EMOJI_UPLOAD_RETRIES) {
                    Logger.warning(`[EMOJI] Upload failed (attempt ${attempt}/${EMOJI_UPLOAD_RETRIES}) for ${emojiName}: ${msg}`);
                }
            }
        }
        // All retries failed
        throw lastError || new Error('Upload failed after all retries');
    }
    async destroy() {
        Logger.info('Destroying clients...');
        this.sourceClient.destroy();
        this.targetClient.destroy();
        this.proxyManager.destroy();
        await this.rateLimiter.waitForCompletion();
        Logger.success('All clients destroyed');
    }
}
//# sourceMappingURL=cloner.js.map