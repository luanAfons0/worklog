/**
 * The entry point the Host runs: its own Node, with this file, in the Plugin
 * directory, with no shell (FirstMate ADR-0028). It works on every system the
 * App runs on, because it needs nothing but a Node.
 *
 * It keeps one thing quiet. Before Node 24.15, `node:sqlite` prints an
 * ExperimentalWarning when it loads, and the Host cannot pass
 * `--disable-warning` to a Plugin Server. A Plugin Server that has nothing
 * surprising to say should say nothing, so that warning alone is dropped;
 * every other warning still reaches stderr. `mcp`, the `sh` wrapper for a
 * `wsl` Place, runs `src/main.ts` the same way.
 */
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'ExperimentalWarning' && warning.message.includes('SQLite')) return;
  process.stderr.write(`(node:${process.pid}) ${warning.name}: ${warning.message}\n`);
});

await import('./src/main.ts');
