# Multi-Device Routing

Status: implementation in progress

## Goal

Allow one lnwjud MCP surface to address more than one lnwjud installation with an explicit `deviceId`, while preserving the existing session/workspace/security boundaries on the machine that actually executes the tool.

## Identity model

The routing axes are independent:

```text
deviceId   = which machine/runtime executes the call
sessionId  = which MCP session owns handles
workspaceId = which registered workspace is targeted on that machine
```

A remote device is configured as an existing child MCP server whose name is `device:<deviceId>`. The first implementation deliberately reuses the existing MCP extension/session transport rather than introducing a second transport stack.

## Routing contract

- Calls without `deviceId` execute locally exactly as before.
- `deviceId: "local"` executes locally.
- A non-local `deviceId` routes to child MCP server `device:<deviceId>`.
- The forwarded arguments do not contain `deviceId`, preventing recursive routing at the destination.
- Remote calls are still subject to the gateway's permission/destructive checks before dispatch and to the destination lnwjud's checks after dispatch.
- If the device does not exist, the call fails closed with `DEVICE_NOT_FOUND`.
- If the configured device cannot be reached, the call fails recoverably with `DEVICE_OFFLINE` when the failure is attributable to child-MCP connectivity.

## Discovery tools

Expose three local-only MCP tools:

- `device_list`: list `local` plus configured `device:*` child MCP servers.
- `device_info`: describe one device and, for remote devices, report child MCP tool availability.
- `device_ping`: verify that a remote device can establish/maintain an MCP child session.

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

The remote command is only transport/bootstrap. The destination runtime owns the filesystem/process capability boundary. A path outside its configured roots must still fail with `PATH_OUTSIDE_WORKSPACE`.

## Security invariants

1. The router never rewrites a remote filesystem path into a local path.
2. The router never widens the destination's workspace or capability roots.
3. `deviceId` is stripped before forwarding, so a child call cannot bounce recursively through the same gateway contract.
4. Destructive operations remain fail-closed if the gateway cannot resolve enough local scope to auto-approve them; explicit confirmation can still be required before remote dispatch.
5. Destination permission/path/destructive enforcement remains authoritative and mandatory.

## Upstream compatibility

Keep `main` fast-forwardable to `engasnm111/lnwjud:main`. Multi-device work lives on `feature/multi-device-routing`. Prefer additive files and small integration points. When upstream advances: fast-forward fork `main`, rebase the feature branch, run the authoritative verification gate, and resolve only genuine integration conflicts.
