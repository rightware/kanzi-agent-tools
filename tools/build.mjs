#!/usr/bin/env node
// Generates every client artifact from core/. Adding a client means adding one
// file under tools/clients/, with no edits to this script.
//
//   node tools/build.mjs            regenerate generated files
//   node tools/build.mjs --check    fail if generated files differ from core/

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const fail = (msg) => { console.error(`Error: ${msg}`); process.exit(1); };
const readJson = (rel) => {
  try { return JSON.parse(read(rel)); } catch (e) { fail(`${rel}: ${e.message}`); }
};

// ---- load and validate -----------------------------------------------------

const meta = readJson('core/meta.json');
for (const k of ['name', 'version', 'displayName', 'description', 'repository']) {
  if (!meta[k]) fail(`core/meta.json is missing "${k}"`);
}

const { servers } = readJson('core/servers.json');
if (!Array.isArray(servers) || servers.length === 0) fail('core/servers.json defines no servers');

const tomlKey = (n) => n.replace(/-/g, '_');
const seenName = new Map();
const seenToml = new Map();
for (const s of servers) {
  for (const k of ['name', 'displayName', 'origin', 'transport', 'auth', 'summary']) {
    if (!s[k]) fail(`core/servers.json: server "${s.name ?? '?'}" is missing "${k}"`);
  }
  // Distinguish "absent" from "false": both are falsy but only one is a mistake.
  for (const k of ['path', 'acceptsVersionArgument', 'userScoped']) {
    if (s[k] === undefined) fail(`core/servers.json: server "${s.name}" is missing "${k}"`);
  }
  if (seenName.has(s.name)) fail(`core/servers.json: duplicate server name "${s.name}"`);
  seenName.set(s.name, true);
  // Codex derives TOML table names by replacing hyphens, so a-b and a_b collide.
  const tk = tomlKey(s.name);
  if (seenToml.has(tk)) fail(`core/servers.json: "${s.name}" and "${seenToml.get(tk)}" both map to the TOML key "${tk}"`);
  seenToml.set(tk, s.name);
  if (s.originOverrideEnv && !s.regions?.cn) fail(`core/servers.json: "${s.name}" sets originOverrideEnv but no regions.cn`);
}

const playbookDir = join(root, 'core/playbooks');
const playbooks = readdirSync(playbookDir).filter((f) => f.endsWith('.md')).sort().map((file) => {
  const name = file.replace(/\.md$/, '');
  const metaRel = `core/playbooks/${name}.meta.json`;
  if (!existsSync(join(root, metaRel))) fail(`${metaRel} is missing (it supplies the title and routing description)`);
  const pm = readJson(metaRel);
  for (const k of ['title', 'description']) if (!pm[k]) fail(`${metaRel} is missing "${k}"`);
  // An assistant picks a playbook by matching this text, so it has to describe
  // trigger conditions rather than restate the title.
  if (pm.description.length < 60) fail(`${metaRel}: "description" must be at least 60 characters`);
  return { name, title: pm.title, description: pm.description, raw: read(`core/playbooks/${file}`) };
});

// ---- values handed to every adapter ----------------------------------------

const url = (s) => s.origin + s.path;
const expandableUrl = (s) => s.originOverrideEnv ? `\${${s.originOverrideEnv}:-${s.origin}}${s.path}` : url(s);
const yaml = (v) => JSON.stringify(v);
const cell = (v) => String(v).replace(/\|/g, '\\|'); // a pipe would split the column

const serverTable = [
  '| Server | Registered as | What it gives you | Version argument | Sign-in |',
  '|---|---|---|---|---|',
  ...servers.map((s) => '| ' + [
    cell(s.displayName),
    '`' + cell(s.name) + '`',
    cell(s.summary),
    s.acceptsVersionArgument ? 'Yes' : 'No',
    s.auth === 'oauth' ? 'Once, in a browser' : 'Not needed',
  ].join(' | ') + ' |'),
].join('\n');

const userScoped = servers.filter((s) => s.userScoped);
const userScopedNote = userScoped.length
  ? `${userScoped.map((s) => s.displayName).join(' and ')} act${userScoped.length > 1 ? '' : 's'} as the signed-in user and stay${userScoped.length > 1 ? '' : 's'} within that user's permissions. An operation the user is not permitted to perform returns a permission error. Report that error rather than retrying or working around it.`
  : '';

const cnOrigin = servers.find((s) => s.regions?.cn)?.regions.cn ?? '';
const regionNote = cnOrigin
  ? `use \`${cnOrigin}\` as the Portal origin`
  : 'no regional override is defined';

