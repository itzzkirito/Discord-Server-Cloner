# Proxy Setup Guide

## Adding Multiple Proxies

You can now add multiple proxies to your Discord cloner. The proxies will be automatically rotated using round-robin rotation.

## Format

Each proxy should be in the format: `IP:PORT:USERNAME:PASSWORD`

## Adding Proxies to .env File

Add the following to your `.env` file:

```env
# Multiple Proxies (one per line, or comma/semicolon separated)
PROXY_LIST=142.111.48.253:7030:fgjzimze:lu787ak8gcnn
31.59.20.176:6754:fgjzimze:lu787ak8gcnn
23.95.150.145:6114:fgjzimze:lu787ak8gcnn
198.23.239.134:6540:fgjzimze:lu787ak8gcnn
45.38.107.97:6014:fgjzimze:lu787ak8gcnn
107.172.163.27:6543:fgjzimze:lu787ak8gcnn
198.105.121.200:6462:fgjzimze:lu787ak8gcnn
64.137.96.74:6641:fgjzimze:lu787ak8gcnn
216.10.27.159:6837:fgjzimze:lu787ak8gcnn
142.111.67.146:5611:fgjzimze:lu787ak8gcnn
```

**OR** use a single line with commas:

```env
PROXY_LIST=142.111.48.253:7030:fgjzimze:lu787ak8gcnn,31.59.20.176:6754:fgjzimze:lu787ak8gcnn,23.95.150.145:6114:fgjzimze:lu787ak8gcnn,198.23.239.134:6540:fgjzimze:lu787ak8gcnn,45.38.107.97:6014:fgjzimze:lu787ak8gcnn,107.172.163.27:6543:fgjzimze:lu787ak8gcnn,198.105.121.200:6462:fgjzimze:lu787ak8gcnn,64.137.96.74:6641:fgjzimze:lu787ak8gcnn,216.10.27.159:6837:fgjzimze:lu787ak8gcnn,142.111.67.146:5611:fgjzimze:lu787ak8gcnn
```

## Alternative: Using PROXIES Environment Variable

You can also use `PROXIES` instead of `PROXY_LIST`:

```env
PROXIES=142.111.48.253:7030:fgjzimze:lu787ak8gcnn
31.59.20.176:6754:fgjzimze:lu787ak8gcnn
...
```

## Proxy Rotation

- **Round-Robin (Default)**: Proxies are rotated sequentially
- **Random**: Proxies are selected randomly (can be configured in code)

Each request will automatically use the next proxy in rotation.

## Backward Compatibility

The old single proxy configuration still works:

```env
PROXY_HOST=localhost
PROXY_PORT=8080
PROXY_USERNAME=user
PROXY_PASSWORD=pass
PROXY_PROTOCOL=http
```

If `PROXY_LIST` or `PROXIES` is set, it will take priority over the single proxy configuration.

## Example .env File

```env
# Required Tokens
SOURCE_TOKEN=your_source_token_here
TARGET_TOKEN=your_target_token_here

# Required Guild IDs
SOURCE_GUILD_ID=123456789012345678
TARGET_GUILD_ID=987654321098765432

# Multiple Proxies
PROXY_LIST=142.111.48.253:7030:fgjzimze:lu787ak8gcnn
31.59.20.176:6754:fgjzimze:lu787ak8gcnn
23.95.150.145:6114:fgjzimze:lu787ak8gcnn
198.23.239.134:6540:fgjzimze:lu787ak8gcnn
45.38.107.97:6014:fgjzimze:lu787ak8gcnn
107.172.163.27:6543:fgjzimze:lu787ak8gcnn
198.105.121.200:6462:fgjzimze:lu787ak8gcnn
64.137.96.74:6641:fgjzimze:lu787ak8gcnn
216.10.27.159:6837:fgjzimze:lu787ak8gcnn
142.111.67.146:5611:fgjzimze:lu787ak8gcnn
```

## Verification

When you run the cloner, you should see output like:

```
[INFO] Loaded 10 proxy/proxies from PROXY_LIST
[SUCCESS] Initialized 10 proxies with round-robin rotation
[INFO]   [1] http://fgjzimze:***@142.111.48.253:7030
[INFO]   [2] http://fgjzimze:***@31.59.20.176:6754
...
```

This confirms that your proxies have been loaded successfully.

