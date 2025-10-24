# ✅ Zapier MCP Setup - Complete Guide

## 🎉 Configuration File Created!

I've created `.mcp.json` in your project root with Zapier MCP configuration.

```json
{
  "mcpServers": {
    "zapier": {
      "transport": "http",
      "url": "https://mcp.zapier.com/api/mcp/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

---

## 🚀 How to Activate Zapier MCP

### Option 1: Restart Claude Code Session (Easiest)

```bash
# Exit current session (Ctrl+D or type 'exit')
# Then restart:
cd /home/user/lkm
claude
```

The `.mcp.json` file will be automatically loaded on startup!

---

### Option 2: Add via Terminal Command (Alternative)

Run this in your **local terminal** (outside Claude Code):

```bash
claude mcp add zapier https://mcp.zapier.com/api/mcp/mcp -t http -H "Authorization: Bearer NGQ4YzgwNWQtYmJkYS00MTVjLWExNDItYzI4MzE0YmUwMjYxOjA2MmYwMjhjLWFmNzItNGFiZC1hNDBkLWYxMTNiYWNjZjY0Mw=="
```

**Why not in Claude Code?**
- The `claude mcp add` command requires interactive input
- It hangs when run from within Claude Code itself
- Best to run from a separate terminal

---

### Option 3: Manual Configuration (Advanced)

Edit `~/.claude.json` or use project-level `.mcp.json` (already created).

---

## 🔍 Verify Zapier MCP is Loaded

After restarting Claude Code, check if Zapier MCP tools are available:

### Method 1: List MCP Servers
```bash
/mcp
```

You should see "zapier" in the list!

### Method 2: Check Available Tools

Zapier MCP tools will start with `mcp__zapier__*` prefix.

Example tools you might see:
- `mcp__zapier__list_zaps`
- `mcp__zapier__trigger_zap`
- `mcp__zapier__search_actions`
- etc.

---

## 📊 What Can You Do with Zapier MCP?

Once loaded, Claude Code can:

✅ **List your Zaps**
```
"Show me all my Zapier workflows"
```

✅ **Trigger Zaps**
```
"Trigger my 'Send Email' zap with this data"
```

✅ **Search Zapier Actions**
```
"What Zapier actions are available for Gmail?"
```

✅ **Create/Update Zaps** (if supported)
```
"Create a new Zap that sends Slack messages"
```

---

## 🔧 Troubleshooting

### Issue: MCP server not loading

**Check 1: File exists**
```bash
ls -la /home/user/lkm/.mcp.json
```

**Check 2: Valid JSON**
```bash
cat /home/user/lkm/.mcp.json | jq .
```

**Check 3: Restart session**
```bash
# Completely exit and restart Claude Code
```

### Issue: Authentication errors

**Solution:** Verify your Bearer token is correct.

The token in `.mcp.json` should match your Zapier MCP credentials:
```
NGQ4YzgwNWQtYmJkYS00MTVjLWExNDItYzI4MzE0YmUwMjYxOjA2MmYwMjhjLWFmNzItNGFiZC1hNDBkLWYxMTNiYWNjZjY0Mw==
```

### Issue: Tools not appearing

**Solution:** Check `/mcp` output and look for any error messages.

---

## 📚 Documentation References

- **Claude Code MCP Docs:** https://docs.claude.com/en/docs/claude-code/mcp
- **Zapier MCP Docs:** https://mcp.zapier.com/docs
- **MCP Specification:** https://modelcontextprotocol.io

---

## 🎯 Quick Start After Setup

1. **Restart Claude Code**
   ```bash
   # Exit current session
   # cd /home/user/lkm && claude
   ```

2. **Verify Loading**
   ```
   Type: /mcp
   Look for: "zapier" in the list
   ```

3. **Test Zapier Integration**
   ```
   Ask: "List all my Zapier workflows"
   ```

4. **Start Automating!**
   ```
   - Trigger Zaps from code changes
   - Create workflows programmatically
   - Integrate with your project automatically
   ```

---

## 💡 Pro Tips

### Combine with Convex Webhooks

Now you have **TWO ways** to integrate with Zapier:

1. **Convex Webhooks** (already configured)
   - Automatically sends events from your app
   - One-way: App → Zapier
   - No MCP needed

2. **Zapier MCP** (this setup)
   - Claude Code can control Zapier
   - Two-way: Claude ↔ Zapier
   - Requires MCP

### Best Use Cases

**Use Convex Webhooks for:**
- Automatic notifications on app events
- Real-time data sync
- Event-driven workflows

**Use Zapier MCP for:**
- Managing Zaps from Claude Code
- Testing workflows during development
- Dynamic Zap creation/modification

---

## ✅ Status Check

Run this to verify everything:

```bash
# 1. Check config file exists
cat .mcp.json

# 2. Restart Claude Code session
# (exit and restart)

# 3. In new session, type:
/mcp

# 4. Look for "zapier" in the output
```

---

## 🎉 You're All Set!

Once you restart Claude Code, Zapier MCP will be active and you can start using it!

**Next: Restart your Claude Code session to load Zapier MCP** 🚀

---

**Last Updated:** October 24, 2025
**Configuration File:** `.mcp.json` ✅
**Status:** Ready for activation
