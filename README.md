# Discord Advanced Cloner

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**A professional, feature-rich Discord server cloner built with TypeScript**

*Clone Discord servers with roles, channels, emojis, and more with advanced rate limiting and proxy support*

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Security & Legal](#security--legal)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Discord Advanced Cloner is a TypeScript-based tool designed to clone Discord servers (guilds) from a source server to a target server. It provides comprehensive cloning capabilities including guild settings, roles, channels (text, voice, categories, announcements, forums), and emojis with intelligent rate limiting, proxy support, and robust error handling.

### What Gets Cloned

- ✅ **Guild Settings**: Name, icon, verification level, default message notifications, explicit content filter
- ✅ **Roles**: All custom roles with permissions, colors, positions, hoist, and mentionable settings
- ✅ **Channels**: Text, voice, category, announcement, and forum channels with all settings
- ✅ **Emojis**: Custom emojis (static and animated) with automatic download and upload

---

## ✨ Features

### Core Functionality

- **🔄 Complete Server Cloning**: Clone entire Discord servers with all major components
- **🎭 Role Management**: Preserve role hierarchy, permissions, colors, and positions
- **📁 Channel Support**: Supports all major channel types with proper categorization
- **😀 Emoji Cloning**: Automatic emoji download from CDN and upload to target server
- **🆕 Guild Creation**: Create new guilds or clone to existing ones

### Advanced Features

- **⚡ Intelligent Rate Limiting**: Automatic rate limit detection and retry with exponential backoff
- **🌐 Proxy Support**: HTTP/HTTPS proxy support for network routing and IP protection
- **📊 Progress Tracking**: Real-time progress updates with detailed logging
- **🔍 Canary Diagnostics**: Pre-flight checks to verify system readiness
- **🛡️ Error Handling**: Comprehensive error handling with detailed error messages
- **📝 Type Safety**: Full TypeScript support with strict type checking
- **🎨 Colored Logging**: Beautiful, color-coded console output for better readability

### Technical Features

- **Modular Architecture**: Clean, maintainable code structure with separation of concerns
- **ESM Support**: Modern ES modules with proper import/export syntax
- **Source Maps**: Full source map support for debugging
- **Environment Configuration**: Flexible configuration via environment variables
- **Concurrent Processing**: Controlled concurrent request handling

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js (or use yarn/pnpm)
- **Discord User Account Tokens**: Two valid user account tokens (see [Token Requirements](#token-requirements))

### Token Requirements

⚠️ **CRITICAL**: This tool requires **user account tokens** (selfbot tokens), NOT bot tokens.

- **User tokens** are typically 59+ characters long (base64-encoded strings)
- **Bot tokens** follow the pattern: `MTA...` or `NTA...` (24 chars + dot + 6 chars + dot + 27 chars)
- User tokens can be obtained from browser DevTools (see troubleshooting section)
- **Both SOURCE_TOKEN and TARGET_TOKEN must be user account tokens**

---

## 🚀 Installation

### Step 1: Clone or Download

```bash
# If using git
git clone <repository-url>
cd "Discord Cloner"

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `discord.js-selfbot-v13` - Discord client library (selfbot fork)
- `@discordjs/rest` - Discord REST API client
- `axios` - HTTP client for CDN downloads
- `chalk` - Terminal string styling
- `ora` - Elegant terminal spinners
- `dotenv` - Environment variable management
- `http-proxy` - Proxy server support

### Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root directory with the following variables:

```env
# ============================================
# REQUIRED: User Account Tokens
# ============================================
# Both tokens MUST be user account tokens (selfbot tokens), NOT bot tokens
SOURCE_TOKEN=your_source_user_account_token_here
TARGET_TOKEN=your_target_user_account_token_here

# ============================================
# REQUIRED: Guild IDs
# ============================================
SOURCE_GUILD_ID=source_guild_id_here
TARGET_GUILD_ID=target_guild_id_here
# Note: If TARGET_GUILD_ID is not set, a new guild will be created

# ============================================
# OPTIONAL: Proxy Configuration
# ============================================
PROXY_HOST=localhost
PROXY_PORT=8080
PROXY_USERNAME=
PROXY_PASSWORD=
PROXY_PROTOCOL=http

# ============================================
# OPTIONAL: Cloner Options
# ============================================
CLONE_GUILDS=true
CLONE_CHANNELS=true
CLONE_ROLES=true
CLONE_EMOJIS=true

# ============================================
# OPTIONAL: Rate Limiting
# ============================================
RATE_LIMIT_DELAY=1000
MAX_CONCURRENT_REQUESTS=5

# ============================================
# OPTIONAL: Debug Mode
# ============================================
DEBUG=false
```

### Configuration Details

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SOURCE_TOKEN` | User account token for source account | `MTIzNDU2Nzg5MDfhgfghdfgfgdhgdY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5` |
| `TARGET_TOKEN` | User account token for target account | `MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjgfgdfgU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5` |
| `SOURCE_GUILD_ID` | Discord server ID to clone from | `123456789012345678` |
| `TARGET_GUILD_ID` | Discord server ID to clone to (optional) | `987654321098765432` |

#### Optional Variables

**Proxy Configuration:**
- `PROXY_HOST`: Proxy server hostname or IP
- `PROXY_PORT`: Proxy server port
- `PROXY_USERNAME`: Proxy authentication username (if required)
- `PROXY_PASSWORD`: Proxy authentication password (if required)
- `PROXY_PROTOCOL`: Proxy protocol (`http` or `https`, default: `http`)

**Cloner Options:**
- `CLONE_GUILDS`: Clone guild settings (default: `true`)
- `CLONE_CHANNELS`: Clone channels (default: `true`)
- `CLONE_ROLES`: Clone roles (default: `true`)
- `CLONE_EMOJIS`: Clone emojis (default: `true`)

**Rate Limiting:**
- `RATE_LIMIT_DELAY`: Delay between requests in milliseconds (default: `1000`)
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent requests (default: `5`)

**Debug:**
- `DEBUG`: Enable debug logging (default: `false`)

---

## 💻 Usage

### Basic Usage

#### 1. Clone to Existing Guild

```bash
# Set TARGET_GUILD_ID in .env file
npm start
```

#### 2. Clone to New Guild

```bash
# Leave TARGET_GUILD_ID empty or unset in .env file
npm start
```

### Development Mode

Run with auto-reload for development:

```bash
npm run dev
```

### Programmatic Usage

You can also use the cloner programmatically in your own code:

```typescript
import { DiscordCloner } from './core/cloner.js';
import { loadConfig } from './config/loader.js';

async function main() {
  // Load configuration
  const config = loadConfig();
  
  // Initialize cloner
  const cloner = new DiscordCloner(config);
  await cloner.initialize();
  
  // Optional: Run canary diagnostics
  await cloner.canary();
  
  // Clone to a new guild
  const result = await cloner.cloneGuild('SOURCE_GUILD_ID');
  
  // Or clone to an existing guild
  const result = await cloner.cloneGuild('SOURCE_GUILD_ID', 'TARGET_GUILD_ID');
  
  if (result.success) {
    console.log(`Cloned successfully! Guild ID: ${result.data?.guildId}`);
  } else {
    console.error(`Clone failed: ${result.error}`);
  }
  
  // Cleanup
  await cloner.destroy();
}

main().catch(console.error);
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run the compiled JavaScript |
| `npm run dev` | Run in development mode with auto-reload |
| `npm run clean` | Remove compiled files from `dist/` directory |

---

## 🏗️ Architecture

### Project Structure

```
Discord Cloner/
├── src/                          # Source TypeScript files
│   ├── core/
│   │   └── cloner.ts            # Main cloner implementation
│   ├── config/
│   │   ├── defaults.ts          # Default configuration values
│   │   └── loader.ts            # Configuration loader from .env
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── logger.ts            # Logging utility with colors
│   │   ├── proxy.ts             # Proxy manager
│   │   └── rateLimiter.ts       # Rate limiting with retry logic
│   └── index.ts                 # Entry point
├── dist/                        # Compiled JavaScript (generated)
├── node_modules/                # Dependencies
├── .env                         # Environment variables (create this)
├── .gitignore                   # Git ignore rules
├── package.json                 # Project metadata and dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

### Component Overview

#### Core Components

1. **DiscordCloner** (`core/cloner.ts`)
   - Main cloner class that orchestrates the cloning process
   - Manages source and target Discord clients
   - Handles guild, role, channel, and emoji cloning
   - Implements canary diagnostics for pre-flight checks

2. **Configuration Loader** (`config/loader.ts`)
   - Loads configuration from `.env` file
   - Validates required tokens and settings
   - Provides default values for optional settings
   - Masks tokens in logs for security

3. **Rate Limiter** (`utils/rateLimiter.ts`)
   - Manages request queue with concurrency control
   - Automatically detects and handles rate limits (429 errors)
   - Implements exponential backoff for retries
   - Extracts retry-after headers from Discord API responses

4. **Proxy Manager** (`utils/proxy.ts`)
   - Manages HTTP/HTTPS proxy configuration
   - Supports authenticated proxies
   - Provides proxy agent for axios requests

5. **Logger** (`utils/logger.ts`)
   - Color-coded console output
   - Multiple log levels (INFO, SUCCESS, WARNING, ERROR, DEBUG)
   - Timestamp formatting
   - Debug mode toggle

### Data Flow

```
┌─────────────┐
│  index.ts   │  Entry point, loads config, initializes cloner
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  loader.ts  │  Loads and validates .env configuration
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  cloner.ts  │  Main cloning logic
│             │  ├── Initialize clients
│             │  ├── Clone guild settings
│             │  ├── Clone roles
│             │  ├── Clone channels
│             │  └── Clone emojis
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Logger  │ │   Rate   │ │  Proxy   │ │  REST    │
│          │ │ Limiter  │ │ Manager  │ │   API    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Cloning Process

1. **Initialization**
   - Load configuration from `.env`
   - Initialize source and target Discord clients
   - Set up rate limiter and proxy manager
   - Login both clients

2. **Guild Setup**
   - Fetch source guild
   - Create new guild or use existing target guild
   - Delete existing content if cloning to existing guild

3. **Role Cloning**
   - Fetch all roles from source guild
   - Filter out managed roles and @everyone
   - Sort by position (highest first)
   - Create roles with permissions, colors, and settings
   - Map source role IDs to target role IDs

4. **Channel Cloning**
   - Fetch all channels from source guild
   - Categorize into categories and regular channels
   - Sort by position and parent
   - Create categories first, then regular channels
   - Preserve channel hierarchy and settings

5. **Emoji Cloning**
   - Fetch all emojis from source guild
   - Download emoji images from Discord CDN
   - Upload emojis to target guild
   - Handle animated and static emojis
   - Skip duplicates

6. **Cleanup**
   - Destroy Discord clients
   - Close proxy connections
   - Wait for rate limiter queue to complete

---

## 📚 API Reference

### DiscordCloner Class

#### Constructor

```typescript
constructor(config: ClonerConfig)
```

Creates a new DiscordCloner instance with the provided configuration.

**Parameters:**
- `config: ClonerConfig` - Configuration object (see types)

#### Methods

##### `initialize(): Promise<void>`

Initializes the Discord clients and logs them in.

**Throws:** Error if login fails

**Example:**
```typescript
await cloner.initialize();
```

##### `canary(): Promise<void>`

Runs diagnostic checks to verify system readiness before cloning.

**Checks:**
- Token validity
- Network connectivity
- Rate limiter functionality
- Emoji upload permissions

**Example:**
```typescript
await cloner.canary();
```

##### `cloneGuild(sourceGuildId: string, targetGuildId?: string): Promise<CloneResult>`

Clones a guild from source to target.

**Parameters:**
- `sourceGuildId: string` - ID of the source guild to clone
- `targetGuildId?: string` - Optional ID of target guild (creates new if not provided)

**Returns:** `Promise<CloneResult>` - Result object with success status and data

**Example:**
```typescript
// Clone to new guild
const result = await cloner.cloneGuild('123456789012345678');

// Clone to existing guild
const result = await cloner.cloneGuild('123456789012345678', '987654321098765432');
```

##### `destroy(): Promise<void>`

Cleans up resources and closes connections.

**Example:**
```typescript
await cloner.destroy();
```

### Type Definitions

#### ClonerConfig

```typescript
interface ClonerConfig {
  sourceToken: string;
  targetToken: string;
  proxy?: ProxyConfig;
  options: ClonerOptions;
  rateLimit: RateLimitConfig;
}
```

#### ClonerOptions

```typescript
interface ClonerOptions {
  cloneGuilds: boolean;
  cloneChannels: boolean;
  cloneRoles: boolean;
  cloneEmojis: boolean;
  cloneBans?: boolean;
  cloneVoiceStates?: boolean;
}
```

#### RateLimitConfig

```typescript
interface RateLimitConfig {
  delay: number;
  maxConcurrentRequests: number;
}
```

#### CloneResult

```typescript
interface CloneResult {
  success: boolean;
  item: string;
  error?: string;
  data?: any;
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Token Invalid Errors

**Symptoms:**
```
TokenInvalid error
Invalid token
401 Unauthorized
```

**Solutions:**

1. **Verify Token Type**
   - Ensure you're using user account tokens, not bot tokens
   - User tokens are typically 59+ characters
   - Bot tokens follow pattern: `MTA...` (24 chars + dot + 6 chars + dot + 27 chars)

2. **Check Token Format**
   - Remove any quotes around the token in `.env` file
   - Remove trailing spaces
   - Ensure token is complete (not truncated)

3. **Verify Token Validity**
   - Token may have been revoked or expired
   - Account may be locked or disabled
   - Token may have been regenerated

4. **Library Compatibility**
   - This project uses `discord.js-selfbot-v13` which supports user tokens
   - Standard `discord.js` v12+ does NOT support user tokens
   - If you see compatibility errors, ensure you're using the correct library

#### 2. Permission Errors

**Symptoms:**
```
Missing Permissions
403 Forbidden
Permission denied
```

**Solutions:**

1. **Check Role Permissions**
   - Ensure your role has `MANAGE_ROLES` permission for role cloning
   - Ensure your role has `MANAGE_CHANNELS` permission for channel cloning
   - Ensure your role has `MANAGE_EMOJIS_AND_STICKERS` permission for emoji cloning

2. **Check Role Hierarchy**
   - Your role must be higher than the roles you're trying to create
   - Your role must be higher than the channels you're trying to create

3. **Check Guild Permissions**
   - Ensure you have administrator permissions or all required permissions
   - Some operations require specific permissions that can't be granted by roles

#### 3. Rate Limit Errors

**Symptoms:**
```
429 Too Many Requests
Rate limit exceeded
```

**Solutions:**

1. **Adjust Rate Limiting**
   - Increase `RATE_LIMIT_DELAY` in `.env` (e.g., `2000` for 2 seconds)
   - Decrease `MAX_CONCURRENT_REQUESTS` (e.g., `3` instead of `5`)

2. **Wait and Retry**
   - The rate limiter automatically handles rate limits
   - Wait for the retry period indicated in the logs
   - For global rate limits, wait longer before retrying

#### 4. Emoji Upload Failures

**Symptoms:**
```
Emoji limit reached
Failed to upload emoji
```

**Solutions:**

1. **Check Emoji Limits**
   - Discord has limits on emoji count per guild
   - Standard servers: 50 static + 50 animated
   - Boosted servers: Higher limits based on boost level

2. **Check Permissions**
   - Ensure `MANAGE_EMOJIS_AND_STICKERS` permission
   - Check if emoji uploads are disabled in server settings

3. **Check Network**
   - Ensure stable internet connection
   - Check if proxy is working correctly
   - Verify CDN access for emoji downloads

#### 5. Channel Creation Failures

**Symptoms:**
```
Failed to create channel
Channel type not supported
```

**Solutions:**

1. **Check Channel Types**
   - Some channel types may not be supported in target guild
   - Announcement channels require Community features
   - Forum channels require Community features

2. **Check Permissions**
   - Ensure `MANAGE_CHANNELS` permission
   - Check channel creation limits

#### 6. Guild Not Found

**Symptoms:**
```
Guild not found
Source guild not found
```

**Solutions:**

1. **Verify Guild IDs**
   - Ensure guild IDs are correct (18-digit numbers)
   - Ensure you're a member of both guilds
   - Ensure bots/clients have access to the guilds

2. **Check Client Status**
   - Ensure clients are logged in successfully
   - Check if guilds are cached (may need to wait for cache)

### Getting User Account Tokens

⚠️ **WARNING**: Obtaining user account tokens may violate Discord's Terms of Service. Use at your own risk.

1. **Browser Method:**
   - Open Discord in your browser
   - Open Developer Tools (F12)
   - Go to Network tab
   - Filter by "XHR" or "Fetch"
   - Send a message or perform any action
   - Find a request to `discord.com/api`
   - Look for `Authorization` header
   - Copy the token value

2. **Token Format:**
   - User tokens are typically 59+ characters
   - Base64-encoded strings
   - Do NOT share your token with anyone

### Debug Mode

Enable debug logging for more detailed information:

```env
DEBUG=true
```

This will show:
- Token loading information (masked)
- Detailed rate limit information
- Network request details
- Additional diagnostic information

---

## 🔒 Security & Legal

### Security Best Practices

1. **Token Security**
   - Never commit tokens to version control
   - Use `.env` file and add it to `.gitignore`
   - Never share tokens publicly
   - Rotate tokens if compromised

2. **Environment Variables**
   - Keep `.env` file secure
   - Use environment variables in production
   - Don't log tokens in production

3. **Proxy Usage**
   - Use proxies for additional security
   - Rotate proxies if needed
   - Use authenticated proxies when possible

### Legal Disclaimer

⚠️ **IMPORTANT**: This tool is for educational purposes only.

- **Using selfbots violates Discord's Terms of Service**
- **Your account may be banned or terminated**
- **Use at your own risk**
- **The authors are not responsible for any consequences**

Discord's Terms of Service explicitly prohibit:
- Automated user accounts (selfbots)
- Unauthorized API access
- Violating rate limits
- Cloning servers without permission

**Before using this tool:**
- Ensure you have permission to clone the source server
- Understand the risks involved
- Consider using Discord's official bot API instead
- Review Discord's Terms of Service

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Follow code style** (TypeScript strict mode, ESLint if configured)
5. **Test your changes** thoroughly
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Code Style

- Use TypeScript strict mode
- Follow existing code structure
- Add comments for complex logic
- Update documentation for new features
- Test error cases

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [discord.js-selfbot-v13](https://github.com/aiko-chan-ai/discord.js-selfbot-v13) - Discord.js fork with selfbot support
- [discord.js](https://discord.js.org/) - Discord API library
- [@discordjs/rest](https://github.com/discordjs/discord.js/tree/main/packages/rest) - Discord REST API client

---

## 📞 Support

For issues, questions, or contributions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing issues on GitHub
3. Create a new issue with detailed information
4. Include error messages, logs, and configuration (with tokens masked)

---

<div align="center">

**Made with ❤️ By Kirito**

*Remember: Use responsibly and in accordance with Discord's Terms of Service*

</div>
