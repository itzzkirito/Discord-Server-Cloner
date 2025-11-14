import { config } from 'dotenv';
import { defaultClonerOptions, defaultRateLimitConfig } from './defaults.js';
import { Logger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
// Get directory path for .env file location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
// Load .env file explicitly
const envResult = config({ path: envPath });
// Helper function to mask token for safe logging
function maskToken(token) {
    if (!token || token.length < 8)
        return '***';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}
export function loadConfig() {
    // Check if .env file was loaded
    if (envResult.error && !process.env.SOURCE_TOKEN) {
        Logger.warning(`Could not load .env file from: ${envPath}`);
        Logger.warning('Make sure you have created a .env file in the project root directory.');
    }
    const sourceToken = process.env.SOURCE_TOKEN?.trim();
    const targetToken = process.env.TARGET_TOKEN?.trim();
    // Debug logging (only if DEBUG is enabled)
    if (process.env.DEBUG === 'true') {
        Logger.debug(`Loading tokens from: ${envPath}`);
        Logger.debug(`SOURCE_TOKEN loaded: ${sourceToken ? `Yes (${maskToken(sourceToken)}, length: ${sourceToken.length})` : 'No'}`);
        Logger.debug(`TARGET_TOKEN loaded: ${targetToken ? `Yes (${maskToken(targetToken)}, length: ${targetToken.length})` : 'No'}`);
    }
    if (!sourceToken || sourceToken.length === 0) {
        Logger.error(`SOURCE_TOKEN is missing or empty.`);
        Logger.error(`Expected .env file location: ${envPath}`);
        Logger.error('Please ensure your .env file contains: SOURCE_TOKEN=your_user_account_token_here');
        Logger.error('Note: SOURCE_TOKEN must be a user account token (selfbot token), not a bot token.');
        throw new Error('SOURCE_TOKEN is missing or empty. Please set SOURCE_TOKEN in your .env file or environment variables.\n' +
            `Expected .env file location: ${envPath}\n` +
            'Note: SOURCE_TOKEN must be a user account token (selfbot token), not a bot token.\n' +
            'Example: SOURCE_TOKEN=your_user_account_token_here');
    }
    if (!targetToken || targetToken.length === 0) {
        Logger.error(`TARGET_TOKEN is missing or empty.`);
        Logger.error(`Expected .env file location: ${envPath}`);
        Logger.error('Please ensure your .env file contains: TARGET_TOKEN=your_user_account_token_here');
        Logger.error('Note: TARGET_TOKEN must be a user account token (selfbot token), not a bot token.');
        throw new Error('TARGET_TOKEN is missing or empty. Please set TARGET_TOKEN in your .env file or environment variables.\n' +
            `Expected .env file location: ${envPath}\n` +
            'Note: TARGET_TOKEN must be a user account token (selfbot token), not a bot token.\n' +
            'Example: TARGET_TOKEN=your_user_account_token_here');
    }
    // Basic Discord token format validation (tokens are typically 59+ characters)
    if (sourceToken.length < 50) {
        Logger.error(`SOURCE_TOKEN appears invalid. Length: ${sourceToken.length} (expected 59+ characters)`);
        Logger.error(`Token preview: ${maskToken(sourceToken)}`);
        Logger.error('Common issues:');
        Logger.error('  - Token has extra quotes or spaces');
        Logger.error('  - Token is incomplete or truncated');
        Logger.error('  - Token is a placeholder value');
        throw new Error(`SOURCE_TOKEN appears to be invalid. Discord tokens are typically 59+ characters long, but yours is ${sourceToken.length} characters.\n` +
            `Token preview: ${maskToken(sourceToken)}\n` +
            'Please check your .env file and ensure:\n' +
            '  1. The token has no quotes around it (e.g., SOURCE_TOKEN=token not SOURCE_TOKEN="token")\n' +
            '  2. The token has no trailing spaces\n' +
            '  3. The token is complete and not truncated');
    }
    if (targetToken.length < 50) {
        Logger.error(`TARGET_TOKEN appears invalid. Length: ${targetToken.length} (expected 59+ characters)`);
        Logger.error(`Token preview: ${maskToken(targetToken)}`);
        Logger.error('Common issues:');
        Logger.error('  - Token has extra quotes or spaces');
        Logger.error('  - Token is incomplete or truncated');
        Logger.error('  - Token is a placeholder value');
        throw new Error(`TARGET_TOKEN appears to be invalid. Discord tokens are typically 59+ characters long, but yours is ${targetToken.length} characters.\n` +
            `Token preview: ${maskToken(targetToken)}\n` +
            'Please check your .env file and ensure:\n' +
            '  1. The token has no quotes around it (e.g., TARGET_TOKEN=token not TARGET_TOKEN="token")\n' +
            '  2. The token has no trailing spaces\n' +
            '  3. The token is complete and not truncated');
    }
    // Log token info (masked) for verification
    Logger.info(`Tokens loaded successfully (SOURCE: ${maskToken(sourceToken)}, TARGET: ${maskToken(targetToken)})`);
    // Parse proxies - support both single proxy and multiple proxies
    let proxy;
    let proxies;
    // Check for multiple proxies (PROXY_LIST or PROXIES)
    const proxyList = process.env.PROXY_LIST || process.env.PROXIES;
    if (proxyList) {
        proxies = parseProxyList(proxyList);
        if (proxies.length > 0) {
            Logger.info(`Loaded ${proxies.length} proxy/proxies from PROXY_LIST`);
        }
    }
    // Fallback to single proxy configuration (backward compatibility)
    if (!proxies && process.env.PROXY_HOST && process.env.PROXY_PORT) {
        proxy = {
            host: process.env.PROXY_HOST,
            port: parseInt(process.env.PROXY_PORT, 10),
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD,
            protocol: process.env.PROXY_PROTOCOL || 'http',
        };
    }
    const options = {
        cloneGuilds: process.env.CLONE_GUILDS !== 'false',
        cloneChannels: process.env.CLONE_CHANNELS !== 'false',
        cloneRoles: process.env.CLONE_ROLES !== 'false',
        cloneEmojis: process.env.CLONE_EMOJIS !== 'false',
        cloneBans: process.env.CLONE_BANS === 'true',
        cloneVoiceStates: process.env.CLONE_VOICE_STATES === 'true',
    };
    const rateLimit = {
        delay: parseInt(process.env.RATE_LIMIT_DELAY || '0', 10), // Default 0 for fast cloning
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '50', 10), // Default 50 for extreme speed
    };
    return {
        sourceToken,
        targetToken,
        proxy,
        proxies,
        options: { ...defaultClonerOptions, ...options },
        rateLimit: { ...defaultRateLimitConfig, ...rateLimit },
    };
}
/**
 * Parse proxy list from string format: IP:PORT:USERNAME:PASSWORD
 * Supports multiple formats:
 * - One per line (newline separated)
 * - Comma separated
 * - Semicolon separated
 */
function parseProxyList(proxyList) {
    const proxies = [];
    // Split by newline, comma, or semicolon
    const lines = proxyList
        .split(/[\n,;]/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    for (const line of lines) {
        try {
            // Format: IP:PORT:USERNAME:PASSWORD or IP:PORT
            const parts = line.split(':');
            if (parts.length < 2) {
                Logger.warning(`Invalid proxy format (skipping): ${line}`);
                continue;
            }
            const host = parts[0].trim();
            const port = parseInt(parts[1].trim(), 10);
            if (!host || isNaN(port) || port < 1 || port > 65535) {
                Logger.warning(`Invalid proxy host/port (skipping): ${line}`);
                continue;
            }
            const proxy = {
                host,
                port,
                protocol: 'http', // Default to http
            };
            // If username and password are provided
            if (parts.length >= 4) {
                proxy.username = parts[2].trim();
                proxy.password = parts[3].trim();
            }
            else if (parts.length === 3) {
                // If only 3 parts, assume it's username (password might be empty)
                proxy.username = parts[2].trim();
            }
            proxies.push(proxy);
        }
        catch (error) {
            Logger.warning(`Error parsing proxy line "${line}": ${error.message}`);
        }
    }
    return proxies;
}
//# sourceMappingURL=loader.js.map