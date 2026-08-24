<p align="center">
  <img src="assets/logo/logo-256x256.png" width="160" alt="lnwjud logo" />
</p>

<h1 align="center">lnwjud</h1>

<p align="center">
  <strong>Windows-first local AI-agent runtime and MCP gateway</strong><br />
  <em>214 configurable tools for local files, Git, processes, Windows automation, WSL, browser control, indexing, observability, and extensibility; 208 are advertised by default because codex_* delegation is opt-in.</em>
</p>

<p align="center">
  <a href="https://github.com/engasnm111/lnwjud/releases/latest"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/engasnm111/lnwjud" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows%20x64-0078D4" />
  <img alt="Node" src="https://img.shields.io/badge/Node.js-24.x-339933" />
  <img alt="MCP" src="https://img.shields.io/badge/MCP-214%20tools-6f42c1" />
</p>

---

## What is lnwjud?

lnwjud is a Windows-first local development gateway that exposes trusted local
capabilities through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).
It is designed for AI-assisted software development where the agent needs more
than a text-only chat: it may need to inspect a repository, search code, edit
files, review Git state, run project commands, manage owned processes, inspect
Windows UI state, automate a managed browser, work with WSL, or call an
additional local MCP server.

The runtime stays on the Windows machine. Local filesystem paths, processes,
SQLite state, credentials, and capability backends are owned by lnwjud on that
machine. Remote AI clients only receive the MCP requests and results that travel
through the connection mode you choose.

For ChatGPT web and other supported OpenAI surfaces, lnwjud supports the official
[OpenAI Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels).
The tunnel is outbound-only: `tunnel-client` runs beside lnwjud, reaches OpenAI
over outbound HTTPS, forwards MCP work to the local stdio server, and returns the
response without opening a public inbound port on the Windows machine.

## Current version: v4.9.1

The v4.9.1 release target and runtime contract contain **214 configurable MCP tools**,
with **208 advertised by default** because
the six `codex_*` delegation tools are opt-in. The earlier 184-tool snapshot remains
only as the compatibility baseline used by the v4 architecture; new v4 gateway
capabilities are additive.

### What's new in v4.9.1

- Adds first-class project lifecycle management in the Desktop Projects page: active projects can be archived, archived projects can be restored, and project registrations can be removed with a two-step confirmation.
- Treats archived workspaces as inactive trust-boundary entries: they remain in SQLite for management/history labels but are excluded from normal runtime/MCP workspace lookup until restored.
- Makes project removal registration-only. Removing a project from lnwjud does **not** delete its directory, files, Git repository, audit history, or checkpoints; system/machine-root workspaces are protected from archive/remove actions.
- Repairs selected-workspace state after archive/removal, stops the workspace index watcher, blocks lifecycle changes while tracked Desktop work is active, and restores an archived registration instead of creating a duplicate when the same path is added again.
- Keeps Home/Git selectors limited to active workspaces while Projects, Work Log, and Live Logs retain the management/history context needed to understand archived workspaces.

### What's new in v4.9.0

- Adds real multi-workspace / multi-session operation on one lnwjud installation: Desktop workspace selection no longer restarts the MCP listener, HTTP/STDIO sessions have stable ownership boundaries, and process/Codex/shell/WSL/task handles are isolated by session and workspace.
- Makes destructive authorization request-scoped instead of relying on the Desktop-selected project, while keeping destructive auto-approval disabled by default, preserving Protected Critical Files, and supporting recoverable delete/restore.
- Makes shared activity and durable runtime state safe for concurrent owners with per-owner activity leases, session-namespaced state, atomic writes, inter-process locking, shared plugin/worktree ledgers, and fail-closed checkpoint persistence under I/O contention.
- Propagates workspace/session metadata through audit, Work Log, Live Logs, and process feeds; adds workspace/session filters, badges, scoped clear controls, and filtered log export without splitting global settings.
- Adds real two-session/two-workspace release acceptance and release-gate coverage, including parallel build/test/background/Git workflows, handle isolation, updater safety, packaging, and Windows installer verification.
- Fixes Work Log attribution for shell calls from clients with an older/stale schema: a registered workspace is inferred from cwd for logging only, and the task workspace is retained for later wait/status/logs/result/cancel activity without weakening permission or path policy.

### What's new in v4.8.5

- Adds two user-configurable wait controls under **Settings → Tools & Timeouts**.
  **MCP Poll / Tool Wait** is adjustable from 5–60 seconds with a 5-second
  default, while **Foreground Shell Wait** is adjustable from 5–60 seconds
  with a 60-second default. Both limits are validated by the desktop IPC
  boundary and persisted in the local SQLite settings store.
- Applies both wait settings live to the Desktop HTTP runtime and direct STDIO /
  Secure Tunnel runtime. Changing only these timing controls does not require a
  Local MCP restart; shell foreground/wait paths read the current value through a
  provider and MCP `shell`/`wsl_exec` polling reads the current poll window per call.
- Uses the same configurable MCP poll window for experimental `tasks/result` and
  advertised task `pollInterval`, while preserving the durable background-task
  contract: reaching the wait limit never kills the command running on the machine.
- Strengthens agent guidance for long-running work: after one or two checks still
  report `running`, preserve the task ID and return control instead of tight-polling
  inside one ChatGPT turn. This reduces message-delivery timeouts without losing
  the background build, test, install, or packaging task.

### What's new in v4.8.4

- Makes MCP command execution non-blocking by policy: `shell` and `wsl_exec`
  `run` requests are normalized to durable background execution and return a
  task handle immediately, while MCP `wait` polling is capped at 5 seconds.
  Long builds, tests, installs, and packaging jobs therefore keep running on the
  machine instead of holding one ChatGPT/MCP tool request open until it times out.
- Keeps the core `ShellCapabilityBackend` independent from that transport policy.
  Direct/internal foreground callers retain the 60-second synchronous wait ceiling;
  regression coverage verifies a foreground command running beyond 5 seconds still
  returns its terminal result normally.
- Bounds experimental MCP Tasks `tasks/result` to a short ~5-second request window.
  Non-terminal tasks direct clients back to `tasks/get` polling, while durable task
  state, logs, cancellation, and later result retrieval continue across runtime runs.
- Clarifies immediate-return `process_start` and `project_*` contracts, updates the
  live catalog to 214 configurable tools (208 advertised by default because the six
  `codex_*` delegation tools are opt-in), and synchronizes the README, architecture,
  packaging, and release metadata for v4.8.4.
- Documents the separately configurable STDIO permission profile and optional Strict
  Roots while preserving the backward-compatible `full` profile default.

### What's new in v4.8.3

- Hardened the real desktop MCP E2E flow for hosted Windows runners by allowing
  the managed project-test process up to 60 seconds to publish its terminal
  status. The test already has a 180-second scenario budget; this change only
  removes the overly strict 15-second inner poll and keeps the same terminal
  state assertions.
- Keeps the v4.8.2 canonical-path fix and targeted Vitest timeout budgets intact;
  no runtime permission, process, or MCP behavior is relaxed by this patch.

### What's new in v4.8.2

- Hardened the v4.8 release line for clean Windows CI/release runners: document
  workspace-boundary checks now compare canonical paths so Windows 8.3 aliases
  do not produce false outside-workspace failures while junction/symlink escapes
  remain rejected.
- Increased the Vitest budget only for the three process/I/O-heavy smoke and
  integration tests that legitimately exceed the 5-second default on hosted
  Windows runners. Performance assertions remain separate and unchanged.
- Version metadata, packaging assertions, installer naming, and the generated
  213-tool runtime contract are synchronized to `4.8.2`.

### What's new in v4.8.0

- Durable background tasks (shell/wsl_exec `execution=background`) are exposed
  through the experimental MCP Tasks utility (spec 2025-11-25): `tasks/get`,
  `tasks/result`, `tasks/list`, and `tasks/cancel`, advertised as
  `capabilities.tasks { list, cancel }`. Task creation stays with the `shell`
  tool; task-augmented `tools/call` is intentionally not declared yet. See
  `docs/mcp/MCP_TASKS.md` for the state mapping and known deviations.
- Wave 3: the WinRT OCR helper gained build/sign/register scripts
  (`scripts/build-windows-ocr.ps1`, `scripts/register-windows-ocr.ps1` with a
  self-signed dev path), real cached host-side identity probing, packaging
  assets, and installer shipping (`windows-ocr` extra resource).
- Wave 5: `event_watch`/`crash_trace` serve bounded allowlisted `Get-WinEvent`
  queries; `sandbox_exec` stages the artifact-only WSB plan, launches
  `WindowsSandbox.exe`, and retrieves stdout/stderr/exit-code behind dry-run
  and confirmation gating.
- Wave 6: read-only SQLite `db_inspect`/`db_query` (workspace-confined,
  single SELECT/PRAGMA), a minimal stdio LSP client behind
  `lsp_diagnostics`/`lsp_rename` (`LNWJUD_LSP_<LANGUAGE>_COMMAND`), and a
  persisted Git worktree ownership ledger with `git_worktree_remove`.
  DAP stays contract-only by design.
- Wave 7: PowerPoint `read`/`save_as` and read-only Outlook folder/message
  headers joined the Office COM boundary; `pdf_extract_tables`/`inspect_pdf`
  run through an optional local PDF provider; `docx_merge` and
  `inspect_workbook` use Word/Excel COM; the phase-37 compare/preview
  adapters now report truthful optional availability.
- Wave 8: `self_heal_plan` proposes allowlisted reversible fixes from live
  evidence and `self_heal_apply` executes them behind dry-run + explicit
  confirmation with no automatic destructive retry. `agent_swarm_run`
  remains planned (the only local subagent provider is Codex, which the
  chat-quota-only policy keeps off-limits).
### What's new in v4.7.1

- Resilient long-session workflows for chat-quota runs: a run budget guard
  appends near-limit warnings to tool results, `session_handoff` builds a
  same-chat continuation prompt from the tracker, Git state, and durable task
  IDs, and `verify_incremental` caches typecheck results keyed by the Git diff.
- Codex delegation tools (`codex_*`) are disabled unless explicitly enabled,
  keeping the separate Codex work quota untouched. The long-session guide is
  `docs/CHATGPT_LONG_SESSION.md`.

### What's new in v4.7.0

- End-user configuration: the desktop Settings page gained a user config panel
  with persisted preferences, plus tray, tunnel-controller, and update-check
  scheduler refinements backed by new persistence tests.

### What's new in v4.6.0

- Durable background command tasks decouple long-running Windows work from a
  single MCP tool-call lifetime. Background tasks can survive MCP/stdio runtime
  replacement and are recovered by task ID for status, logs, result, or cancel.
- Selectable stdio/Secure-Tunnel permission profiles (`safe`, `balanced`,
  `full`, or `custom`) plus opt-in **Strict Roots**. The compatibility default
  remains `full` with existing machine roots until Strict Roots is enabled.
