# lnwjud Release Checklist

**Current version:** `v4.9.1` - Windows installer `lnwjud-Setup-4.9.1.exe`; MCP registry **214 configurable tools / 208 advertised by default**.

Run the release verification from PowerShell at the repository root. The automated gate must fail fast on any non-zero stage and `git diff --check` must pass before packaging or publishing.

## Automated evidence

- Workspace traversal and junction/reparse-point tests pass without broadening the configured path boundary.
- Secret-file policy and log/incident redaction tests pass; release evidence must never contain credentials or tokens.
- MCP local HTTP and STDIO transport tests pass, including protocol-only stdout and production handshake coverage.
- Multi-workspace and multi-session Desktop MCP acceptance passes with one listener, parallel A/B flows, scoped ownership, logs, and destructive boundaries.
- Project lifecycle tests verify archive/restore/remove semantics: archived projects leave the active MCP trust boundary, removal preserves project files/history, duplicate paths restore the existing registration, and machine-root workspaces remain protected.
- Tool catalog synchronization passes with 214 configurable tools and 208 advertised by default; the six `codex_*` delegation tools remain opt-in.
- Process ownership, PID identity, descendant shutdown, and bounded output limit tests pass.
- The fake Codex integration flow runs only against a disposable fixture and leaves a reviewable Git diff.
- Packaging tests verify the Windows installer configuration, portable shortcut behavior, and required runtime assets.
- The packaged-app smoke is run against the produced Windows artifact before release.

## Manual clean-machine evidence

On a clean Windows account or VM, install and launch the packaged application, confirm first-run data creation, exercise a disposable workspace and Doctor, close the application, then uninstall it. Record only pass/fail status, OS architecture, installer path, and relevant error codes.

Run one low-impact real Codex discovery/delegation check only in a disposable Git fixture. Do not automate provider quota consumption and do not read Codex credential files.

If Electron cannot launch because the host is missing a runtime or its Chromium process cannot start, preserve the exact environment failure and rerun the launch/install/uninstall portion on a clean supported Windows host. Do not weaken Electron sandbox, context isolation, or web security to make the gate pass.
