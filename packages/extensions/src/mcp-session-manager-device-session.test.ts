import { describe, expect, it, vi } from 'vitest';
import { McpSessionManager, type McpClientFactory, type McpClientSession } from './mcp-session-manager.js';

function session(label: string): McpClientSession {
  return {
    async listTools(): Promise<readonly []> { return []; },
    async callTool(): Promise<{ structuredContent: { label: string } }> { return { structuredContent: { label } }; },
    async close(): Promise<void> {},
  };
}

describe('McpSessionManager device session isolation', () => {
  it('reuses a child MCP connection within one parent session but isolates different parent sessions', async () => {
    let sequence = 0;
    const connect = vi.fn(async () => session(`child-${++sequence}`));
    const factory: McpClientFactory = { connect };
    const manager = new McpSessionManager({ clientFactory: factory, idleTimeoutMs: 60_000 });
    const config = { command: 'ssh', args: ['clinic-server', 'lnwjud-mcp-stdio.cmd'] };

    const first = await manager.call('device:clinic-server', config, 'workspace_tree', {}, undefined, 'session-a');
    const second = await manager.call('device:clinic-server', config, 'workspace_tree', {}, undefined, 'session-a');
    const third = await manager.call('device:clinic-server', config, 'workspace_tree', {}, undefined, 'session-b');

    expect(first).toMatchObject({ ok: true, value: { structuredContent: { label: 'child-1' } } });
    expect(second).toMatchObject({ ok: true, value: { structuredContent: { label: 'child-1' } } });
    expect(third).toMatchObject({ ok: true, value: { structuredContent: { label: 'child-2' } } });
    expect(connect).toHaveBeenCalledTimes(2);

    await manager.close();
  });
});