- **AI Destructive Actions** are opt-in per command family and default **OFF** on fresh installs. `delete_file`, Git delete/discard commands, direct shell delete commands, and WSL delete commands can be enabled independently, but scoped auto-approval is always restricted to the Active Project/workspace boundary. Critical-file protection and recoverable `delete_file` remain enabled by default.
- Checkpoint file payloads are encrypted at rest with AES-256-GCM. The local
  encryption key is protected with Windows DPAPI, and legacy plaintext
  checkpoint rows are upgraded to ciphertext as the encrypted repository starts.
- SQLite-consistent automatic backup/restore with daily and weekly retention,
  pre-migration/pre-update snapshots, cross-process backup coordination, and
  restart-safe restore handling.
- PowerShell hardening adds `-NonInteractive` to internal launches and verifies
  the packaged Windows capability bridge SHA-256 before every execution.
- Live Logs and Work Log now use newest-first bounded tables, filtering/search,
  full-entry copy actions, clear-all handling, improved pop-out behavior, and
  clearer MCP TASK/RESULT/ERROR presentation.
- Desktop dependencies were refreshed within compatible release lines to
  Electron 43.4.1 and Vite 7.3.6 without migrating to electron-vite.

Current v4 highlights include:

- Workspace registration, bounded project snapshots, file reads/writes, paging,
  full scans, persistent indexing, and continuation tokens.
- Git status/diff/log plus policy-checked Git execution.
- Foreground/background command tasks with ownership, timeout, cancellation,
  bounded output, logs, and result retrieval.
- Project-aware development, test, lint, typecheck, and build commands.
- Local Codex discovery and optional delegation without reading Codex credential
  files.
- Native Windows capabilities for shell execution, windows, accessibility,
  input, screen capture, notifications, clipboard, file dialogs, audio, screen
  recording, Office automation, and scheduler integration.
- Managed Chrome / CDP automation and Set-of-Marks annotated observations with
  expiring observation hashes and approval-gated target actions.
- Scoped WSL execution and Windows/WSL path translation for registered
  workspaces.
- Skills discovery plus child MCP discovery/description/call contracts.
- Compound and parallel workflows, deterministic semantic tool routing, and
  Context Economy telemetry.
- Trace-correlated activity, NDJSON/SQLite audit metadata, Work Log, Live Logs,
  Doctor checks, health surfaces, and background tray operation.
- OpenAI Secure MCP Tunnel management with Windows DPAPI-encrypted runtime-key
  storage and reconnect handling.

Authoritative in-repository references:

- [Tool contract](docs/architecture/TOOL_CONTRACT.md) — core primitive schemas,
  policy classes, and compatibility rules; the 214-tool configurable index below comes from the live runtime registry.
- [Upgrade architecture](docs/architecture/UPGRADE_ARCHITECTURE.md) — v4 runtime
  architecture and additive gateway design.
- [Roadmap phase status](docs/architecture/ROADMAP_PHASE_STATUS.md) — completed
  implementation phases.

## Security model you should understand before using it

lnwjud is intentionally powerful. It is intended for a machine and workspace you
trust, not as a sandbox for unknown code.

- **Unrestricted mode is enabled by default.** Fixed local drives can be
  registered as machine roots and inspected by the local-agent runtime.
- Desktop MCP applies the selected permission profile (`safe`, `balanced`,
  `full`, or `custom`) to tool calls.
- The packaged stdio/Secure-Tunnel runtime supports selectable `safe`,
  `balanced`, `full`, or `custom` profiles. For backward compatibility the
  default remains **full** with the existing machine-root behavior until Strict
  Roots is enabled.
- **Strict Roots** is opt-in and limits stdio/Secure-Tunnel workspace visibility
  to explicitly allowed roots. It is a filesystem/capability boundary, not an
  operating-system sandbox.
- Explicit file reads can include sensitive files such as `.env` when the active
  policy permits them. Do not register or expose a machine to an AI client you
  do not trust.
- Destructive operations are centrally classified. Filesystem deletion,
  destructive Git forms, destructive shell/process commands, opaque child MCP
  calls, HTTP DELETE, mutating Office operations, and opaque UI operations that
  may delete data require explicit confirmation (`userConfirmed: true`) before
  backend execution.
- Disk formatting and machine shutdown/reboot remain hard-blocked by the
  capability policy.
- The local Streamable HTTP MCP endpoint binds to loopback. Do not publish that
  loopback endpoint through a generic reverse proxy. For a private remote
  connection, use Secure MCP Tunnel.
- Runtime tunnel API keys saved from the desktop UI are encrypted with Windows
  DPAPI for the current Windows user. Never commit a runtime key, `.env`, tunnel
  profile containing a plaintext secret, private key, or credential file.

The Context Economy Engine reduces automatic discovery cost without acting as a
security deny list. Automatic search/index/watch flows skip vendor, build,
cache, binary, generated-bundle, and source-map noise, while explicit reads or
full scans can still inspect paths allowed by the active workspace/policy.

## Connection modes

| Client / use case | Connection | What must run on Windows | Notes |
| --- | --- | --- | --- |
| ChatGPT web developer-mode app | OpenAI Secure MCP Tunnel | `tunnel-client` + `lnwjud-mcp-stdio.cmd` | Private outbound-only path; no public MCP port |
| Codex CLI or another local MCP host | Local stdio MCP | `lnwjud-mcp-stdio.cmd` | Lowest-overhead local MCP path |
| Local MCP client / dashboard diagnostics | Loopback Streamable HTTP | lnwjud Desktop | Defaults to `http://127.0.0.1:18765/mcp`; actual URL is shown in the UI |
| Supported OpenAI API/Codex surface | Secure MCP Tunnel | `tunnel-client` + local MCP target | Tunnel association and Platform permissions apply |

The desktop HTTP server starts automatically after lnwjud resolves a workspace.
If the preferred port `18765` is busy, the server can fall back to an ephemeral
loopback port; always use the endpoint shown in the dashboard. The **Start
Connection** button is useful after a manual stop, while **Stop Connection**
stops the current local HTTP listener.

## Quick start: install the Windows release

### 1. Install lnwjud Desktop

