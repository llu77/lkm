# Anthropic Sandbox Runtime Setup

## Overview

This project uses the **Anthropic Sandbox Runtime** to provide secure, isolated execution environments for AI-generated code. The sandbox ensures that code executed by Claude AI agents runs in a controlled environment with proper security boundaries.

## What is the Sandbox Runtime?

The `@anthropic-ai/sandbox-runtime` package provides:
- **Isolated execution environment** for running untrusted code
- **Secure communication** via HTTP/SOCKS proxies between the Anthropic SDK and sandbox
- **Support for multiple runtimes**: bash, Node.js, Python, etc.
- **Network isolation** to prevent unauthorized external connections

## Installation

The sandbox runtime is already installed in this project:

```bash
npm install --save-dev @anthropic-ai/sandbox-runtime
```

## Configuration

### Sandbox Settings

Configuration is located in `convex/ai.ts`:

```typescript
const AI_CONFIG = {
  // ... other config
  SANDBOX: {
    httpProxyPort: 8080,    // HTTP proxy port for sandbox communication
    socksProxyPort: 8081,   // SOCKS proxy port for sandbox communication
  }
}
```

### Available Options

```typescript
interface SandboxConfig {
  httpProxyPort?: number;              // Default: 8080
  socksProxyPort?: number;             // Default: 8081
  dangerouslyDisableSandbox?: boolean; // Disable sandbox (NOT RECOMMENDED)
}
```

## Usage

### Starting the Sandbox

#### Option 1: Using npm scripts (recommended)

```bash
# Start sandbox with bash shell
npm run sandbox

# Start sandbox with Node.js runtime
npm run sandbox:node
```

#### Option 2: Direct command

```bash
# Bash
npx @anthropic-ai/sandbox-runtime bash

# Node.js
npx @anthropic-ai/sandbox-runtime node

# Python
npx @anthropic-ai/sandbox-runtime python

# Custom command
npx @anthropic-ai/sandbox-runtime <your-command>
```

### In Development

For local development with AI features:

1. **Terminal 1**: Start the sandbox runtime
   ```bash
   npm run sandbox
   ```

2. **Terminal 2**: Start your development server
   ```bash
   npm run dev
   ```

3. **Terminal 3**: Start Convex backend (if needed)
   ```bash
   npx convex dev
   ```

## How It Works

```
┌─────────────────┐
│  Anthropic SDK  │
│   (convex/ai)   │
└────────┬────────┘
         │ Proxy communication
         │ (ports 8080/8081)
         ▼
┌─────────────────┐
│ Sandbox Runtime │
│   (isolated)    │
└─────────────────┘
```

1. The Anthropic SDK in `convex/ai.ts` is configured with proxy settings
2. When Claude generates code to execute, requests are sent through the proxy
3. The sandbox runtime receives the code via the proxy
4. Code executes in an isolated environment
5. Results are returned through the proxy back to the SDK

## Security Considerations

### ✅ Recommended Practices

- **Always run the sandbox runtime** when using AI code execution features
- **Use the provided proxy ports** (8080/8081) or configure custom ports
- **Keep sandbox runtime updated** for latest security patches
- **Monitor sandbox logs** for suspicious activity

### ⚠️ Dangerous Options

```typescript
// DON'T DO THIS in production!
dangerouslyDisableSandbox: true
```

The `dangerouslyDisableSandbox` option completely disables sandboxing and should **NEVER** be used in production. It's only for debugging purposes in isolated development environments.

## Troubleshooting

### Port Already in Use

If ports 8080/8081 are already in use:

1. **Change the ports in `convex/ai.ts`**:
   ```typescript
   SANDBOX: {
     httpProxyPort: 9080,
     socksProxyPort: 9081,
   }
   ```

2. **Restart the sandbox runtime** with the new configuration

### Sandbox Not Responding

1. Verify sandbox is running: `ps aux | grep sandbox-runtime`
2. Check proxy ports are accessible: `netstat -an | grep 8080`
3. Review sandbox logs for errors
4. Restart the sandbox runtime

### Connection Refused

Ensure the sandbox runtime is started **before** making AI requests that need code execution.

## Advanced Configuration

### Custom Sandbox Commands

You can customize what runs in the sandbox:

```bash
# Custom shell with specific environment
npx @anthropic-ai/sandbox-runtime bash --init-file ~/.custom_bashrc

# Node.js with specific version
npx @anthropic-ai/sandbox-runtime node --version=18

# Python with virtual environment
npx @anthropic-ai/sandbox-runtime python -m venv /sandbox/venv
```

### Environment Variables

The sandbox runtime respects certain environment variables:

```bash
# Set custom proxy ports
export ANTHROPIC_HTTP_PROXY_PORT=8080
export ANTHROPIC_SOCKS_PROXY_PORT=8081

npm run sandbox
```

## Testing

To verify sandbox is working:

1. Start sandbox runtime: `npm run sandbox`
2. Check it's listening: `lsof -i :8080` and `lsof -i :8081`
3. Run a test AI action in your application
4. Monitor sandbox logs for execution activity

## Production Deployment

For production environments:

1. **Run sandbox runtime as a service**:
   ```bash
   # Using systemd (example)
   sudo systemctl enable anthropic-sandbox
   sudo systemctl start anthropic-sandbox
   ```

2. **Configure firewall rules** to restrict sandbox network access

3. **Monitor sandbox health** and restart on failure

4. **Use dedicated servers** for sandbox runtime if handling sensitive operations

## Resources

- [Anthropic Sandbox Runtime Documentation](https://docs.anthropic.com/claude/docs/sandbox)
- [Anthropic SDK Documentation](https://docs.anthropic.com/claude/reference/client-sdks)
- [Computer Use Guide](https://docs.anthropic.com/claude/docs/computer-use)

## Support

For issues or questions about the sandbox runtime:
- Check the [GitHub Issues](https://github.com/anthropics/anthropic-sdk-typescript/issues)
- Review Anthropic documentation
- Contact your system administrator

---

**Last Updated**: 2025-10-29
**Sandbox Runtime Version**: ^0.0.1
