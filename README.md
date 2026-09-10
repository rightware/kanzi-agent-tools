# Kanzi agent tools

Instructions and configuration that let an AI assistant work with Kanzi.

The content in `core/` is not tied to any one assistant. Everything under `clients/` is generated from it, one directory per assistant.

## Layout

```
core/
  meta.json               Published name, version, and description
  servers.json            Kanzi MCP server registry
  AGENTS.md               Instructions, with generated sections
  playbooks/
    <name>.md             A procedure
    <name>.meta.json      Its title and the description used to select it
tools/
  build.mjs               Generates the files below
  clients/<name>.mjs      One adapter per assistant
clients/                  Generated
.claude-plugin/           Generated
```

Edit `core/` and `tools/`, then run `node tools/build.mjs`. Do not edit generated files: `node tools/build.mjs --check` fails when they no longer match, and runs in CI.

## Adding an assistant

Add one file to `tools/clients/`. The build discovers adapters and combines their setup instructions.

## Adding a playbook

Add `core/playbooks/<name>.md` and `<name>.meta.json`, then rebuild. It reaches every assistant: Claude Code gets a skill it can select per request, assistants that read a single instruction file get it inlined into `AGENTS.md`.

The `description` in the meta file is the text an assistant matches against when deciding whether to use the playbook, so write it as trigger conditions rather than a summary. The build requires at least 60 characters.

## Use it with Claude Code

```
/plugin marketplace add rightware/kanzi-agent-tools
/plugin install kanzi@rightware
```

Add the marketplace by repository rather than by a direct URL to `marketplace.json`; the plugin source is a repository-relative path.

Then run `/mcp` and sign in to `kanzi-portal`.

## Use it with another assistant

[`clients/SETUP.md`](clients/SETUP.md) covers registration. Give the assistant the `AGENTS.md` generated for it under `clients/`.


## License

Apache-2.0. See [LICENSE](LICENSE).
