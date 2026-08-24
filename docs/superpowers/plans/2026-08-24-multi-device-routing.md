# Multi-Device Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit `deviceId` routing so one lnwjud MCP surface can execute tools on configured remote lnwjud devices without weakening local or remote workspace/security boundaries.

**Architecture:** Reuse the existing child-MCP extension/session transport. Remote devices are MCP servers named `device:<deviceId>`. Tool schemas expose an optional routing `deviceId`; ToolRegistry strips it before local handler validation/forwarding, applies the gateway's existing policy gates, and dispatches non-local calls through `DeviceRouter`. Destination lnwjud validates and enforces its own boundary again. Child connections are isolated by parent MCP session when a stable session ID is available.

**Tech Stack:** TypeScript, Zod 4, Vitest, MCP 2.0 client/server, existing `@lnwjud/extensions` child-MCP runtime.

**Spec:** `docs/architecture/MULTI_DEVICE_ROUTING.md`

## Execution status

Implementation commits exist on `feature/multi-device-routing` and draft PR #1. Behavioral tests were written before/alongside the production slices, but the current execution environment could not clone the repository and the fork's GitHub Actions did not start. Therefore automated RED/GREEN/typecheck/release verification remains pending and the PR stays draft.

## Global Constraints

- Preserve calls without `deviceId` exactly as local behavior.
- Keep fork `main` fast-forwardable to upstream; feature code remains isolated on `feature/multi-device-routing` until verification.
- Do not introduce a second remote transport stack; reuse `ExtensionsService` and child MCP sessions.
- Do not add new public MCP tool names in phase 1; reuse `mcp_list`/`mcp_describe` for device discovery.
- Never bypass destination workspace/path/permission/destructive checks.
- Never forward the top-level routing `deviceId` to the destination tool.
- Never use local workspace scope to auto-approve a remote destructive operation.
- Preserve parent-session ownership by isolating child MCP connections per parent session.

---

### Task 1: Device routing contract

**Files:**
- Create: `packages/mcp-server/src/device-routing.test.ts`
- Create: `packages/mcp-server/src/device-routing.ts`
- Modify: `packages/domain/src/errors.ts`

**Interfaces:**
- Produces: `DeviceRouter.list()`, `info()`, `ping()`, `isLocal()`, and `call()`.
- Remote device discovery consumes `McpApplicationServices.extensions` and the `device:<id>` naming convention.

- [x] Write contract tests for local/remote discovery, success decoding, remote boundary-error preservation, missing devices and local compatibility.
- [x] Add `DEVICE_NOT_FOUND` and `DEVICE_OFFLINE` application error codes.
- [x] Implement `DeviceRouter` using existing `ExtensionsService.listMcpServers`, `describeMcpServer`, and `callMcpTool`.
- [ ] Run focused tests and verify RED/GREEN on an authoritative runner.

### Task 2: Make ordinary tool contracts device-routable

**Files:**
- Modify: `packages/mcp-server/src/tools/tool-types.ts`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- `defineTool()` advertises optional `deviceId` on routable Zod object schemas.
- Parsing strips `deviceId` before validating the tool's original strict schema and before handler execution.

- [x] Add a contract test showing `read_file` accepts `{ deviceId, workspaceId, path }` but parses to the original handler shape.
- [x] Extend object schemas centrally and validate/strip `deviceId` before original-schema parsing.
- [ ] Run existing schema/tool-registry tests and typecheck.

### Task 3: Reuse existing MCP discovery surface

**Files:**
- No new public tool file is required.
- Document behavior in `docs/architecture/MULTI_DEVICE_ROUTING.md`.

**Interfaces:**
- `mcp_list` discovers child servers named `device:*`.
- `mcp_describe` describes/establishes a selected remote child MCP server.
- `DeviceRouter.list/info/ping` remain internal helpers.

- [x] Preserve the upstream deterministic tool-name catalog by adding no phase-1 `device_*` public tools.
- [x] Document the `device:<deviceId>` naming convention and discovery flow.
- [ ] Verify the unchanged deterministic tool-order test on an authoritative runner.

### Task 4: Dispatch ordinary calls by deviceId

**Files:**
- Modify: `packages/mcp-server/src/tool-registry.ts`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- `DeviceRouter.call(deviceId, toolName, parsedArgs, signal)` performs remote dispatch.
- Existing gateway permission/destructive checks run before dispatch.
- Destination lnwjud performs its own checks again.

- [x] Add a test where remote `read_file` calls `device:clinic-server` and does not invoke local FileService.
- [x] Add a test that no `deviceId` and `deviceId: local` remain local.
- [x] Route remote execution through the existing response-budget/cancellation path.
- [x] Preserve structured remote `PATH_OUTSIDE_WORKSPACE` errors.
- [x] Fail remote destructive auto-approval closed when only local workspace scope is available.
- [ ] Run focused and regression tests on an authoritative runner.

### Task 5: Preserve remote session ownership

**Files:**
- Modify: `packages/extensions/src/types.ts`
- Modify: `packages/extensions/src/extensions-service.ts`
- Modify: `packages/extensions/src/mcp-session-manager.ts`
- Create: `packages/extensions/src/mcp-session-manager-device-session.test.ts`
- Create: `packages/mcp-server/src/device-routing-session.test.ts`

**Interfaces:**
- `ExtensionsService.callMcpTool` accepts optional `sessionKey`.
- `McpSessionManager.call(..., parentSessionKey?)` caches by `(server, parentSessionKey)` rather than server alone.
- ToolRegistry passes its parent MCP `sessionId` to DeviceRouter/ExtensionsService.

- [x] Add tests specifying same-session reuse and cross-session child connection isolation.
- [x] Add parent-session propagation test from ToolRegistry to `ExtensionsService.callMcpTool`.
- [x] Implement per-parent-session child MCP cache keys while preserving existing callers that omit the key.
- [ ] Run extensions + MCP ownership/session regression tests.

### Task 6: Upstream integration and documentation

**Files:**
- Modify: `docs/architecture/MULTI_DEVICE_ROUTING.md`
- Maintain: fork `main` and `feature/multi-device-routing` branch relationship.

- [x] Fast-forward fork `main` from upstream without force.
- [x] Exercise a real upstream update during development: upstream advanced from `166f004bf73e16d634ab37048346b4d4cd9df349` to `e075470cba825b127da991ead23d09b8a1bdd426`.
- [x] Compare changed files and confirm no overlap with multi-device implementation files.
- [x] Merge updated `main` into the feature branch through PR #2 without rewriting feature history.
- [x] Document the maintenance workflow and native-upstream migration rule.
- [ ] Run the repository authoritative verification gate.
- [ ] Only after verification, mark PR #1 ready and merge it into `main`.

## Verification gate

Before PR #1 can leave draft state, run at minimum:

```powershell
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --frozen-lockfile
pnpm --filter @lnwjud/extensions test
pnpm --filter @lnwjud/mcp-server test
pnpm --filter @lnwjud/extensions typecheck
pnpm --filter @lnwjud/mcp-server typecheck
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/verify-release.ps1
```

No merge-to-main success claim is permitted until this gate is executed successfully.
