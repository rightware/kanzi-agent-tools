// Codex reads MCP servers from TOML and instructions from a single AGENTS.md,
// so every playbook is inlined rather than offered separately.
export const name = 'codex';

export function files({ servers, bundledAgentsMd, url, tomlKey }) {
  return [
    ['config.toml',
      '# Append to ~/.codex/config.toml\n\n' +
      servers.map((s) => `[mcp_servers.${tomlKey(s.name)}]\nurl = "${url(s)}"\n`).join('\n')],
    ['AGENTS.md', bundledAgentsMd],
  ];
}

export function setupSection() {
  return '## Codex\n\n' +
    'Append `clients/codex/config.toml` to `~/.codex/config.toml`, then copy `clients/codex/AGENTS.md` into your project.\n\n' +
    'Codex does not expand environment variables in its configuration, so an alternate Portal origin must be written in directly.\n';
}
