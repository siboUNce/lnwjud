import { describe, expect, it, vi } from 'vitest';
import { ok } from '@lnwjud/domain';
import { ToolRegistry, type McpApplicationServices } from './tool-registry.js';

function fakeExtensions(callMcpTool: ReturnType<typeof vi.fn>): NonNullable<McpApplicationServices['extensions']> {
  return {
    async listSkills() { return ok({ skills: [] }); },
    async readSkill() { return ok({ id: 'none', name: 'none', description: '', source: '', path: '', content: '' }); },
    async listMcpServers() {
      return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' }] });
    },
    async describeMcpServer(input: { server: string }) { return ok({ server: input.server, enabled: true, connected: true, tools: [] }); },
    callMcpTool,
    async close() {},
  } as NonNullable<McpApplicationServices['extensions']>;
}

describe('remote device session propagation', () => {
  it('uses the parent MCP session as the child-device session key for deviceId routing', async () => {
    const callMcpTool = vi.fn(async () => ok({ structuredContent: { content: 'remote' } }));
    const services: McpApplicationServices = {
      extensions: fakeExtensions(callMcpTool),
      file: {
        async readFile() { return ok({ content: 'local' }); },
        async readFiles() { return ok({ files: [] }); },
        async writeFile() { return ok({}); },
        async applyPatch() { return ok({}); },
        async moveFile() { return ok({}); },
        async copyFile() { return ok({}); },
        async deleteFile() { return ok({}); },
        async restoreDeletedFile() { return ok({}); },
      },
    };

    await new ToolRegistry(services, { clientId: 'client-1', clientName: 'test' }, { sessionId: 'session-a' }).invoke('read_file', {
      deviceId: 'clinic-server',
      workspaceId: 'workspace-1',
      path: 'src\\file.ts',
    });

    expect(callMcpTool).toHaveBeenCalledWith({
      server: 'device:clinic-server',
      tool: 'read_file',
      arguments: { workspaceId: 'workspace-1', path: 'src\\file.ts' },
      sessionKey: 'session-a',
    }, expect.any(AbortSignal));
  });

  it('uses the request-scoped actor session when device child tools are called through mcp_call', async () => {
    const callMcpTool = vi.fn(async () => ok({ structuredContent: { content: 'remote' } }));
    const services: McpApplicationServices = { extensions: fakeExtensions(callMcpTool) };

    await new ToolRegistry(
      services,
      { clientId: 'client-1', clientName: 'test', sessionId: 'session-b' },
      { sessionId: 'session-b' },
    ).invoke('mcp_call', {
      server: 'device:clinic-server',
      tool: 'workspace_tree',
      arguments: { path: 'D:\\Codex' },
      userConfirmed: true,
    });

    expect(callMcpTool).toHaveBeenCalledWith({
      server: 'device:clinic-server',
      tool: 'workspace_tree',
      arguments: { path: 'D:\\Codex' },
      sessionKey: 'session-b',
    }, expect.any(AbortSignal));
  });
});
