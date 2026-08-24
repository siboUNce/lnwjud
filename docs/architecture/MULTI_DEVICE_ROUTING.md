# Multi-Device Routing

Status: **phase-1 implementation complete on `feature/multi-device-routing`; automated verification pending**

## Goal

Allow one lnwjud MCP surface to address more than one lnwjud installation with an explicit `deviceId`, while preserving the existing session/workspace/security boundaries on the machine that actually executes the tool.

## Identity model

The routing axes are independent:

```text
deviceId    = which machine/runtime executes the call
sessionId   = which MCP session owns handles
workspaceId = which registered workspace is targeted on that machine
```

In phase 1, `deviceId` is a user-configured stable logical ID derived from a child MCP server name `device:<deviceId>`; it is not a generated hardware UUID. The implementation deliberately reuses the existing MCP extension/session transport instead of adding a second transport stack.

## Phase-1 routing contract

- Calls without `deviceId` execute locally exactly as before.
- `deviceId: "local"` executes locally.
- A non-local `deviceId` routes to child MCP server `device:<deviceId>`.
- `deviceId` is validated centrally and stripped before the destination tool receives its arguments.
- The original tool permission gate still applies.
- A cross-device route additionally requires `EXECUTE` permission because establishing/using a child MCP can launch an intermediary process such as `ssh` or `tunnel-client`.
- The gateway applies its existing destructive checks before remote dispatch.
- Remote destructive calls do not use a coincidentally matching local workspace for automatic destructive approval; they fail closed to the normal confirmation path.
- The destination lnwjud performs its normal permission, workspace/path and destructive enforcement again.
- A remote `PATH_OUTSIDE_WORKSPACE` result is preserved rather than converted into a generic transport failure.
- Unknown devices fail closed with `DEVICE_NOT_FOUND`.
- Child-MCP connectivity failures map to recoverable `DEVICE_OFFLINE` where the failure is attributable to the child transport.

## Discovery

Phase 1 intentionally adds **no new public MCP tool names**. This preserves the upstream deterministic tool catalog and reduces merge friction.

Use the existing MCP bridge surface:

- `mcp_list` lists configured child MCP servers, including names matching `device:*`.
- `mcp_describe` establishes/describes a selected `device:<deviceId>` child and reports its available tools.
- `DeviceRouter.list/info/ping` exist as internal routing helpers, not additional public tool names in phase 1.

Because normal tools now advertise the optional top-level `deviceId`, a caller can target a configured device directly without changing the underlying tool's original handler contract.

## Session isolation

A child MCP connection is keyed by both remote server and the parent MCP `sessionId` when one is available:

```text
(parent session A, device:clinic-server) -> child MCP connection A
(parent session B, device:clinic-server) -> child MCP connection B
```

Calls from the same parent session reuse their child connection. Different parent sessions do not share the child connection, preserving the upstream session-owned process/task model on the remote lnwjud instance.

The same session key is also propagated when a caller explicitly uses the existing `mcp_call` bridge against a `device:*` server, so direct child calls do not bypass the session-isolation rule.

## Configuration

Remote devices reuse `ExtensionsSettings.extraMcpServers`. Example:

```json
{
  "extraMcpServers": {
    "device:clinic-server": {
      "command": "ssh",
      "args": [
        "clinic-server",
        "lnwjud-mcp-stdio.cmd",
        "--strict-roots",
        "--allowed-root",
        "D:\\Codex"
      ]
    }
  }
}
```

The device entry should use an intermediary transport such as `ssh` or a tunnel client. The existing `McpConfigLoader` deliberately refuses a child entry whose command directly points back to local `lnwjud`, preventing accidental local recursion. The remote command is transport/bootstrap only; the destination runtime owns its filesystem/process capability boundary. A path outside the destination's configured roots must still fail with `PATH_OUTSIDE_WORKSPACE`.

For SSH transport, host-key and authentication setup must already be non-interactive; otherwise child MCP startup may wait for an SSH prompt and eventually time out.

## Security invariants

1. The router never rewrites a remote filesystem path into a local path.
2. The router never widens the destination's workspace or capability roots.
3. The top-level routing `deviceId` is stripped before forwarding. Explicit nested calls, such as calls intentionally embedded in a remote `tool_batch`, remain subject to the destination runtime's own routing and policy.
4. Remote destructive auto-approval never relies on local workspace scope.
5. Destination permission/path/destructive enforcement remains authoritative and mandatory.
6. Parent-session identity is propagated into the child-session cache key to avoid cross-session handle ownership on the destination.
7. Cross-device routing requires `EXECUTE` permission in addition to the original tool's permission level.
8. Direct local lnwjud self-aggregation remains blocked; a device entry must use an intermediary transport to reach another runtime.

## Upstream compatibility

The fork's `main` remains a fast-forward mirror of `engasnm111/lnwjud:main`. Multi-device work stays on `feature/multi-device-routing` until verification is complete.

When upstream advances:

1. Compare the old upstream head to the new upstream head and identify overlapping files.
2. Fast-forward `siboUNce/lnwjud:main` to the upstream head with no force push.
3. Merge/rebase the updated `main` into `feature/multi-device-routing`.
4. Resolve only genuine overlaps; keep additive multi-device code isolated where possible.
5. Run the authoritative verification gate before merging the feature into `main`.

This workflow was exercised on 2026-08-24 when upstream advanced from `166f004bf73e16d634ab37048346b4d4cd9df349` to `e075470cba825b127da991ead23d09b8a1bdd426`. The fork `main` fast-forwarded and the update merged cleanly into the feature branch.

If upstream later ships a native multi-device implementation, prefer the upstream contract and retire or reduce this fork-specific layer rather than maintaining a competing architecture indefinitely.

## Verification status

Behavioral contract tests were added for routing, permission escalation, remote error preservation, local compatibility, parent-session propagation, per-session child connection isolation and the device transport recursion guard. In the current execution environment the repository could not be cloned from GitHub and the fork's GitHub Actions run did not start, so no test/typecheck/release-gate result is claimed yet. The feature remains a draft PR until an authoritative runner verifies it.
