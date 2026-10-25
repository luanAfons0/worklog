/**
 * Start-up: check the Node, open `worklog.db`, serve the tools.
 *
 * There is nothing to configure. The Host spawned this process, holds both
 * ends of its pipe, and started it in the Plugin's own directory, so the one
 * file this Plugin owns is one relative path away (FirstMate ADR-0005).
 *
 * It says nothing on the way up. A Plugin Server that started is what the
 * Index Page shows; the journal is for what went wrong.
 */
import { sentenceFor, serve } from './mcp.ts';
import { openStore, renameOldFile } from './store.ts';
import { toolsFor } from './tools.ts';

/** The oldest Node major this Plugin runs on: TypeScript with no build step, and node:sqlite. */
const OLDEST_NODE = 24;

// The Host's own Node runs this file (FirstMate ADR-0028), and that Node can be
// older than this Plugin wants. A Node too old to read TypeScript never gets
// here; one that can, but is older than 24, would run with an experimental
// node:sqlite (ADR-0002). So it is one sentence and a non-zero exit, before
// the Store opens anything.
const major = Number(process.versions.node.split('.')[0]);
if (major < OLDEST_NODE) {
  process.stderr.write(
    `worklog: this is Node ${process.versions.node}, and this Plugin needs Node ${OLDEST_NODE} ` +
      `or newer. Start the Host with a Node ${OLDEST_NODE}.\n`,
  );
  process.exit(1);
}

// A file that cannot be renamed or opened is one sentence and a non-zero exit:
// the Index Page shows the Plugin Stopped and the journal carries the reason.
const store = (() => {
  try {
    renameOldFile();
    return openStore();
  } catch (fault) {
    process.stderr.write(`worklog: ${sentenceFor(fault)}\n`);
    return process.exit(1);
  }
})();

serve(toolsFor(store));
