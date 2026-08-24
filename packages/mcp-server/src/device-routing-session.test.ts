import { describe, expect, it, vi } from 'vitest';
import { ok } from '@lnwjud/domain';
import { ToolRegistry, type McpApplicationServices } from './tool-registry.js';

describe('remote device session propagation', () => {
  it('uses the parent MCP session as the child-device session key', async () => {
    const callMcpTool = vi.fn(async () => ok({ structuredContent: { content: 'remote' } }));
    const extensions = {
      async listSkills() { return ok({ skills: [] }); },
      async readSkill() { return ok({ id: 'none', name: 'none', description: '', source: '', path: '', content: '' }); },
      async listMcpServers() {
        return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' }] });
      },
      async describeMcpServer(input: { server: string }) { return ok({ server: input.server, enabled: true, connected: true, tools: [] }); },
      callMcpTool,
      async close() {},
    } as NonNullable<McpApplicationServices['extensions']>;
    const services: McpApplicationServices = {
      extensions,
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
});
