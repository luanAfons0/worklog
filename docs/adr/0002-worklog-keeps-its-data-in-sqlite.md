# Worklog keeps its data in SQLite

Worklog keeps every Cycle it ever had, and reading history back means questions
across Cycles: what was Done in this one, which Entries moved through three.
It keeps its data in one SQLite file, `worklog.db`, in its own directory and
ignored by git, through `node:sqlite`, which is built into Node 24. Scheduler
keeps JSON files; Worklog does not, because its history is queried, not read
whole.

## Consequences

Worklog takes no dependency for this. It needs Node 24 or newer, which its `mcp`
wrapper finds the way Scheduler's does, because the Host's service PATH holds
only an older Node.

The file was `daily.db` before the Plugin was renamed. Start-up renames an old
`daily.db`, and the files SQLite keeps beside it, to `worklog.db` before it
opens anything. That is a rename and not a schema step, because the content
does not change.

## Amended: the Host's own Node runs `mcp.ts` (FirstMate ADR-0028)

FirstMate ADR-0028 amends the first paragraph of the consequences above. The
Host now starts `mcp.ts` with its own Node, on Linux and on Windows, so the
Plugin does not look for a Node there. The `mcp` wrapper still finds a Node 24
the way Scheduler's does, but only in a `wsl` Place, where the Host starts
`./mcp`.

So the Plugin can run on a Node it did not choose. Start-up reads the version
of that Node before the Store opens anything. A Node older than 24 is one
sentence on stderr and a non-zero exit, and the Plugin is Stopped.
