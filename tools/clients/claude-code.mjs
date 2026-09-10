// Claude Code loads plugins that bundle MCP servers and skills. Skills are
// selected per request, so each playbook becomes its own skill rather than
// part of one large instruction file.
//
// Claude Code requires the marketplace manifest at the repository root, so this
// adapter is the only one that writes outside its own directory.
export const name = 'claude-code';

const MARKETPLACE = 'rightware';

export function files({ meta, servers, playbooks, agentsMd, expandableUrl, yaml }) {
  const out = [
    ['.claude-plugin/plugin.json', JSON.stringify({
      name: meta.name,
      description: meta.description,
      version: meta.version,
      author: meta.author,
      homepage: meta.homepage,
      repository: meta.repository,
      license: meta.license,
      keywords: meta.keywords,
    }, null, 2) + '\n'],

    ['.mcp.json', JSON.stringify({
      mcpServers: Object.fromEntries(
        servers.map((s) => [s.name, { type: s.transport, url: expandableUrl(s) }]),
      ),
    }, null, 2) + '\n'],

    // Carries the routing table and the ground rules, which apply to every request.
    [`skills/${meta.name}/SKILL.md`,
      `---\ndescription: ${yaml(`Core rules for working with ${meta.displayName}: which tool handles which kind of request, and how to avoid guessing version-specific or license-specific answers. Use whenever the user is working on a ${meta.displayName} project.`)}\n---\n\n${agentsMd}`],
  ];

  for (const p of playbooks) {
    out.push([`skills/${p.name}/SKILL.md`,
      `---\ndescription: ${yaml(p.description)}\n---\n\n${p.body}`]);
  }
  return out;
}

export function rootFiles({ meta }) {
  return [
    ['.claude-plugin/marketplace.json', JSON.stringify({
      $schema: 'https://anthropic.com/claude-code/marketplace.schema.json',
      name: MARKETPLACE,
      description: `Official ${meta.author.name} plugins for Claude Code`,
      owner: meta.author,
      plugins: [{
        name: meta.name,
        description: meta.description,
        version: meta.version,
        source: `./clients/${name}`,
        category: 'knowledge',
      }],
    }, null, 2) + '\n'],
  ];
}

export function setupSection({ meta, manualAdd }) {
  return '## Claude Code\n\n' +
    'Install the plugin:\n\n' +
    '```\n' +
    `/plugin marketplace add ${meta.repository.replace('https://github.com/', '')}\n` +
    `/plugin install ${meta.name}@${MARKETPLACE}\n` +
    '```\n\n' +
    'Or register the servers without the plugin:\n\n' +
    '```bash\n' + manualAdd + '\n```\n\n' +
    'Then run `/mcp` and sign in to the Portal server.\n';
}
