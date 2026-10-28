/**
 * The Plugin Release: what `npm run release` writes, and that it runs.
 *
 * The build runs once into a temporary folder, as the release workflow runs it
 * into `release/` (FirstMate ADR-0033). The test then does what `install` does:
 * it puts the files in a Plugin directory and starts `mcp.js` with the running
 * Node and no shell, as the Host does. It must answer as `mcp.ts` does.
 */
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeDirectory, startPluginServer } from './helpers/plugin.ts';

const REPOSITORY = dirname(dirname(fileURLToPath(import.meta.url)));

/** Run the release build into a fresh folder, and give back the folder. */
async function build(t: test.TestContext): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), 'worklog-release-'));
  t.after(() => rm(parent, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  const out = join(parent, 'release');
  const ran = spawnSync(process.execPath, ['scripts/build-release.ts', out], {
    cwd: REPOSITORY,
    encoding: 'utf8',
  });
  assert.equal(ran.status, 0, `${ran.stdout}${ran.stderr}`);
  return out;
}

test('the release build writes mcp.js, web/ and mcp, and no source', async (t) => {
  const out = await build(t);

  const names = (await readdir(out)).sort();

  assert.deepEqual(names, ['mcp', 'mcp.js', 'web']);
  assert.ok(!names.includes('mcp.ts'), 'the Host would start mcp.ts before mcp.js');
  assert.ok(!names.includes('src'));
  assert.ok((await readdir(join(out, 'web'))).includes('index.html'));
});

test('release mcp.js answers initialize and tools/list as mcp.ts does', async (t) => {
  const out = await build(t);
  const directory = await makeDirectory(t);
  await cp(out, directory, { recursive: true });
  const released = await startPluginServer(t, { directory, entry: join(directory, 'mcp.js') });
  const source = await startPluginServer(t);

  const [fromRelease, fromSource] = [await released.handshake(), await source.handshake()];
  assert.equal(fromRelease.error, undefined, released.output());
  assert.deepEqual(fromRelease.result, fromSource.result);
  const listed = await released.ask('tools/list');
  assert.deepEqual(listed.result, (await source.ask('tools/list')).result);
  assert.ok(((listed.result as { tools: unknown[] }).tools ?? []).length > 0);
});

test('the release mcp wrapper starts mcp.js', { skip: process.platform === 'win32' }, async (t) => {
  const out = await build(t);
  const directory = await makeDirectory(t);
  await cp(out, directory, { recursive: true });

  const plugin = await startPluginServer(t, { directory, wrapper: true, wrapperPath: join(directory, 'mcp') });

  assert.equal((await plugin.handshake()).error, undefined, plugin.output());
});
