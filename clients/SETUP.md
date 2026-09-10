<!-- Generated from core/ by tools/build.mjs. Do not edit. -->

# Registering the Kanzi MCP servers

| Server | Registered as | What it gives you | Version argument | Sign-in |
|---|---|---|---|---|
| Kanzi Documentation MCP server | `kanzi-docs` | The Kanzi documentation, for any version | Yes | Not needed |
| Kanzi API MCP server | `kanzi-api` | The Kanzi API reference, for any version | Yes | Not needed |
| Kanzi Portal MCP server | `kanzi-portal` | Your own Portal account: licenses, downloads, platform packages, support tickets | No | Once, in a browser |

| Server | URL |
|---|---|
| `kanzi-docs` | `https://docs.mcp.kanzi.com/mcp` |
| `kanzi-api` | `https://api.mcp.kanzi.com` |
| `kanzi-portal` | `https://portal.kanzi.com/api/mcp` |

For mainland China, use `https://portal.kanzi.cn` as the Portal origin.

## Claude Code

Install the plugin:

```
/plugin marketplace add rightware/kanzi-agent-tools
/plugin install kanzi@rightware
```

Or register the servers without the plugin:

```bash
claude mcp add --scope user --transport http kanzi-docs https://docs.mcp.kanzi.com/mcp
claude mcp add --scope user --transport http kanzi-api https://api.mcp.kanzi.com
claude mcp add --scope user --transport http kanzi-portal https://portal.kanzi.com/api/mcp
```

Then run `/mcp` and sign in to the Portal server.

## Codex

Append `clients/codex/config.toml` to `~/.codex/config.toml`, then copy `clients/codex/AGENTS.md` into your project.

Codex does not expand environment variables in its configuration, so an alternate Portal origin must be written in directly.

## Cursor

Merge `clients/cursor/mcp.json` into `~/.cursor/mcp.json`, then copy `clients/cursor/AGENTS.md` into your project.

## Any other MCP client

Use the URLs above. The Portal server needs interactive OAuth, so the client must support browser sign-in.

Some clients normalize server names. Codex, for example, uses underscores.
