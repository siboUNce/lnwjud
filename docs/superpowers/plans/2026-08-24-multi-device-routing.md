# Multi-Device Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit `deviceId` routing so one lnwjud MCP surface can execute tools on configured remote lnwjud devices without weakening local or remote workspace/security boundaries.

**Architecture:** Reuse the existing child-MCP extension/session transport. Remote devices are MCP servers named `device:<deviceId>`. Tool schemas expose an optional routing `deviceId`; ToolRegistry strips it before local validation/forwarding, applies the gateway's existing policy gates, and dispatches non-local calls through a small DeviceRouter. Destination lnwjud performs its normal validation and boundary enforcement again.

**Tech Stack:** TypeScript, Zod 4, Vitest, MCP 2.0 client/server, existing `@lnwjud/extensions` child-MCP runtime.

**Spec:** `docs/architecture/MULTI_DEVICE_ROUTING.md`

## Global Constraints

- Preserve calls without `deviceId` exactly as local behavior.
- Keep fork `main` fast-forwardable to upstream; feature code remains on `feature/multi-device-routing`.
- Do not introduce a second remote transport stack; reuse `ExtensionsService` and child MCP sessions.
- Never bypass destination workspace/path/permission/destructive checks.
- Never forward `deviceId` to the destination child MCP call.
- Use TDD: failing behavior test before each production change.

---

### Task 1: Device routing contract

**Files:**
- Create: `packages/mcp-server/src/device-routing.test.ts`
- Create: `packages/mcp-server/src/device-routing.ts`
- Modify: `packages/domain/src/errors.ts`

**Interfaces:**
- Produces: `DeviceRouter` with `list()`, `info(deviceId, signal?)`, `ping(deviceId, signal?)`, `isLocal(deviceId)`, and `call(deviceId, tool, args, signal)`.
- Remote device discovery consumes `McpApplicationServices.extensions` and the `device:<id>` naming convention.

- [ ] **Step 1: Write failing tests** for local discovery, remote discovery, remote call decoding, unknown-device fail-closed behavior, and connectivity failure mapping.
- [ ] **Step 2: Run the focused mcp-server tests and verify RED** because DeviceRouter/device error codes do not exist.
- [ ] **Step 3: Implement the minimal DeviceRouter** using existing `ExtensionsService.listMcpServers`, `describeMcpServer`, and `callMcpTool`.
- [ ] **Step 4: Run the focused tests and verify GREEN**.
- [ ] **Step 5: Commit** `feat(mcp): add multi-device router`.

### Task 2: Make ordinary tool contracts device-routable

**Files:**
- Modify: `packages/mcp-server/src/tools/tool-types.ts`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- Produces: `ToolConfig.routeByDevice?: boolean` defaulting to true.
- `defineTool()` exposes optional `deviceId` on routable object schemas but parses handlers against the original schema after stripping the routing field.

- [ ] **Step 1: Add a failing test** showing `read_file` accepts `{ deviceId, workspaceId, path }` while its parsed handler value contains only `{ workspaceId, path }`.
- [ ] **Step 2: Verify RED** with current strict Zod schemas rejecting `deviceId`.
- [ ] **Step 3: Extend routable object schemas centrally in `defineTool()`** and strip `deviceId` before original-schema validation.
- [ ] **Step 4: Verify GREEN** and run existing schema/tool-registry tests.
- [ ] **Step 5: Commit** `feat(mcp): expose deviceId on tool schemas`.

### Task 3: Add local device tools

**Files:**
- Create: `packages/mcp-server/src/tools/device-tools.ts`
- Modify: `packages/mcp-server/src/tool-registry.ts`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- Produces local-only tools `device_list`, `device_info`, `device_ping`.
- Device tools use `routeByDevice: false` because their `deviceId` selects the subject device rather than the execution target.

- [ ] **Step 1: Add failing tests** asserting the three tool names, READ permissions, local-only parsing, and expected discovery responses.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement `deviceTools(router)` and register them near workspace discovery tools**.
- [ ] **Step 4: Update deterministic tool-order test and verify GREEN**.
- [ ] **Step 5: Commit** `feat(mcp): add device discovery tools`.

### Task 4: Dispatch ordinary calls by deviceId

**Files:**
- Modify: `packages/mcp-server/src/tool-registry.ts`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- Consumes: `DeviceRouter.call(deviceId, toolName, parsedArgs, signal)`.
- Preserves the existing permission/destructive checks before remote execution.

- [ ] **Step 1: Add a failing test** where `read_file` with `deviceId: clinic-server` calls `extensions.callMcpTool({ server: 'device:clinic-server', tool: 'read_file', arguments: { workspaceId, path } })` and never calls local FileService.
- [ ] **Step 2: Add a failing test** that no `deviceId` and `deviceId: local` both stay local.
- [ ] **Step 3: Verify RED**.
- [ ] **Step 4: Route after parse/policy checks and before tool execution**, reusing the existing response-budget/cancellation path.
- [ ] **Step 5: Verify GREEN**, including unknown/offline errors and local regression tests.
- [ ] **Step 6: Commit** `feat(mcp): route tool calls to remote devices`.

### Task 5: Documentation and boundary acceptance

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture/MULTI_DEVICE_ROUTING.md`
- Test: `packages/mcp-server/src/device-routing.test.ts`

**Interfaces:**
- Documents `ExtensionsSettings.extraMcpServers` naming and an SSH bootstrap example.

- [ ] **Step 1: Add/finish tests** that prove routing never forwards `deviceId` and preserves a remote `PATH_OUTSIDE_WORKSPACE` error.
- [ ] **Step 2: Verify GREEN**.
- [ ] **Step 3: Document configuration and upstream maintenance workflow**.
- [ ] **Step 4: Run package tests/typecheck and the repository authoritative verification gate**.
- [ ] **Step 5: Commit** `docs: document multi-device routing`.

## Self-review

- Spec coverage: discovery, routing, local compatibility, fail-closed unknown/offline behavior, destination-boundary preservation, and upstream maintenance are all mapped to tasks.
- Placeholder scan: no TBD/TODO placeholders are used.
- Type consistency: `deviceId` is the routing field throughout; remote server names are `device:<deviceId>`; DeviceRouter is the only remote-dispatch abstraction.
