// Each test copies the repository sources into a temporary directory, mutates
// one thing, and asserts that the build either rejects it or renders it safely.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'kanzi-agent-tools-'));
  for (const item of ['core', 'tools']) cpSync(join(root, item), join(dir, item), { recursive: true });
  return dir;
}

function build(dir, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [join(dir, 'tools/build.mjs'), ...args], { encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, output: stdout };
  } catch (e) {
    return { ok: false, output: (e.stderr ?? '') + (e.stdout ?? '') };
  }
}

const servers = (dir) => JSON.parse(readFileSync(join(dir, 'core/servers.json'), 'utf8'));
const writeServers = (dir, s) => writeFileSync(join(dir, 'core/servers.json'), JSON.stringify(s, null, 2));

function addPlaybook(dir, name, { title = 'Probe playbook', description = 'A description long enough to satisfy the minimum length the build enforces.' } = {}) {
  writeFileSync(join(dir, `core/playbooks/${name}.md`), `# ${title}\n\nBody.\n`);
  writeFileSync(join(dir, `core/playbooks/${name}.meta.json`), JSON.stringify({ title, description }, null, 2));
}

test('the committed sources build and are self-consistent', () => {
  const dir = fixture();
  assert.equal(build(dir).ok, true);
  assert.equal(build(dir, ['--check']).ok, true);
  rmSync(dir, { recursive: true, force: true });
});

test('duplicate server names are rejected', () => {
  const dir = fixture();
  const s = servers(dir);
  s.servers.push({ ...s.servers[0] });
  writeServers(dir, s);
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /duplicate server name/);
  rmSync(dir, { recursive: true, force: true });
});

test('server names that collide as TOML keys are rejected', () => {
  const dir = fixture();
  const s = servers(dir);
  s.servers.push({ ...s.servers[0], name: s.servers[0].name.replace(/-/g, '_') });
  writeServers(dir, s);
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /TOML key/);
  rmSync(dir, { recursive: true, force: true });
});

test('a missing server field is rejected rather than rendered empty', () => {
  const dir = fixture();
  const s = servers(dir);
  delete s.servers[1].acceptsVersionArgument;
  writeServers(dir, s);
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /acceptsVersionArgument/);
  rmSync(dir, { recursive: true, force: true });
});

test('a playbook cannot overwrite another generated file', () => {
  const dir = fixture();
  const { name } = JSON.parse(readFileSync(join(dir, 'core/meta.json'), 'utf8'));
  addPlaybook(dir, name); // collides with the entry skill, which is named after the plugin
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /both generate/);
  rmSync(dir, { recursive: true, force: true });
});

test('a description too short to select on is rejected', () => {
  const dir = fixture();
  addPlaybook(dir, 'probe', { description: 'Too short.' });
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /at least 60 characters/);
  rmSync(dir, { recursive: true, force: true });
});

test('a pipe in metadata does not break the generated table', () => {
  const dir = fixture();
  addPlaybook(dir, 'probe', { title: 'Left | Right' });
  assert.equal(build(dir).ok, true);
  const agents = readFileSync(join(dir, 'clients/codex/AGENTS.md'), 'utf8');
  const row = agents.split('\n').find((l) => l.includes('Left'));
  assert.match(row, /Left \\\| Right/);
  assert.equal(row.split(/(?<!\\)\|/).length - 2, 2, 'the row must still have two columns');
  rmSync(dir, { recursive: true, force: true });
});

test('an adapter missing an export is named in the error', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'tools/clients/broken.mjs'), 'export const name = "broken";\n');
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /broken\.mjs/);
  rmSync(dir, { recursive: true, force: true });
});

test('malformed JSON names the file it came from', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'core/servers.json'), '{ not json');
  const r = build(dir);
  assert.equal(r.ok, false);
  assert.match(r.output, /core\/servers\.json/);
  rmSync(dir, { recursive: true, force: true });
});

test('--check reports a hand-edited generated file', () => {
  const dir = fixture();
  build(dir);
  const p = join(dir, 'clients/claude-code/.mcp.json');
  writeFileSync(p, readFileSync(p, 'utf8') + '\n');
  const r = build(dir, ['--check']);
  assert.equal(r.ok, false);
  assert.match(r.output, /differs/);
  rmSync(dir, { recursive: true, force: true });
});

test('--check reports a file left behind by a removed playbook', () => {
  const dir = fixture();
  build(dir);
  mkdirSync(join(dir, 'clients/claude-code/skills/removed'), { recursive: true });
  writeFileSync(join(dir, 'clients/claude-code/skills/removed/SKILL.md'), 'stale\n');
  const r = build(dir, ['--check']);
  assert.equal(r.ok, false);
  assert.match(r.output, /unexpected/);
  rmSync(dir, { recursive: true, force: true });
});

test('no template token survives into a generated file', () => {
  const dir = fixture();
  build(dir);
  for (const f of ['clients/SETUP.md', 'clients/codex/AGENTS.md', 'clients/cursor/AGENTS.md']) {
    assert.doesNotMatch(readFileSync(join(dir, f), 'utf8'), /\{\{[A-Z_]+\}\}/, f);
  }
  rmSync(dir, { recursive: true, force: true });
});
