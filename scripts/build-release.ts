/**
 * Build the Plugin Release: the files `firstmate install worklog` puts in the
 * Plugin directory (FirstMate ADR-0033, and ADR-0003 here).
 *
 *   node scripts/build-release.ts [out]      (`npm run release`; out is `release`)
 *
 * The repository runs from source with no build step. Only the Plugin Release
 * is built: `mcp.ts` and `src/` are bundled into one `mcp.js`, not minified so
 * that a stack trace stays readable, and `web/` is copied as it is. It writes
 * no `mcp.ts`, because the Host starts `mcp.ts` before `mcp.js` (FirstMate
 * ADR-0028) and would run the source. It writes no `worklog.db`: the Release
 * Files are the only files `update` replaces, and the data is not one of them.
 *
 * `mcp` is the repository's own wrapper with its entry point swapped, so the
 * search for a Node 24 has one source.
 */
import { chmod, cp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsdown';

const REPOSITORY = dirname(dirname(fileURLToPath(import.meta.url)));
const out = resolve(process.argv[2] ?? join(REPOSITORY, 'release'));

await rm(out, { recursive: true, force: true });

await build({
  cwd: REPOSITORY,
  config: false,
  entry: { mcp: join(REPOSITORY, 'mcp.ts') },
  format: 'esm',
  platform: 'node',
  outDir: out,
  // The Plugin is "type": "module", so .js is already ESM.
  fixedExtension: false,
  clean: false,
  dts: false,
  minify: false,
  sourcemap: false,
  logLevel: 'warn',
});

await cp(join(REPOSITORY, 'web'), join(out, 'web'), { recursive: true });

const wrapper = (await readFile(join(REPOSITORY, 'mcp'), 'utf8')).replace(
  'src/main.ts',
  'mcp.js',
);
if (wrapper === (await readFile(join(REPOSITORY, 'mcp'), 'utf8'))) {
  throw new Error('The mcp wrapper no longer names src/main.ts; fix scripts/build-release.ts.');
}
await writeFile(join(out, 'mcp'), wrapper);
await chmod(join(out, 'mcp'), 0o755);