1. Download the latest published installer from
   [GitHub Releases](https://github.com/engasnm111/lnwjud/releases/latest).
   The Windows installer for the current version is `lnwjud-Setup-4.9.1.exe`; download the published artifact from GitHub Releases.
2. Run the NSIS installer and launch **lnwjud Agent Control Center**.
3. Add or select the project/workspace you want lnwjud to operate on.
4. Review **Settings** before attaching an AI client, especially Permission
   Profile and Unrestricted Mode.

The graphical desktop app and the packaged stdio/Secure-Tunnel launcher are
self-contained. The installer ships Electron for the dashboard and a private
Node.js 24 runtime for `lnwjud-mcp-stdio.cmd`, so end users do **not** need a
separate system Node.js installation.

### 2. Prepare OpenAI Secure MCP Tunnel for ChatGPT web

OpenAI's current Secure MCP Tunnel flow requires a Platform tunnel ID, a runtime
API key, and a private MCP server that `tunnel-client` can reach. Creating or
editing a tunnel requires **Tunnels Read + Manage**; running `tunnel-client` or
selecting a tunnel while creating the ChatGPT app requires **Tunnels Read +
Use**.

1. Open [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels).
2. Create a tunnel named `lnwjud` and associate it with the Platform organization
   that owns it and the ChatGPT workspace that should use it.
3. Create a restricted runtime API key with **Tunnels Read + Use**.
4. Download the current `tunnel-client.exe` from the Platform tunnel page or the
   official [openai/tunnel-client releases](https://github.com/openai/tunnel-client/releases).
5. Determine the installed stdio launcher path, normally:

```text
C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd
```

6. In a temporary PowerShell session, initialize the tunnel profile:

```powershell
$env:CONTROL_PLANE_API_KEY = '<runtime-key-for-this-session>'
$tc = 'C:/path/to/tunnel-client.exe'

& $tc init `
  --sample sample_mcp_stdio_local `
  --profile lnwjud `
  --tunnel-id 'tunnel_0123456789abcdef0123456789abcdef' `
  --mcp-command 'C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd'

& $tc doctor --profile lnwjud --explain
Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue
```

Use forward slashes in executable paths stored in YAML to avoid accidental YAML
escape sequences.

### 3. Save tunnel settings in the desktop UI

In **Settings → OpenAI Secure MCP Tunnel**:

1. Save the runtime API key. lnwjud encrypts it locally with Windows DPAPI.
2. Save the path to `tunnel-client.exe`.
3. Confirm `%APPDATA%/tunnel-client/lnwjud.yaml` exists.
4. Start the tunnel from the dashboard.
5. Open **Live Logs** or run **Doctor** if the tunnel fails to start.

The desktop tunnel controller runs `tunnel-client doctor` before launch, rewrites
the profile to prefer the packaged stdio launcher when available, starts the
client with a seven-day MCP connection ceiling, detects externally started
lnwjud tunnel processes, and performs bounded reconnect attempts after
unexpected exits.

### 4. Add lnwjud to ChatGPT

For current ChatGPT developer-mode MCP testing, use the official
[Connect and test your plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt)
guide as the UI source of truth because workspace policy and labels can change.
The stable flow is:

1. Enable Developer mode for the target ChatGPT account/workspace if your plan
   and workspace policy allow it.
2. Open [ChatGPT Plugins](https://chatgpt.com/plugins) and select the plus button.
3. Enter a name/description, choose **Tunnel** under Connection, and select the
   associated `lnwjud` tunnel or enter its `tunnel_id`.
4. Create the connection and review the discovered tools and metadata.
5. Confirm that the default runtime exposes **208 tools** (or **214** when Codex delegation is explicitly enabled) and run a read-only
   smoke test before trying writes.

Example smoke test:

```text
Use lnwjud to list registered workspaces, report Git status for the selected project, and summarize the top-level project tree. Do not modify anything.
```

## Quick start: build from source

Requirements for source development:

- Windows x64.
- Node.js `>=24.0.0 <25`.
- Git.
- Corepack with the repository-pinned `pnpm@10.15.0`.
- PowerShell 7 recommended; Windows PowerShell 5.1 is sufficient for most helper
  scripts.
- `rg` (ripgrep) recommended.

```powershell
git clone https://github.com/engasnm111/lnwjud.git
Set-Location .\lnwjud
corepack enable
corepack pnpm@10.15.0 install --frozen-lockfile
Copy-Item .env.example .env

# Build all packages and the desktop app
corepack pnpm@10.15.0 build

# Launch the development desktop runtime
corepack pnpm@10.15.0 desktop
```

Optional Windows installer build:

```powershell
corepack pnpm@10.15.0 package:windows
```

The generated x64 NSIS installer is written under
`apps/desktop/dist/installers/`.

## Run in the Windows system tray

Closing the main lnwjud window hides it instead of shutting down the desktop
runtime. The MCP listener, Live Logs, tunnel controller, and background services
continue running and the lnwjud icon remains in the Windows notification area.
Use the tray menu to reopen the dashboard, check for updates, or quit the process
completely.

## The packaged stdio launcher

`lnwjud.exe` is the graphical desktop entrypoint. MCP stdio clients and Secure
MCP Tunnel should use the generated launcher instead:

```text
lnwjud-mcp-stdio.cmd --workspace D:\projects\my-app
```

The build generates `lnwjud-mcp-stdio.cjs`, `lnwjud-mcp-stdio.cmd`, and a
private `lnwjud-node.exe` copied from the pinned Node.js 24 build runtime.
These generated runtime files are intentionally ignored by Git. The Windows
package copies them next to the installed application and into its resources
directory, and the launcher uses only this bundled runtime rather than a system
Node installation or `PATH`.

### STDIO permission profiles and strict roots

The packaged stdio launcher keeps the historical behavior by default: the permission profile is `full` and machine-drive roots are registered as before. You can opt into a narrower policy per launch:

```text
lnwjud-mcp-stdio.cmd --workspace D:\\projects\\my-app --profile safe --strict-roots --allowed-root D:\\projects\\my-app
```

Supported profiles are `safe`, `balanced`, `full`, and `custom`. Equivalent environment variables are `LNWJUD_STDIO_PROFILE`, `LNWJUD_STRICT_ROOTS`, and semicolon-separated `LNWJUD_ALLOWED_ROOTS`. Desktop Settings stores the same policy for OpenAI Secure MCP Tunnel launches. In strict-root mode lnwjud skips automatic whole-drive registration and exposes only explicitly allowed canonical roots; absolute paths outside those roots fail closed. Existing realpath/reparse-point and secret-policy checks still apply. Strict roots are a filesystem/capability boundary, not an OS sandbox: spawned programs still run under the Windows user token.

The **AI Destructive Actions** policy in Desktop Settings is separate from the normal permission profile. Every destructive auto-approval toggle defaults **OFF** on fresh installs. Users can opt in independently to scoped `delete_file`, `git rm`, `git clean`, `git reset / restore`, direct `rm / unlink`, `rmdir / rd`, `del / erase`, and the corresponding WSL delete families. Auto-approval never bypasses the Active Project/workspace boundary; targets that escape the project, use unsafe broad patterns, or cannot be proven safe fall back to explicit chat confirmation. **Protected Critical Files** and recoverable `delete_file` are enabled by default, so protected manifests/secrets/recovery metadata are not auto-approved and supported deletes are checkpointed/moved to Recovery Trash for restoration.

## Requirements and optional integrations

### Core requirements

- Windows x64.
- Node.js 24.x for source development/builds. Installed releases bundle their own private Node 24 runtime for stdio/Secure Tunnel.
- Git/Corepack/pnpm for source development.

### Optional dependencies

- Codex CLI for `codex_*` delegation tools.
- `rg` for fast code search; lnwjud has bounded fallbacks where supported.
- Chrome/Chromium for managed CDP/browser capabilities.
- WSL for `wsl_exec` and `wsl_fs`.
- Microsoft Office applications for Office automation actions that require the
  native Office stack.
- FFmpeg and other media helpers for capabilities that report them as available.

### OpenAI / ChatGPT requirements for Secure MCP Tunnel

- An OpenAI Platform organization with tunnel access.
- A tunnel associated with the intended Platform organization and ChatGPT
  workspace.
- **Tunnels Read + Manage** to create/edit a tunnel.
- **Tunnels Read + Use** to run `tunnel-client` or select a tunnel in the ChatGPT
  app flow.
- ChatGPT Developer mode access according to the target plan/workspace policy.
- Outbound HTTPS from the Windows host to `api.openai.com:443` (or the documented
  mTLS control-plane host when configured).
- No inbound firewall rule or public lnwjud MCP port is required for Secure MCP
  Tunnel.

## Install from source

### Clone and install dependencies

```powershell
git clone https://github.com/engasnm111/lnwjud.git
Set-Location .\lnwjud
corepack pnpm@10.15.0 install --frozen-lockfile
```

Do not silently upgrade the package manager: the lockfile is pinned to
pnpm@10.15.0.

### Configure Environment

```powershell
Copy-Item .env.example .env
```

### Build and run the desktop dashboard

One command from the repository root:

```powershell
Set-Location .\lnwjud
corepack pnpm@10.15.0 desktop
```

This builds the desktop app and opens the Agent Control Center. MCP HTTP
auto-starts on launch (no Start Connection click required). The dashboard owns
the SQLite state, workspace registry, permission profile, work-log audit
records, loopback MCP lifecycle, and Secure Tunnel controls.

Optional environment:

```powershell
$env:LNWJUD_DATA_PATH = "$env:LOCALAPPDATA\lnwjud"
$env:LNWJUD_WORKSPACE = "D:\projects\my-app"
corepack pnpm@10.15.0 desktop
```

Use the same `LNWJUD_DATA_PATH` for desktop UI and the packaged stdio launcher
so ChatGPT tool activity appears in the Work Log. The launcher is the same
direct MCP entrypoint used by the Codex/tunnel integration.

### Build a Windows installer

```powershell
Set-Location .\lnwjud
corepack pnpm@10.15.0 package:windows
```

The x64 NSIS installer is written to:

```text
apps/desktop/dist/installers/lnwjud-Setup-4.9.1.exe
```

The installer is per-user by default. A common installed executable path is:

```text
C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud.exe
```

Always use the path shown by the installed shortcut or Get-Command.

## Configure the local desktop application

### Add a workspace

1. Start lnwjud (`pnpm desktop` or the installed app).
2. On Home or Projects, add the project directory path.
3. The selected project is persisted; switching projects restarts MCP automatically.
4. Desktop MCP uses the selected Permission profile; stdio/tunnel MCP uses its separately configured STDIO profile (backward-compatible default: `full`) and optional Strict Roots.
5. Run Doctor from the sidebar if a dependency is reported missing.

Every file operation resolves the supplied path against a registered workspace,
canonicalizes existing parents/targets, rejects traversal and reparse-point
escapes, and applies the secret policy after resolution.

### Permission profiles

| Profile | READ | WRITE | EXECUTE | DANGEROUS | Intended use |
| --- | --- | --- | --- | --- | --- |
| safe | allow | ask | ask | deny | Read and approve changes carefully |
| balanced | allow | allow | allow | ask | Normal development |
| full | allow | allow | allow | allow | Explicitly trusted local automation |
| custom | configured | configured | configured | configured | Host-defined policy |

Desktop MCP honors the selected profile for every MCP tool, including local
capabilities. The packaged stdio/tunnel runtime keeps **full** as the
backward-compatible default, but accepts `safe`, `balanced`, `full`, or `custom`
through the launcher/environment/Desktop STDIO policy settings; optional Strict
Roots can further constrain visible roots. This policy is stored separately from
the Desktop MCP profile. Unrestricted mode remains the compatibility default
when Strict Roots is not enabled (every fixed drive is a machine root).
Filesystem deletion-style commands require confirmation. Disk format, shutdown,
and reboot stay hard-blocked. Destructive Git forms including `rm` / `clean` /
`reset` require explicit chat confirmation followed by `userConfirmed: true`.

### Optional local capability roots

The local desktop capability layer can receive additional roots through the
semicolon-separated environment variable LNWJUD_CAPABILITY_ROOTS:

```powershell
$env:LNWJUD_CAPABILITY_ROOTS = 'E:/work;E:/projects'
```

In the default unrestricted mode, all fixed-drive roots are available to local
capability tools. `LNWJUD_CAPABILITY_ROOTS` is optional extra configuration;
it is not a visibility ignore list. Core file tools still require a registered
workspace, and stdio defaults to the machine roots when the variable is unset.

### Local Streamable HTTP connection

The desktop runtime auto-starts the loopback MCP server after resolving the
selected workspace. In the dashboard:

1. Select a registered workspace.
2. Copy the displayed endpoint, normally `http://127.0.0.1:18765/mcp`.
3. Add it to a compatible local Streamable HTTP MCP client.
4. Use **Stop Connection** when you intentionally want to stop the listener.
5. Use **Start Connection** to start it again after a manual stop.

The endpoint binds to 127.0.0.1, validates origin/host, and uses the same
application services and permission checks as the dashboard. Do not expose the
loopback URL through a generic port forward.

If dom_cdp is available, the dashboard can launch managed Chrome. Browser
automation remains loopback-bound and separate from the file guard.

## Connect a local Codex client

Local Codex clients can use stdio directly; they do not need Secure MCP Tunnel.
Point the entry at the stdio-capable installed executable:

```powershell
codex mcp add lnwjud -- "$env:LOCALAPPDATA\Programs\lnwjud\lnwjud-mcp-stdio.cmd" --workspace E:\lnwjud
codex mcp list
```

The stdio launcher is `lnwjud-mcp-stdio.cmd` shipped next to the desktop app
(not the GUI `lnwjud.exe`). It exposes the full tool catalog, including
skills/MCP bridge meta-tools, and uses the bundled private `lnwjud-node.exe`;
no separate Node.js installation is required for an installed release.

The same server can be added in ChatGPT desktop or an IDE extension under
Settings → MCP servers → Add server → STDIO. Restart the host after saving.
In Codex, /mcp lists active servers.

Example user-scoped or trusted project-scoped config.toml:

```toml
[mcp_servers.lnwjud]
command = "C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd"
args = ["--workspace", "E:/lnwjud"]
startup_timeout_sec = 20
tool_timeout_sec = 3600
```

Use prompt approval while testing an unfamiliar workspace. No OpenAI API key
belongs in this local MCP entry.

## Create an OpenAI Secure MCP Tunnel

This is the path that lets ChatGPT web, which cannot read local files or local
Codex configuration, call lnwjud.

### 1. Create or select a Platform tunnel

Open [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels).
Create a tunnel and record its ID, for example:

```text
tunnel_0123456789abcdef0123456789abcdef
```

Associate the tunnel with the Platform organization that owns it, the target
ChatGPT workspace, and any other Platform organization that will call it. The
same tunnel_id is used by every association.

### 2. Create the correct runtime key

Open [OpenAI Platform API keys](https://platform.openai.com/settings/organization/api-keys).
Create a runtime API key for tunnel-client and grant Tunnels Read + Use.

Do not use an Admin API key or an unrelated project key (sk-proj-...). Keep the
key in a local secret store or environment variable. Never put it in this
repository, a YAML profile, a committed .env file, or a public issue/log. If a
key is exposed, revoke it and create a replacement.

### 3. Download tunnel-client

Use the Platform download link or the [official tunnel-client
releases](https://github.com/openai/tunnel-client). Keep the executable at a
stable path, for example:

```text
C:/Users/<WindowsUser>/Downloads/tunnel/tunnel-client.exe
```

Verify it:

```powershell
$tc = 'C:/Users/<WindowsUser>/Downloads/tunnel/tunnel-client.exe'
& $tc --version
& $tc help quickstart
```

### 4. Create a stdio profile

Set the runtime key only in the current PowerShell process and create the
profile:

```powershell
$env:CONTROL_PLANE_API_KEY = '<runtime-key-for-this-session>'

& $tc init --sample sample_mcp_stdio_local --profile lnwjud --tunnel-id 'tunnel_0123456789abcdef0123456789abcdef' --mcp-command 'C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd'
```

Use forward slashes in the Windows executable path inside the profile.
Backslashes can be interpreted as YAML escapes and turn C:\Users\... into
C:Users....

The generated profile is normally:

```text
C:/Users/<WindowsUser>/AppData/Roaming/tunnel-client/lnwjud.yaml
```

A minimal profile has this shape. The key remains an environment reference:

```yaml
config_version: 1
control_plane:
  base_url: "https://api.openai.com"
  tunnel_id: "tunnel_0123456789abcdef0123456789abcdef"
  api_key: "env:CONTROL_PLANE_API_KEY"
health:
  listen_addr: "127.0.0.1:0"
admin_ui:
  open_browser: false
log:
  level: info
  format: json
mcp:
  # Force a long ceiling via flag/env/YAML (default is only 10m):
  #   --mcp.connection-max-ttl 168h0m0s
  #   MCP_CONNECTION_MAX_TTL=168h0m0s
  #   mcp.connection_max_ttl: 168h0m0s  (snake_case; hyphenated YAML key is rejected)
  connection_max_ttl: 168h0m0s
  commands:
    - channel: main
      command: "C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd"
```

### 5. Run diagnostics and the tunnel

Prefer the desktop Control Center: save the Runtime API key once under Settings,
then click Start Tunnel. The key is stored with Windows DPAPI.

Manual session (still supported):

```powershell
$env:CONTROL_PLANE_API_KEY = '<runtime-key-for-this-session>'
$env:MCP_CONNECTION_MAX_TTL = '168h0m0s'
& $tc doctor --profile lnwjud --explain
if ($LASTEXITCODE -ne 0) { throw 'tunnel-client doctor failed' }
& $tc run --profile lnwjud --mcp.connection-max-ttl 168h0m0s
```

Keep this process and the child `lnwjud-mcp-stdio.cmd` process alive while
ChatGPT is using the connector. Use the same LNWJUD_DATA_PATH as the desktop
app so Work Log entries appear in the Control Center.

### 6. Verify the command locally

```powershell
$lnwjud = 'C:/Users/<WindowsUser>/AppData/Local/Programs/lnwjud/lnwjud-mcp-stdio.cmd'
Test-Path $lnwjud
Test-Path $tc
```

If doctor reports a missing executable, fix the YAML path. If launching the
command opens the dashboard instead of holding a stdio MCP process, install a
stdio-capable package. Do not solve that error with shell: true or an
unrestricted PowerShell command string.

## Start the tunnel automatically at Windows logon

A scheduled task is more reliable than leaving a terminal open. This example
stores the runtime key encrypted with the current Windows user's DPAPI; the key
is not written in plain text to the profile or task command line.

### Save the key once

```powershell
$secretDir = Join-Path $env:APPDATA 'tunnel-client'
New-Item -ItemType Directory -Path $secretDir -Force | Out-Null
$secureKey = Read-Host 'Tunnel runtime API key' -AsSecureString
$secureKey | ConvertFrom-SecureString | Set-Content (Join-Path $secretDir 'lnwjud.runtime.secret')
```

The encrypted value is tied to the same Windows user and machine.

### Create a runner script

Save as start-lnwjud-tunnel.ps1:

```powershell
$ErrorActionPreference = 'Stop'
$tc = 'C:/Users/<WindowsUser>/Downloads/tunnel/tunnel-client.exe'
$profile = 'lnwjud'
$secretPath = Join-Path $env:APPDATA 'tunnel-client/lnwjud.runtime.secret'

if (-not (Test-Path $tc)) { throw "Missing tunnel-client: $tc" }
if (-not (Test-Path $secretPath)) { throw "Missing encrypted runtime key: $secretPath" }

$encrypted = Get-Content $secretPath -Raw
$secureKey = ConvertTo-SecureString $encrypted
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
  $env:CONTROL_PLANE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
  & $tc doctor --profile $profile --explain
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $tc run --profile $profile
  exit $LASTEXITCODE
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue
}
```

### Register the logon task

Run once as the same Windows user who saved the DPAPI secret:

```powershell
$runner = 'C:/Users/<WindowsUser>/Downloads/tunnel/start-lnwjud-tunnel.ps1'
$userId = "$env:USERDOMAIN/$env:USERNAME"
$argument = '-NoProfile -ExecutionPolicy Bypass -File "' + $runner + '"'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType InteractiveToken -RunLevel Limited
Register-ScheduledTask -TaskName 'lnwjud Secure MCP Tunnel' -Action $action -Trigger $trigger -Principal $principal -Force
```

Check or start it:

```powershell
Get-ScheduledTask -TaskName 'lnwjud Secure MCP Tunnel'
Start-ScheduledTask -TaskName 'lnwjud Secure MCP Tunnel'
```

Use Run only when user is logged on and a limited principal unless your
organization has a documented service-account design. lnwjud does not need an
administrator token for normal workspace operations.

## Add the connector in ChatGPT Developer mode

### Enable Developer mode

In ChatGPT web:

1. Open Settings.
2. Select Security and login.
3. Turn on Developer mode.

Enterprise/Edu administrators may need to enable this before it appears.

### Create the developer app

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins).
2. Select the plus (+) button.
3. Enter a name such as lnwjud and a short description such as
   Local Windows development workspace gateway.
4. Under Connection, choose Tunnel.
5. Select the tunnel or enter its tunnel_id.
6. Create the connection and review the discovered tools and schemas.

lnwjud does not expose an OAuth login endpoint. Do not invent OAuth URLs or
paste the runtime key into the ChatGPT connector form. Tunnel authentication is
handled by tunnel-client; ChatGPT selects the OpenAI-hosted tunnel. Choose a
no-extra-auth option only when the tunnel form offers it.

### Attach it to a new chat

Start a new conversation, open the tools menu, and add the lnwjud connection.
A good smoke test is:

```text
Use lnwjud to inspect the available workspace and report only registered workspace IDs and display names. Do not read file contents yet.
```

Then test a read-only project flow:

```text
For workspace <workspace-id>, show the project snapshot, Git status, and the top-level workspace tree. Do not modify anything.
```

After changing tool metadata or restarting the tunnel, refresh the connector and continue in the same chat. Start a new chat only if Refresh connector does not clear a stale schema.

## Complete MCP tool catalog (214 configurable tools; 208 advertised by default)

This index is generated from the current v4.9.1 `ToolRegistry`, not copied from an older release document. Optional/planned tools still appear in the advertised contract and report their availability/requirements at runtime where applicable.

| # | Tool | Permission | Runtime description |
| ---: | --- | --- | --- |
| 1 | `workspace_list` | DANGEROUS | List all registered workspaces/drive roots available to lnwjud. Call this first to discover workspace IDs. Entries include kind=machine_root\|project. |
| 2 | `workspace_register` | WRITE | Register an existing project directory under a machine root (E:\ by default; any drive root in unrestricted mode). parentWorkspaceId must be a machine root from workspace_list. Idempotent for the same path. |
| 3 | `workspace_info` | READ | Return the configured workspace summary. |
| 4 | `workspace_tree` | READ | List a bounded workspace tree. Absolute path does not require workspaceId. |
| 5 | `project_snapshot` | READ | Return a bounded project snapshot without source contents. |
| 6 | `read_file` | READ | Read a workspace file as UTF-8 text or as an image/binary payload. Absolute paths (C:\...) do not require workspaceId. |
| 7 | `read_files` | READ | Read up to twenty workspace files. Absolute paths do not require workspaceId. |
| 8 | `search_files` | READ | Search workspace filenames with automatic context-economy filters; set includeIgnored for an explicit full path search. Absolute path does not require workspaceId. |
| 9 | `search_text` | READ | Search workspace text using direct ripgrep arguments with automatic binary/generated filters; set includeIgnored for an explicit full path search. Absolute path does not require workspaceId. |
| 10 | `git_status` | READ | Inspect parsed read-only Git status. For writes (init, add, commit, remote, push, rm, clean, reset) use the git tool. |
| 11 | `git_diff` | READ | Return a bounded read-only Git diff. For writes use the git tool. |
| 12 | `git_log` | READ | Return bounded structured Git history. For writes use the git tool. |
| 13 | `git` | EXECUTE | Run any git subcommand immediately with a separate args array (init, clone, add, commit, remote, fetch, pull, push, rm, mv, restore, checkout, switch, branch, tag, stash, merge, rebase, cherry-pick, reset, clean, revert). cwd may be an absolute path; workspaceId is then optional. Returns exitCode, stdout, and stderr. Destructive Git operations require explicit chat confirmation and userConfirmed: true. Do not wrap git in powershell/cmd. |
| 14 | `write_file` | WRITE | Write UTF-8 text, creating missing parent directories. Checkpoints an existing target first. Absolute paths do not require workspaceId. |
| 15 | `apply_patch` | WRITE | Validate and apply bounded file changes, creating missing parent directories. |
| 16 | `move_file` | WRITE | Move a file or directory within one workspace, creating missing destination parents. |
| 17 | `copy_file` | WRITE | Copy a file or directory within one workspace, creating missing destination parents. |
| 18 | `delete_file` | DANGEROUS | Delete one file or an empty directory inside its workspace. Confirmation is required by default; Settings can explicitly allow scoped AI deletion while workspace-root deletion stays blocked. |
| 19 | `process_start` | EXECUTE | Immediate-return managed process launcher. Starts one policy-checked executable and returns `processId` after spawn; follow with `process_status` / `process_logs`. |
| 20 | `process_list` | READ | List managed process handles owned by this client in a workspace, including launches whose response was cancelled. |
| 21 | `process_status` | READ | Read status for an owned process handle. |
| 22 | `process_logs` | READ | Read bounded logs for an owned process handle. |
| 23 | `process_stop` | EXECUTE | Stop an owned managed process tree. |
| 24 | `project_dev` | EXECUTE | Immediate-return launcher for the detected project dev command; returns `processId` after spawn and does not wait for completion. |
| 25 | `project_test` | EXECUTE | Immediate-return launcher for the detected project test command; returns `processId` after spawn and does not wait for completion. |
| 26 | `project_lint` | EXECUTE | Immediate-return launcher for the detected project lint command; returns `processId` after spawn and does not wait for completion. |
| 27 | `project_typecheck` | EXECUTE | Immediate-return launcher for the detected project typecheck command; returns `processId` after spawn and does not wait for completion. |
| 28 | `project_build` | EXECUTE | Immediate-return launcher for the detected project build command; returns `processId` after spawn and does not wait for completion. |
| 29 | `codex_status` | READ | Report local Codex installation and capabilities without credential inspection. |
| 30 | `codex_run` | EXECUTE | Delegate an instruction to the local Codex CLI in a workspace. |
| 31 | `codex_task_list` | READ | List local Codex task handles owned by this client, including launches whose response was cancelled. |
| 32 | `codex_task_status` | READ | Read status for an owned Codex task. |
| 33 | `codex_task_logs` | READ | Read bounded logs for an owned Codex task. |
| 34 | `codex_stop` | EXECUTE | Stop an owned Codex task process. |
| 35 | `shell` | EXECUTE | Non-blocking command runner. MCP `run` calls are forced to background and return `task_id` immediately; `wait` uses the configurable 5–60 second poll window (default 5s). After 1–2 running checks, preserve `task_id` and return control instead of tight-polling. |
| 36 | `dom_cdp` | DANGEROUS | Default for web-page DOM work inside managed Chrome: inspect content, query selectors, click, type, navigate, evaluate JavaScript, wait, manage tabs, and capture screenshots. Use steps to batch related DOM actions in one call. |
| 37 | `accessibility` | DANGEROUS | Semantic native Windows UI tool. Inspect UI trees and named controls, then click, focus, read or set values, select controls and menus, or manage a native element. Prefer shell for direct system work and dom_cdp for web pages. |
| 38 | `input_event` | DANGEROUS | Low-level keyboard and pointer fallback. Use only when DOM/CDP and Accessibility cannot operate the target. Supports text, keys, mouse movement, clicks, drag, scroll, held buttons, release_all, and batched sequences. |
| 39 | `vision` | READ | Visual and OCR fallback for content unavailable through DOM or Accessibility. Capture a display, window, or region, or run local Vision OCR. It never clicks or types. |
| 40 | `vision_annotated_capture` | READ | Capture a local Windows screen/region/window and return a short-lived Set-of-Marks observation with numbered bounds, a content hash, and an annotated PNG. This tool only observes; use ui_target_action for a separately gated action. |
| 41 | `ui_target_action` | DANGEROUS | Act on one mark from a current vision_annotated_capture observation. The observation ID, optional hash, TTL, workspace owner, and current Accessibility element are checked before the action is sent. |
| 42 | `window` | DANGEROUS | Direct native Windows window management. List, inspect, activate, move, resize, minimize, maximize, restore, or close windows without raw coordinates when a window operation is sufficient. |
| 43 | `health` | READ | Diagnostics only. Check all lnwjud backends or one public tool after a failure, when asked for status, or while diagnosing permissions. Do not use as a preflight before normal work. |
| 44 | `system_info` | READ | Read-only system information: OS, CPU, memory, disks, battery, uptime, and top processes by memory. Use for environment checks and diagnostics. |
| 45 | `notification` | EXECUTE | Show a Windows notification (toast when BurntToast is installed, balloon otherwise). Use to tell the user when a long task finishes. |
| 46 | `file_dialog` | EXECUTE | Open a native Windows file open/save dialog and return the chosen path(s). The dialog does not read or write files itself; use the guarded file tools afterwards. |
| 47 | `clipboard` | DANGEROUS | Read or write the Windows clipboard (text, or PNG image as base64). Use get_text/get_image to read and set_text to write. |
| 48 | `web_fetch` | DANGEROUS | Fetch an http/https URL (GET/POST/PUT/DELETE/HEAD) with bounded size and timeout. HTTP DELETE requires explicit chat confirmation and userConfirmed: true. Returns status, headers, and text or base64 body. |
| 49 | `audio` | DANGEROUS | Record the microphone to a WAV file or play a local audio file through MCI. record is synchronous and limited to 600 seconds. Use stop to abort an ongoing record/play. |
| 50 | `screen_record` | DANGEROUS | Record the screen to an MP4 using ffmpeg gdigrab (requires ffmpeg on PATH). start spawns a background capture, status checks it, stop finalizes the file. Recording stops automatically after 3600 seconds. |
| 51 | `office` | DANGEROUS | Automate Excel or Word through COM. Mutating actions (write, replace, save_as) require explicit chat confirmation and userConfirmed: true. Requires Microsoft Office installed. |
| 52 | `scheduler` | DANGEROUS | Manage Windows scheduled tasks with schtasks.exe. list enumerates tasks, create registers a new task, run starts one immediately. delete requires the user to confirm in chat first, then pass userConfirmed: true. |
| 53 | `wsl_exec` | EXECUTE | Scoped WSL2 developer runner. MCP `run` calls are forced to background and return `task_id` immediately; `wait` uses the configurable 5–60 second poll window (default 5s). After 1–2 running checks, preserve `task_id` and return control instead of tight-polling. |
| 54 | `wsl_fs` | READ | Translate paths and inspect metadata between a registered Windows workspace and WSL without exposing raw \\wsl$ read/write access. |
| 55 | `skills_list` | DANGEROUS | List local agent skills discovered from Cursor, Claude, Agents, workspace skill roots, and lnwjud settings. Filter with query or source. |
| 56 | `skills_read` | DANGEROUS | Read a local skill SKILL.md (or a relative file inside the skill folder). Follow the skill instructions with lnwjud tools and mcp_call. |
| 57 | `mcp_list` | DANGEROUS | List local MCP servers discovered from Cursor, Claude Desktop, and lnwjud settings. Does not flatten child tools into the lnwjud catalog. |
| 58 | `mcp_describe` | DANGEROUS | Connect to one local MCP server (if needed) and return its tool names, descriptions, and input schemas. |
| 59 | `mcp_call` | DANGEROUS | Call a tool on a discovered local MCP server. Because child side effects cannot be proven non-destructive at this boundary, every mcp_call requires explicit chat confirmation and userConfirmed: true. |
| 60 | `workspace_context` | READ | Aggregate ranked workspace context with snippets, symbols, Git/test relevance, economy metadata, and continuation; automatic discovery can be explicitly expanded. |
| 61 | `workspace_context_continue` | READ | Continue a workspace_context result without discarding unreturned candidates. |
| 62 | `workspace_full_scan` | READ | Enumerate workspace files with full access by default; set includeIgnored false to use the persistent automatic index. |
| 63 | `workspace_full_scan_continue` | READ | Continue a workspace_full_scan result page. |
| 64 | `workspace_snapshot` | READ | Return workspace identity and project snapshot metadata without source contents. |
| 65 | `search_all` | READ | Search text and filenames across one or all registered workspaces with automatic economy filters or an explicit includeIgnored override. |
| 66 | `read_many_files` | READ | Read many workspace files in parallel while preserving one result or error per requested path. |
| 67 | `read_file_page` | READ | Read a deterministic line chunk with explicit continuation instead of silently truncating a large file. |
| 68 | `read_file_page_continue` | READ | Continue read_file_page from the next deterministic line chunk. |
| 69 | `workspace_index` | READ | Build or refresh the persistent workspace index using automatic context filters unless ignored paths are explicitly included. |
| 70 | `workspace_index_status` | READ | Return persistent index metadata and lossless watcher queue telemetry. |
| 71 | `workspace_index_watch` | READ | Watch all workspace paths and incrementally re-index only changed paths with configurable debounce/concurrency. |
| 72 | `workspace_index_stop` | READ | Stop a workspace watcher after draining all queued path updates. |
| 73 | `session_handoff` | READ | Create a concise same-chat continuation message from the real phase tracker, current git status/diff, and durable background task IDs. |
| 74 | `verify_incremental` | EXECUTE | Cache project typecheck results by current Git status/diff fingerprint; unchanged edits return a cache hit. |
| 75 | `symbol_search` | READ | Search indexed symbols across the workspace. |
| 76 | `find_definition` | READ | Find deterministic symbol definitions. |
| 77 | `find_references` | READ | Find textual and indexed references to a symbol. |
| 78 | `find_implementations` | READ | Find interface and class implementations. |
| 79 | `call_hierarchy` | READ | Return a deterministic call hierarchy approximation. |
| 80 | `import_graph` | READ | Return indexed imports and exports for a module. |
| 81 | `dependency_graph` | READ | Return package and module dependency metadata. |
| 82 | `module_graph` | READ | Return the workspace module graph. |
| 83 | `type_search` | READ | Search indexed TypeScript, JavaScript, and Python types. |
| 84 | `trace_symbol` | READ | Combine definition, references, imports, tests, and recent context. |
| 85 | `context_ranking` | READ | Explain ranking signals without removing lower-ranked context. |
| 86 | `debug_context` | READ | Gather deterministic debugging context and continuation metadata. |
| 87 | `review_context` | READ | Gather code-review context. |
| 88 | `change_context` | READ | Gather changed files, symbols, dependencies, and tests. |
| 89 | `symbol_context` | READ | Gather context around a symbol. |
| 90 | `test_context` | READ | Gather relevant test context. |
| 91 | `dependency_context` | READ | Gather dependency-related context. |
| 92 | `git_context` | READ | Gather Git status, diff, and history context. |
| 93 | `frontend_context` | READ | Gather frontend project context. |
| 94 | `backend_context` | READ | Gather backend project context. |
| 95 | `route_intent` | READ | Classify a prompt with a deterministic, overridable route. |
| 96 | `recipe_list` | READ | List built-in and user recipe names. |
| 97 | `recipe_describe` | READ | Describe a recipe plan and permissions. |
| 98 | `recipe_run` | EXECUTE | Preview or run a deterministic recipe plan. |
| 99 | `dry_run` | READ | Return a no-side-effect execution preview. |
| 100 | `review_changes` | READ | Review current Git changes and affected context. |
| 101 | `changed_symbols` | READ | Find symbols in changed files. |
| 102 | `affected_modules` | READ | Find modules affected by current changes. |
| 103 | `git_history_context` | READ | Return relevant recent Git history. |
| 104 | `git_blame_context` | READ | Return line ownership context for a file. |
| 105 | `discover_tests` | READ | Discover project tests without imposing an execution limit. |
| 106 | `run_affected_tests` | EXECUTE | Plan or run tests affected by changed files. |
| 107 | `test_failures` | READ | Summarize recorded test failures. |
| 108 | `coverage_context` | READ | Return coverage context when project tooling provides it. |
| 109 | `test_history` | READ | Return recent test execution history. |
| 110 | `cache_stats` | READ | Return shared cache hit/miss telemetry. |
| 111 | `cache_clear` | WRITE | Clear safe local runtime caches. |
| 112 | `cache_invalidate` | WRITE | Invalidate cache entries for a path or workspace. |
| 113 | `hook_list` | READ | List registered lifecycle hooks. |
| 114 | `hook_register` | WRITE | Register a deterministic lifecycle hook descriptor. |
| 115 | `hook_remove` | WRITE | Remove a lifecycle hook descriptor. |
| 116 | `skill_match` | READ | Match relevant local skills without loading all skill text. |
| 117 | `skill_load` | READ | Load a selected local skill by identifier. |
| 118 | `plugin_install` | DANGEROUS | Install a declared plugin after permission evaluation. |
| 119 | `plugin_list` | READ | List installed and enabled plugins. |
| 120 | `plugin_enable` | WRITE | Enable an installed plugin. |
| 121 | `plugin_disable` | WRITE | Disable an installed plugin. |
| 122 | `plugin_remove` | DANGEROUS | Remove an installed plugin. |
| 123 | `session_context` | READ | Return persisted development-session context. |
| 124 | `session_checkpoint` | WRITE | Persist a development-session checkpoint. |
| 125 | `session_resume` | READ | Resume a persisted session context. |
| 126 | `session_history` | READ | Return session checkpoints and decisions. |
| 127 | `response_mode` | READ | Select compact, normal, verbose, or stream formatting. |
| 128 | `inspect_web_app` | READ | Combine DOM, console, network, URL, and screenshot metadata. |
| 129 | `debug_ui` | READ | Gather deterministic UI debugging context. |
| 130 | `capture_ui_state` | READ | Capture a structured UI state. |
| 131 | `form_context` | READ | Inspect form controls and values metadata. |
| 132 | `network_context` | READ | Summarize browser network context. |
| 133 | `console_context` | READ | Summarize browser console context. |
| 134 | `browser_debug_context` | READ | Combine browser diagnostics for one request. |
| 135 | `windows_environment` | READ | Inspect Windows environment metadata. |
| 136 | `service_context` | READ | Inspect Windows service metadata. |
| 137 | `process_context` | READ | Inspect process-tree context. |
| 138 | `port_context` | READ | Inspect local listening-port context. |
| 139 | `registry_context` | READ | Inspect registry context through the Windows capability boundary. |
| 140 | `event_log_context` | READ | Inspect Windows event-log context. |
| 141 | `installed_runtime_context` | READ | Inspect installed runtimes and package managers. |
| 142 | `path_context` | READ | Resolve executable and PATH context. |
| 143 | `startup_context` | READ | Inspect startup configuration context. |
| 144 | `mcp_discover` | READ | Discover external MCP servers without flattening native tools. |
| 145 | `mcp_health` | READ | Return external MCP connection health. |
| 146 | `mcp_resources` | READ | List resources exposed by connected MCP servers. |
| 147 | `task_create` | EXECUTE | Create a visible managed runtime task. |
| 148 | `task_status` | READ | Read managed task state. |
| 149 | `task_cancel` | EXECUTE | Cancel a managed runtime task. |
| 150 | `task_result` | READ | Read a managed task result. |
| 151 | `task_list` | READ | List managed runtime tasks. |
| 152 | `delegate` | EXECUTE | Delegate a task through a policy/audit adapter. |
| 153 | `delegate_status` | READ | Read delegated agent state. |
| 154 | `delegate_cancel` | EXECUTE | Cancel a delegated agent task. |
| 155 | `delegate_result` | READ | Read a delegated agent result. |
| 156 | `parallel_delegate` | EXECUTE | Run isolated read-only agent tasks with collision metadata. |
| 157 | `permission_check` | READ | Evaluate an action class without limiting allowed context reads. |
| 158 | `permission_profile` | READ | Return the active Permission v2 profile. |
| 159 | `live_logs_query` | READ | Query structured activity/log metadata with correlation IDs. |
| 160 | `live_logs_status` | READ | Return Live Logs pipeline health and source status. |
| 161 | `telemetry_dashboard` | READ | Return runtime performance telemetry. |
| 162 | `context_economy_stats` | READ | Return context discovery, deduplication, ledger, and token-efficiency telemetry. |
| 163 | `execution_plan` | READ | Return the cheapest deterministic execution plan and reason. |
| 164 | `repo_map` | READ | Return a traversable repository structural map. |
| 165 | `context_expand` | READ | Return optional import, caller, type, test, and change references. |
| 166 | `recovery_status` | READ | Return reconnect, retry, continuation, cache, and worker recovery state. |
| 167 | `tool_schema_list` | READ | List versioned tool schema metadata. |
| 168 | `tool_schema_register` | WRITE | Register a backward-compatible tool schema descriptor. |
| 169 | `capabilities` | READ | Discover capability categories without requiring every full schema. |
| 170 | `tool_search` | READ | Search tools, tags, phases, and descriptions deterministically. |
| 171 | `tool_dynamic_filter` | READ | Return a bounded ranked tool set using deterministic scoring with optional local rerank fallback. |
| 172 | `tool_describe` | READ | Describe one tool contract on demand. |
| 173 | `tool_categories` | READ | List tool categories and counts. |
| 174 | `tool_function_find` | READ | Find the best local tool/function candidates for a prompt. |
| 175 | `tool_aliases` | READ | List stable shorthand aliases and their primitive tool targets. |
| 176 | `mcp_hub` | READ | Describe the additive MCP hub boundary without flattening child tools or retaining credentials. |
| 177 | `dev_context` | READ | Run the unified deterministic development-context facade. |
| 178 | `recipe_catalog` | READ | Return inspectable developer automation recipes. |
| 179 | `capture_screenshot` | READ | Capture screenshot metadata for visual validation. |
| 180 | `compare_screenshot` | READ | Compare screenshot metadata or supplied artifacts. |
| 181 | `dom_snapshot` | READ | Return a structured DOM snapshot. |
| 182 | `layout_metadata` | READ | Return layout metadata for visual validation. |
| 183 | `visual_context` | READ | Combine screenshot, DOM, layout, console, and network references. |
| 184 | `inspect_workbook` | READ | Inspect workbook structure through an optional spreadsheet plugin. |
| 185 | `compare_workbook_layout` | READ | Compare workbook layout metadata through an optional spreadsheet plugin. |
| 186 | `render_excel_preview` | READ | Render an Excel preview through an optional spreadsheet plugin. |
| 187 | `inspect_pdf` | READ | Inspect PDF metadata and page structure through an optional PDF plugin. |
| 188 | `compare_pdf_pages` | READ | Compare PDF page metadata through an optional PDF plugin. |
| 189 | `project_profile_get` | READ | Read project intelligence conventions. |
| 190 | `project_profile_set` | WRITE | Update project intelligence conventions. |
| 191 | `handoff_context` | READ | Build a structured cross-agent handoff bundle. |
| 192 | `benchmark_run` | EXECUTE | Run or preview a benchmark scenario. |
| 193 | `regression_report` | READ | Return benchmark and regression results. |
| 194 | `sandbox_exec` | EXECUTE | Run an artifact-based Windows Sandbox job with networking disabled and read-only mapped input. |
| 195 | `event_watch` | EXECUTE | Watch an allowlisted user-mode ETW or Windows Event Log diagnostic stream. |
| 196 | `crash_trace` | READ | Return bounded crash and service-diagnostic context from allowlisted user-mode sources. |
| 197 | `lsp_diagnostics` | READ | Read diagnostics from an owned language-server child process. |
| 198 | `lsp_rename` | WRITE | Create a cross-file LSP rename edit plan before any workspace write. |
| 199 | `debug_attach` | EXECUTE | Attach a DAP client only to an owned workspace debug adapter. |
| 200 | `debug_step` | EXECUTE | Perform a bounded DAP stepping/read operation in an owned debug session. |
| 201 | `git_worktree_spawn` | DANGEROUS | Create an owned Git worktree for isolated agent work with collision metadata. |
| 202 | `git_worktree_remove` | DANGEROUS | Remove a ledger-owned Git worktree after dry-run and explicit confirmation. |
| 203 | `db_inspect` | READ | Inspect a local database schema through a configured, read-only connection. |
| 204 | `db_query` | DANGEROUS | Run a bounded local database query under explicit connection and mutation policy. |
| 205 | `office_ppt` | DANGEROUS | Automate PowerPoint through the existing Office policy boundary. |
| 206 | `office_outlook` | READ | Read Outlook folder/message metadata through the existing Office policy boundary. |
| 207 | `pdf_extract_tables` | READ | Extract bounded PDF text and tables through a local document provider. |
| 208 | `docx_merge` | WRITE | Create a deterministic DOCX merge plan and write only after approval. |
| 209 | `self_heal_plan` | READ | Propose safe, deterministic, reversible recovery steps without applying mutations. |
| 210 | `self_heal_apply` | DANGEROUS | Apply an approved reversible recovery plan without automatic destructive retries. |
| 211 | `skills_import` | WRITE | Import a compatible skill descriptor after validation and permission review. |
| 212 | `agent_swarm_run` | EXECUTE | Plan bounded parallel subagents with ownership, collision, approval, and cancellation metadata. |
| 213 | `tool_batch` | DANGEROUS | Execute multiple MCP tools with parallel, dependency-aware, timeout, cancellation, and partial-result handling. |

## Detailed capability guide

### Workspace and project inspection

| Tool | Permission | What it does |
| --- | --- | --- |
| workspace_info | READ | Returns display name, canonical root, project profile, and Git summary |
| workspace_tree | READ | Returns a bounded directory tree; hidden and heavy folders are included, with depth/entry bounds and truncation metadata |
| project_snapshot | READ | Returns profile, Git counts, top-level tree, managed processes, and recent error summaries without source contents |

### Optional machine-root discovery extension

The current default is **Unrestricted mode**, which registers every available
fixed drive (C:, D:, E:, …) as a machine root. If Unrestricted mode is explicitly
disabled, the restricted machine-root contract keeps **E:** (`E:\`) as the sole
machine root and prunes other drive-root registrations. Project folders may be
registered below the active machine roots through MCP or the desktop UI.

| Tool | Permission | Input | What it does |
| --- | --- | --- | --- |
| workspace_list | DANGEROUS | Empty object | Lists registered machine roots and project workspaces (`kind`: `machine_root` or `project`) |
| workspace_register | WRITE | parentWorkspaceId, path, optional displayName | Registers an existing project directory below a machine root (idempotent; any drive root in unrestricted mode) |

The extension still validates the parent ID, canonical path, and reparse points.
**Secret and hidden files are intentionally readable in the default unrestricted
mode** (including `.env`, keys, and credentials) on every fixed drive. Image and
other binary files are returned as base64 with no application size cap. Paths
outside registered roots remain denied only when unrestricted mode is explicitly
disabled.

Local capability tools (`shell`, `vision`, `accessibility`, `input_event`,
`window`, `dom_cdp`, `health`) are available on both desktop HTTP MCP and
stdio/tunnel. Shell allowed roots include `E:\`.

If your build does not advertise `workspace_register`, register the workspace
from the desktop dashboard and use its workspace ID.

### Files and search

| Tool | Permission | What it does |
| --- | --- | --- |
| read_file | READ | Reads a workspace file as UTF-8 or an image/binary payload. Absolute paths do not require workspaceId. |
| read_files | READ | Reads up to 20 workspace files. Absolute paths do not require workspaceId. |
| search_files | READ | Searches workspace filenames with bounded results; automatic mode skips vendor/build/binary/generated paths |
| search_text | READ | Searches text through direct ripgrep arguments; automatic mode avoids binary/generated context |
| write_file | WRITE | Writes UTF-8 text, creates missing parents, and checkpoints an existing target before overwrite |
| apply_patch | WRITE | Validates and applies bounded file changes, creating missing parents |
| move_file | WRITE | Moves a file or directory within one workspace, creating missing destination parents |
| copy_file | WRITE | Copies a file or directory within one workspace, creating missing destination parents |
| delete_file | DANGEROUS | Deletes one file or an empty directory after the user confirms in chat (`userConfirmed: true`) |

In the default unrestricted mode, `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa*`,
`id_ed25519*`, `.ssh/**`, `.aws/**`, and `credentials.json` are readable on
every fixed drive. Explicitly setting unrestricted mode to false restores the
restricted-drive secret policy.

### Git

| Tool | Permission | What it does |
| --- | --- | --- |
| git | EXECUTE | Runs git subcommands; destructive forms require explicit chat confirmation plus `userConfirmed: true` |
| git_status | READ | Parsed read-only working-tree status |
| git_diff | READ | Bounded read-only diff with truncation metadata |
| git_log | READ | Bounded structured commit history |

Use `git` for init, add, commit, remote, push, pull, rm, clean, reset, and
branch deletes. `git_status` / `git_diff` / `git_log` remain structured
read-only views. Destructive Git forms such as `rm`, `clean`, `reset`, forced branch/tag moves, stash removal, force-push, and working-tree discard require explicit confirmation before execution.

### Processes and project commands

| Tool | Permission | What it does |
| --- | --- | --- |
| process_start | EXECUTE | Starts one policy-checked executable; destructive command forms require explicit confirmation |
| process_status | READ | Reads state for an owned process handle |
| process_logs | READ | Reads bounded stdout/stderr records with sequence numbers |
| process_stop | EXECUTE | Stops an owned managed process tree |
| project_dev | EXECUTE | Runs the detected project development command |
| project_test | EXECUTE | Runs the detected project test command |
| project_lint | EXECUTE | Runs the detected project lint command |
| project_typecheck | EXECUTE | Runs the detected project type-check command |
| project_build | EXECUTE | Runs the detected project build command |

process_start uses an executable plus an args array with shell false. It is not
PowerShell, CMD, or a free-form shell parser. Project commands come from the
detected ProjectProfile.

### Context Economy Engine

Automatic discovery is optimized for useful context rather than raw tree size.
The default policy skips `node_modules`, `.git`, `dist`, `build`, `coverage`,
`.next`, `.turbo`, `.cache`, `vendor`, `target`, `bin`, `obj`, virtualenvs,
binary files, bundles, and source maps. Lockfiles and large JSON/log/CSV files
start as metadata summaries; source and tests start with relevant symbol/line
ranges; changed Git files are ranked first.

This policy is not a deny list. Explicit reads remain full-access within the
normal workspace boundary, for example:

```text
read_file({ "path": "node_modules/pkg/index.js" })
read_many_files({ "files": [{ "path": ".env" }, { "path": ".git/config" }] })
search_files({ "includeIgnored": true, "path": "node_modules/pkg" })
workspace_context({ "includeIgnored": true, "query": "login" })
```

The Context Ledger keeps bounded in-memory fingerprints and small previous
contents. Repeated delivery can be represented as `unchanged`, a line `diff`,
or a duplicate `referencePath`; unchanged bytes are not sent again. The
`context_economy_stats` tool and `telemetry_dashboard` expose raw discovered
bytes, delivered bytes, duplicate/previously-seen bytes avoided, skipped paths,
ledger hits, and estimated savings. No raw file content or credential is
persisted by this telemetry.

### Local Codex delegation

| Tool | Permission | What it does |
| --- | --- | --- |
| codex_status | READ | Reports local Codex installation/version/capabilities without credential inspection |
| codex_run | EXECUTE | Delegates an instruction to local Codex and returns codexTaskId |
| codex_task_status | READ | Reads state for an owned Codex task |
| codex_task_logs | READ | Reads bounded logs for an owned Codex task |
| codex_stop | EXECUTE | Stops only a Codex task launched by lnwjud |

Typical flow: codex_run → poll task status/logs → inspect git_diff → run checks.

### Local desktop capabilities

| Tool | Permission | Actions |
| --- | --- | --- |
| shell | EXECUTE | Non-blocking MCP command execution; `run` is forced to background, returns `task_id` immediately, and follow-up status/logs/result calls inspect progress without holding the connection open |
| dom_cdp | DANGEROUS | Managed Chrome launch/status/tabs/navigation/JavaScript/DOM query/click/type/wait/screenshot |
| accessibility | DANGEROUS | Windows UI Automation for app/window discovery, element inspection, focus, values, clicks, selections, and menus |
| input_event | DANGEROUS | Text, paste, keys/hotkeys, pointer movement, clicks, drag, scroll, button state, release-all, and sequences |
| vision | READ | Local display/region/window PNG capture and optional OCR; never clicks or types |
| window | DANGEROUS | Native window list/inspect/activate/close/minimize/maximize/restore/move/resize/frame operations |
| health | READ | Per-backend diagnostics with no input/browser/window side effects |
| system_info | READ | OS/CPU/memory/disks/battery/uptime and top processes (read-only) |
| notification | EXECUTE | Windows toast (BurntToast) or balloon notification |
| file_dialog | EXECUTE | Native open/save dialogs returning chosen paths; does not read or write files itself |
| clipboard | DANGEROUS | Clipboard text read/write and PNG image read as base64 |
| web_fetch | DANGEROUS | Bounded http/https GET/POST/PUT/DELETE/HEAD with text or base64 responses |
| audio | DANGEROUS | Microphone WAV recording (up to 600s), local audio playback, stop |
| screen_record | DANGEROUS | ffmpeg gdigrab screen recording with start/stop/status (requires ffmpeg on PATH) |
| office | DANGEROUS | Excel range read/write/save_as and Word read_text/replace/save_as via COM (requires Office) |
| scheduler | DANGEROUS | Windows scheduled task list/create/run; delete requires userConfirmed after a chat confirmation |

Use dom_cdp for web pages, accessibility for semantic native controls, and
input_event only as a low-level fallback. shell remains direct executable
invocation, not an unrestricted PowerShell or CMD gateway.

### Skills and local MCP bridge

These meta-tools discover local agent skills and other MCP servers on the
machine (Cursor `mcp.json`, Claude Desktop config, plus lnwjud settings). They
do not flatten every child tool into the lnwjud catalog. Default mode enables
all discovered servers except lnwjud itself (recursion guard).

| Tool | Permission | What it does |
| --- | --- | --- |
| skills_list | DANGEROUS | Lists discovered skills from Cursor/Claude/Agents/workspace roots |
| skills_read | DANGEROUS | Reads a skill `SKILL.md` or a relative file inside that skill folder |
| mcp_list | DANGEROUS | Lists discovered local MCP servers and enabled/connected state |
| mcp_describe | DANGEROUS | Connects if needed and returns child tool names/schemas |
| mcp_call | DANGEROUS | Forwards a tool call to a child MCP server |

**Security note:** These tools are available on every transport, including the
Secure MCP Tunnel. Packaged stdio and Secure Tunnel connections intentionally
use the full permission profile, so a remote ChatGPT session can invoke local
desktop/browser MCP servers if lnwjud and the tunnel are running. Desktop MCP
still applies the profile selected in Settings. Disable individual servers
through the lnwjud `extensions` settings JSON (`disabledServers`) when needed.

Settings key `extensions` (SQLite) example:

```json
{
  "mode": "enable_all",
  "disabledServers": [],
  "disabledSkillRoots": [],
  "extraSkillRoots": [],
  "extraMcpServers": {}
}
```

The exact schemas and defaults are maintained in
`packages/mcp-server/src/tools/schemas.ts`.

## Recommended workflows

### Read, change, verify

1. workspace_info: confirm the workspace ID.
2. project_snapshot and git_status: establish the starting state.
3. search_files/search_text/read_file: locate code.
4. apply_patch: make a coherent edit.
5. project_test/project_lint/project_typecheck/project_build.
6. process_status/process_logs for long-running work.
7. git_diff and git_status for the final review.

### Run a development server

Use project_dev for a detected project command. For a manually approved
executable, use process_start with separate arguments and a workspace-relative
cwd. Save the returned process ID and use process_status, process_logs, and
process_stop.

### Delegate to Codex

Run codex_status first. If available, use codex_run, poll the returned task ID,
inspect the logs, and review git_diff yourself. In unrestricted mode Codex can
read the full registered workspace, including `.env`; keep credentials out of
logs, commits, and prompts when they are not needed.

### Automate Windows applications

Use health for diagnostics; dom_cdp for managed web pages; accessibility for
native controls; vision for screen/OCR fallback; input_event only when the
higher-level APIs cannot operate; and window for native window management.

## Unrestricted full-access mode

Unrestricted mode lifts the workspace/command limits while keeping the
deletion blocks. Enable it either way:

- Settings → Unrestricted mode (checkbox; restart the app to apply), or
- `$env:LNWJUD_UNRESTRICTED = '1'` before launching lnwjud (the tunnel script
  below sets this automatically for the stdio runtime).

When enabled:

- Every fixed drive (C:, D:, E:, …) is registered as a machine root, so
  `PATH_OUTSIDE_WORKSPACE` stops appearing and `workspace_register` accepts any drive.
- `cmd.exe`, `powershell.exe`, `pwsh`, `bash`, and `sh` are allowed through
  `process_start` (still spawned with separate arguments, `shell: false`).
- `.cmd`/`.bat` shims (npm.cmd, npx.cmd, …) accept arguments containing `& | < > ^ %`.
- Secret files (.env, *.key, id_rsa, .ssh/**, .aws/**, credentials.json) are
  readable on every drive; binary files read as base64 with no size cap.
- Shell working directories may be anywhere and the full environment is passed
  through to child processes.

Still confirmation-gated in every mode: filesystem `del`/`erase`/`rm`/`rmdir`/`rd`/
`unlink`/`remove-item`, `delete_file`, destructive Git (`rm`, `clean`, `reset`, force/discard forms), HTTP DELETE, mutating Office actions, child MCP/agent mutation boundaries, and opaque UI actions that may cause data loss. These operations require explicit chat confirmation followed by `userConfirmed: true`.

## Real-time Live Logs

The desktop app includes a Live Logs screen (sidebar) with three tabs:

- Tunnel — tails `%APPDATA%\tunnel-client\lnwjud-tunnel.log` continuously
- MCP activity — every tool call received by MCP appears immediately
- Processes — state and recent output of managed processes

Follow/pause, text filter, clear, and export-to-file are available per tab,
and "Pop out viewer" opens a compact separate window. The viewer can also be
launched directly:

```powershell
& "$env:LOCALAPPDATA\Programs\lnwjud\lnwjud.exe" --log-viewer
```

The app is single-instance: launching with `--log-viewer` while the dashboard
is already open focuses/opens the viewer in the running instance.

Live Logs v2 preserves partial lines across tunnel-client chunks, correlates
MCP activity, and keeps the tunnel/process streams visible while the app is
running. It is covered by the desktop log-hub and tunnel lifecycle tests.

## Tunnel state sync between the script and the app

The tunnel can be started from the PowerShell script or from the app's Start
Tunnel button, and both reflect the same state:

- When the script starts the tunnel, the dashboard detects the external
  tunnel-client process (within ~4 seconds) and shows "Tunnel connected
  (from script)" with the Start button disabled.
- Stop Tunnel in the app also stops a script-started tunnel.
- If the tunnel exits, the status returns to stopped automatically.

## Run the tunnel with a resilient script

The repository ships `scripts/start-lnwjud-tunnel.ps1`. Copy it anywhere and
run it instead of a manual `tunnel-client run`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\<WindowsUser>\Downloads\tunnel\start-lnwjud-tunnel.ps1"
```

The script sets `--mcp.connection-max-ttl 168h0m0s` (prevents the 10-minute
disconnect), writes `lnwjud-tunnel.log`, aligns `LNWJUD_DATA_PATH` with the
desktop app so ChatGPT activity shows in the Work Log and Live Logs, enables
unrestricted mode, restarts the tunnel automatically when it drops (including
TTL shutdowns that exit 0), avoids double-starting, and opens the log viewer
window. Rapid failures are bounded with backoff; after five failures in a
30-second window it stops retrying and asks for a manual Start Tunnel. Parameters:
`-NoViewer`, `-OpenDashboard`, `-ForceRestart`, `-Once`.

### Session resilience / แนวทางสำหรับผู้ปฏิบัติการ

Use **Capture Incident** in Control Center or Live Logs when a turn looks
wrong. It writes one bounded, redacted JSON report after you choose a file;
tokens, authorization values, passwords, and secret-like values are removed.
It is still operational evidence, so review the chosen export before sharing
it outside the support case.

The classification is evidence-based, not a remote root-cause guarantee:

- `local_tool_failed` — the latest structured MCP call completed locally with
  a failure. ตรวจสอบ tool result/Work Log first.
- `tunnel_disconnected` — the tunnel reported a lifecycle stop/TTL/stdio stop,
  or its configured health evidence is unhealthy. ตรวจสอบ doctor and the
  tunnel log.
- `remote_turn_stopped` — a user manually captured after a structured local
  success while the tunnel was live. This is an inference that the remote turn
  stopped; it does **not** prove the remote cause.
- `healthy_or_inconclusive` — the collected evidence cannot safely select one
  of the cases above. Collect the report before restarting layers.

Desktop Start Tunnel and `start-lnwjud-tunnel.ps1` share one profile lock. The
losing launcher reports the actual owner PID and does not start or stop another
owner's `tunnel-client`. A stale lock is reclaimed only when the recorded PID
and process start time no longer match; do not manually delete a lock merely to
force a second tunnel.

For a downloaded update, **Later** is the safe default. **Restart Now** queues
installation until active MCP calls finish and the runtime remains quiet briefly;
a short new call resets that quiet interval. Quitting the app cancels the pending
install rather than interrupting work.

Validate the already configured health endpoint without launching another
tunnel. With `listen_addr: 127.0.0.1:0`, use the runtime address written by the
current client rather than copying a fixed port:

```powershell
$profile = Join-Path $env:APPDATA 'tunnel-client'
$tc = if ($env:LNWJUD_TUNNEL_CLIENT_PATH) { $env:LNWJUD_TUNNEL_CLIENT_PATH } else { Join-Path $env:USERPROFILE 'Downloads\tunnel\tunnel-client.exe' }
if (-not (Test-Path -LiteralPath $tc -PathType Leaf)) { throw "Missing tunnel-client executable: $tc" }
if (-not (Test-Path -LiteralPath (Join-Path $profile 'lnwjud.yaml') -PathType Leaf)) { throw "Missing configured profile: $(Join-Path $profile 'lnwjud.yaml')" }
Get-Content (Join-Path $profile 'lnwjud.tunnel.lock') -ErrorAction SilentlyContinue
& $tc doctor --profile lnwjud --profile-dir $profile --explain
if ($LASTEXITCODE -ne 0) { throw 'tunnel-client doctor failed' }
$match = Select-String -LiteralPath (Join-Path $profile 'lnwjud-tunnel.log') -Pattern 'health.*(?:listening|listen_addr).*?(127\.0\.0\.1|localhost):(\d{2,5})' | Select-Object -Last 1
if ($null -eq $match) { throw 'No runtime health address was reported by the configured tunnel' }
$address = [regex]::Match($match.Line, '(127\.0\.0\.1|localhost):(\d{2,5})').Value
Invoke-WebRequest -UseBasicParsing "http://$address/healthz"
```

This validates the live configured endpoint and lock/doctor state; it does not
start, replace, or terminate a tunnel. Repository acceptance coverage can be
run with `corepack pnpm@10.15.0 test:acceptance`.

## Security and operational model

### Transport

The local HTTP MCP endpoint binds to 127.0.0.1. Stdio is a child-process
transport. Secure MCP Tunnel is an outbound HTTPS bridge, not an inbound public
listener.

### Filesystem

Every client path passes the workspace path guard. It resolves relative paths,
rejects NUL bytes/traversal, handles non-existing write targets through their
nearest existing ancestor, rejects junction/symlink/reparse-point escapes, and
applies the secret policy after canonicalization.

### Process execution

The default process API is equivalent to:

```text
spawn(executable, args, { shell: false })
```

Arguments are not concatenated into a shell command. Processes have owned
handles, bounded logs, timeout/cancel support, and Windows process-tree
termination. Normal execution is as the current user; administrator privilege
requests are denied by the capability backend.

### Audit and recovery

Audit records contain timestamp, actor/client, tool/action, workspace ID,
sanitized argument summary, permission decision, result code, and duration.
They do not persist full prompts, environment variables, bearer tokens, API
keys, passwords, or unlimited terminal history. Existing-file writes checkpoint
before overwrite where supported.

### Explicitly unavailable tools

These are intentionally not in the core catalog:

```text
run_shell
git_reset
git_clean
kill_pid
read_arbitrary_path
```

`powershell` and `cmd` are not standalone tools. They are executable names:
`process_start`/`shell` allow them in unrestricted mode (the default) and deny
them otherwise; filesystem deletion-style invocations require confirmation.
Git itself is invoked with the `git` tool or `shell` + `git.exe`, not as
standalone `git_reset` / `git_clean` tools.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| mcp-command preflight shows C:Users... | Use forward slashes in the YAML command path |
| profile_load says the YAML file is missing | Run init with profile lnwjud and verify %APPDATA%/tunnel-client/lnwjud.yaml |
| doctor rejects the key | Use a runtime key with Tunnels Read + Use; do not substitute an Admin or unrelated project key |
| Tunnel is not listed in ChatGPT | Associate it with the target ChatGPT workspace and verify Tunnels Read + Use |
| ChatGPT reports no tools | Check doctor, the local stdio command, tunnel health, connector refresh, and a new chat |
| The desktop window opens when the tunnel starts | A GUI-only executable was configured; install/use the stdio launcher |
| WORKSPACE_NOT_FOUND | Use the exact registered workspace ID, not a path or display name |
| PATH_OUTSIDE_WORKSPACE | Register/select the correct root and use a workspace-relative path |
| A secret file is denied | Check that unrestricted mode was not explicitly disabled (`LNWJUD_UNRESTRICTED=0` or Settings) and that the root is registered |
| process_start refuses PowerShell/CMD | Unrestricted mode is disabled; enable it if you intentionally want cmd/powershell/pwsh access (destructive commands remain gated) |
| Child process windows are visible | This is expected for the current visible-window Windows build; use handles/logs to manage them |
| codex_status is unavailable | Install Codex or continue with process_* and project_*; lnwjud does not inspect credentials |
| Tunnel disconnects with context canceled / context deadline exceeded | MCP connection TTL teardown; start-lnwjud-tunnel.ps1 restarts even on exit 0. After restart, Refresh the connector or send a new ChatGPT message |
| ChatGPT advertises old tools | Restart server/tunnel, Refresh the connector, and start a new conversation |
| Long tool run looks dead / silent | lnwjud emits progress heartbeats every ~15s after the first 15s; ensure tunnel-client is current and TTL is set via `--mcp.connection-max-ttl 168h0m0s` |

For ambiguous failures, call health locally and run tunnel-client doctor
--explain before restarting both layers.

## Public repository and distribution hygiene

This repository is intended to be safe to clone and redistribute, but a local
agent project can easily accumulate machine-specific files if release hygiene is
not enforced.

Current repository rules:

- `.env`, private keys, SSH/AWS credential files, local databases, logs, and
  diagnostic output are ignored by Git.
- Generated MCP stdio bundles under `apps/desktop/build/` are ignored and are
  regenerated from source during build/package. Do not force-add them.
- Logo generation uses repository-relative paths (or explicit CLI arguments),
  not developer-home or editor-upload paths.
- README local documentation links are release-tested so public readers are not
  sent to ignored/private documentation.
- A release regression test rejects known developer-specific paths/private
  project identifiers from tracked text files.
- Secret scanning should cover **Git history**, not only the current working
  tree. Removing a secret from the latest file does not remove it from old
  commits or tags.

Before publishing a fork or release:

```powershell
# Public-tree regression checks
corepack pnpm@10.15.0 exec vitest run tests/release/public-repo-hygiene.test.ts

# Tracked-tree sanity
 git diff --check
 git status --short

# Optional but strongly recommended when gitleaks is installed
 gitleaks git --redact --no-banner
```

If a real credential was ever committed, **rotate/revoke it first**. Then decide
whether the public Git history/tags also need to be rewritten; deleting it from
`main` alone is not a credential-remediation strategy.

Git commit author metadata is public in a public repository. Contributors who do
not want to publish a personal email address should configure a GitHub-provided
`users.noreply.github.com` address before committing.

## Community and contribution

- [Contributing guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Issue tracker](https://github.com/engasnm111/lnwjud/issues)

Please use the security policy instead of public issues for vulnerability details.
## Development and verification

```powershell
corepack pnpm@10.15.0 lint
corepack pnpm@10.15.0 typecheck
corepack pnpm@10.15.0 test
corepack pnpm@10.15.0 test:integration
corepack pnpm@10.15.0 test:packaging
corepack pnpm@10.15.0 build
corepack pnpm@10.15.0 package:windows
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-release.ps1
```

Electron end-to-end tests:

```powershell
corepack pnpm@10.15.0 test:e2e
```

Use git diff --check before committing.

## Repository layout

```text
apps/desktop/          Electron main/preload/renderer and dashboard
apps/cli/              CLI parser and local service entrypoints
packages/application/  Shared use cases and orchestration
packages/domain/       Result/error contracts and policy types
packages/workspace/    Workspace registry, path guard, and secret policy
packages/filesystem/   File adapters
packages/search/       Ripgrep adapter
packages/project/      Project detection and command profiles
packages/git/          Read-only Git adapter
packages/process/      Process lifecycle and bounded logs
packages/codex/        Local Codex discovery and task adapter
packages/permissions/  Permission profiles and command policy
packages/audit/        Sanitized audit events
packages/storage/      SQLite repositories and migrations
packages/mcp-server/   MCP registry plus stdio/HTTP transports
packages/capabilities/ Local shell/browser/UI/vision/window capabilities
packages/extensions/   Local skills catalog and MCP server bridge
packages/ipc-contracts/Typed Electron IPC contracts
assets/logo/           Official brand logos and icons in multiple resolutions
```

All entrypoints are intended to call the same application services so that
validation and permissions remain consistent.

## Further reading

### Official OpenAI documentation

- [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
- [Connect and test a plugin in ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt)
- [ChatGPT MCP and Codex configuration](https://learn.chatgpt.com/docs/extend/mcp)
- [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels)
- [OpenAI Platform API keys](https://platform.openai.com/settings/organization/api-keys)
- [OpenAI tunnel-client releases](https://github.com/openai/tunnel-client)

## License

This project is licensed under the [MIT License](LICENSE).