const fill = (t) => t
  .replaceAll('{{SERVER_TABLE}}', serverTable)
  .replaceAll('{{PORTAL_CN_ORIGIN}}', cnOrigin)
  .replaceAll('{{USER_SCOPED_NOTE}}', userScopedNote)
  .replaceAll('{{PLAYBOOK_INDEX}}',
    ['| Playbook | Use it when |', '|---|---|',
      ...playbooks.map((p) => `| ${cell(p.title)} | ${cell(p.description)} |`)].join('\n'));

const filled = playbooks.map((p) => ({ ...p, body: fill(p.raw) }));
const agentsMd = fill(read('core/AGENTS.md'));
// Clients without progressive disclosure get one self-contained file.
const bundledAgentsMd = [agentsMd, ...filled.map((p) => p.body)].join('\n---\n\n');

const ctx = {
  meta, servers, playbooks: filled, agentsMd, bundledAgentsMd,
  url, expandableUrl, tomlKey, yaml, regionNote, cnOrigin,
  manualAdd: servers.map((s) => `claude mcp add --scope user --transport ${s.transport} ${s.name} ${url(s)}`).join('\n'),
};

// ---- run every adapter -----------------------------------------------------

const adapters = [];
for (const f of readdirSync(join(root, 'tools/clients')).filter((f) => f.endsWith('.mjs')).sort()) {
  const mod = await import(pathToFileURL(join(root, 'tools/clients', f)).href)
    .catch((e) => fail(`tools/clients/${f}: ${e.message}`));
  for (const k of ['name', 'files', 'setupSection']) {
    if (!mod[k]) fail(`tools/clients/${f} does not export "${k}"`);
  }
  adapters.push(mod);
}

const BANNER = 'Generated from core/ by tools/build.mjs. Do not edit.';
const stamp = (rel, body) => {
  if (rel.endsWith('.json')) return body; // manifests reject unknown fields
  if (rel.endsWith('.toml')) return `# ${BANNER}\n${body}`;
  if (body.startsWith('---\n')) { // keep frontmatter first or it stops being frontmatter
    const end = body.indexOf('\n---\n', 4) + 5;
    return body.slice(0, end) + `\n<!-- ${BANNER} -->\n` + body.slice(end);
  }
  return `<!-- ${BANNER} -->\n\n${body}`;
};

const out = new Map();
const emit = (rel, body) => {
  if (out.has(rel)) fail(`two sources both generate ${rel}`);
  out.set(rel, stamp(rel, body));
};

for (const a of adapters) {
  for (const [rel, body] of a.files(ctx)) emit(`clients/${a.name}/${rel}`, body);
  for (const [rel, body] of a.rootFiles?.(ctx) ?? []) emit(rel, body);
}

emit('clients/SETUP.md',
  `# Registering the Kanzi MCP servers\n\n${serverTable}\n\n` +
  `| Server | URL |\n|---|---|\n${servers.map((s) => `| \`${cell(s.name)}\` | \`${url(s)}\` |`).join('\n')}\n\n` +
  `For mainland China, ${regionNote}.\n\n${adapters.map((a) => a.setupSection(ctx)).join('\n')}\n` +
  `## Any other MCP client\n\nUse the URLs above. The Portal server needs interactive OAuth, so the client must support browser sign-in.\n\n` +
  `Some clients normalize server names. Codex, for example, uses underscores.\n`);

// A template token reaching a generated file would ship as literal text.
for (const [rel, body] of out) {
  const leftover = body.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail(`${rel} still contains the template token ${leftover[0]}`);
}

// ---- write or check --------------------------------------------------------

const GENERATED_ROOTS = ['clients', '.claude-plugin'];

const walk = (dir) => {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir)).flatMap((entry) => {
    const rel = `${dir}/${entry}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
};

if (CHECK) {
  const problems = [];
  for (const [rel, body] of out) {
    const p = join(root, rel);
    if (!existsSync(p)) problems.push(`missing:   ${rel}`);
    else if (readFileSync(p, 'utf8') !== body) problems.push(`differs:   ${rel}`);
  }
  // An orphan is the drift this check exists to catch: a renamed or deleted
  // playbook leaves a stale file that would otherwise ship forever.
  for (const dir of GENERATED_ROOTS) {
    for (const rel of walk(dir)) if (!out.has(rel)) problems.push(`unexpected: ${rel}`);
  }
  if (problems.length) {
    fail(`generated files do not match core/:\n  ${problems.join('\n  ')}\n\nRun: node tools/build.mjs`);
  }
  console.log(`${out.size} generated files match core/`);
} else {
  for (const dir of GENERATED_ROOTS) rmSync(join(root, dir), { recursive: true, force: true });
  for (const [rel, body] of out) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
    console.log('  ' + rel);
  }
  console.log(`\n${out.size} files from ${adapters.length} clients and ${playbooks.length} playbooks`);
}
