import { DiscordCloner } from './core/cloner.js';
import { loadConfig } from './config/loader.js';
import { Logger } from './utils/logger.js';
import ora from 'ora';
async function main() {
    const spinner = ora('Initializing Discord Cloner').start();
    try {
        // Load configuration
        spinner.text = 'Loading configuration...';
        const config = loadConfig();
        spinner.succeed('Configuration loaded');
        // Initialize cloner
        spinner.start('Initializing cloner...');
        const cloner = new DiscordCloner(config);
        await cloner.initialize();
        spinner.succeed('Cloner initialized');
        // Get source and target guild IDs from environment variables
        const sourceGuildId = process.env.SOURCE_GUILD_ID;
        const targetGuildId = process.env.TARGET_GUILD_ID;
        if (!sourceGuildId) {
            Logger.warning('SOURCE_GUILD_ID not set. Please set it in your .env file or environment variables.');
            Logger.info('Example usage:');
            Logger.info('  SOURCE_GUILD_ID=your_source_guild_id');
            Logger.info('  TARGET_GUILD_ID=your_target_guild_id (optional - leave empty to create new guild)');
            Logger.info('');
            Logger.info('If TARGET_GUILD_ID is set, the cloner will clone to that existing guild.');
            Logger.info('If TARGET_GUILD_ID is not set, a new guild will be created.');
            await cloner.destroy();
            return;
        }
        if (targetGuildId) {
            spinner.start(`Starting guild clone to existing guild (${targetGuildId})...`);
            Logger.info(`Cloning from ${sourceGuildId} to existing guild ${targetGuildId}`);
        }
        else {
            spinner.start('Starting guild clone (creating new guild)...');
            Logger.info(`Cloning from ${sourceGuildId} to a new guild`);
        }
        const result = await cloner.cloneGuild(sourceGuildId, targetGuildId);
        if (result.success) {
            spinner.succeed('Guild cloned successfully!');
            Logger.success(`Target Guild ID: ${result.data?.guildId}`);
        }
        else {
            spinner.fail('Guild clone failed');
            Logger.error(result.error || 'Unknown error');
        }
        // Cleanup
        await cloner.destroy();
    }
    catch (error) {
        spinner.fail('Failed to initialize');
        Logger.error('Fatal error:', error);
        process.exit(1);
    }
}
// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    Logger.error('Unhandled rejection:', error);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception:', error);
    process.exit(1);
});
// Run main function
main().catch((error) => {
    Logger.error('Main function error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map