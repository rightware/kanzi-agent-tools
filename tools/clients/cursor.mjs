// Cursor reads MCP servers from JSON and instructions from a single AGENTS.md.
export const name = 'cursor';

export function files({ servers, bundledAgentsMd, url }) {
  return [
    ['mcp.json', JSON.stringify({
      mcpServers: Object.fromEntries(servers.map((s) => [s.name, { url: url(s) }])),
    }, null, 2) + '\n'],
    ['AGENTS.md', bundledAgentsMd],
  ];
}

export function setupSection() {
  return '## Cursor\n\n' +
    'Merge `clients/cursor/mcp.json` into `~/.cursor/mcp.json`, then copy `clients/cursor/AGENTS.md` into your project.\n';
}
