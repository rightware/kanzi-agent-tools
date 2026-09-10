---
description: "Register and use the Kanzi MCP servers. Use when setting up Kanzi access for an assistant, when a Kanzi server needs signing in to, when deciding whether a question belongs to the documentation, the API reference or the user's Portal account, or when working in mainland China."
---

<!-- Generated from core/ by tools/build.mjs. Do not edit. -->

# Connect your agent to Kanzi

Kanzi provides MCP servers that any MCP-capable assistant can use.

| Server | Registered as | What it gives you | Version argument | Sign-in |
|---|---|---|---|---|
| Kanzi Documentation MCP server | `kanzi-docs` | The Kanzi documentation, for any version | Yes | Not needed |
| Kanzi API MCP server | `kanzi-api` | The Kanzi API reference, for any version | Yes | Not needed |
| Kanzi Portal MCP server | `kanzi-portal` | Your own Portal account: licenses, downloads, platform packages, support tickets | No | Once, in a browser |

Servers that accept a version argument hold no session state. Pass the user's Kanzi version whenever the answer could differ between releases.

Kanzi Portal MCP server acts as the signed-in user and stays within that user's permissions. An operation the user is not permitted to perform returns a permission error. Report that error rather than retrying or working around it.

## Signing in

The Portal sign-in uses the user's own credentials and cannot be completed on their behalf. Register the server, then ask the user to sign in and name the command their assistant uses for it.

## Mainland China

Use `https://portal.kanzi.cn` as the Portal origin. Where an assistant expands environment variables in its MCP configuration, setting `KANZI_PORTAL_URL` does this without a separate configuration; where it does not, write the origin in directly. The documentation and API servers are the same in both regions.

## Choosing where to look

- How Kanzi works, or what an API does: the documentation and API reference servers. Pass the user's Kanzi version.
- What the user has, may download, or is licensed for: the Portal server.
- Changing a project's dependencies: Kanzi Package Manager and Conan, not these servers.
- Changing a Kanzi project itself: Kanzi Studio, not these servers.

## Server names

Some assistants normalize server names, for example by replacing hyphens with underscores. Match the name used by the local configuration.
