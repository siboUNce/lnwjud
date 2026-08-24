import { describe, expect, it, vi } from 'vitest';
import { ok } from '@lnwjud/domain';
import { permissionProfiles } from '@lnwjud/permissions';
import { ToolRegistry, type McpApplicationServices } from './tool-registry.js';

describe('remote device permission gate', () => {
  it('requires EXECUTE permission before a READ tool may launch/use a remote device child MCP', async () => {
    const localRead = vi.fn(async () => ok({ content: 'local' }));
    const callMcpTool = vi.fn(async () => ok({ structuredContent: { content: 'remote' } }));
    const services: McpApplicationServices = {
      file: {
        readFile: localRead,
        async readFiles() { return ok({ files: [] }); },
        async writeFile() { return ok({}); },
        async applyPatch() { return ok({}); },
        async moveFile() { return ok({}); },
        async copyFile() { return ok({}); },
        async deleteFile() { return ok({}); },
        async restoreDeletedFile() { return ok({}); },
      },
      extensions: {
        async listSkills() { return ok({ skills: [] }); },
        async readSkill() { return ok({ id: 'none', name: 'none', description: '', source: '', path: '', content: '' }); },
        async listMcpServers() {
          return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' }] });
        },
        async describeMcpServer(input): ReturnType<NonNullable<McpApplicationServices['extensions']>['describeMcpServer']> { return ok({ server: input.server, enabled: true, connected: true, tools: [] }); },
        callMcpTool,
        async close(): Promise<void> {},
      },
    };

    const response = await new ToolRegistry(services, { clientId: 'client-1', clientName: 'test' }, {
      profileProvider: (): typeof permissionProfiles.safe => permissionProfiles.safe,
    }).invoke('read_file', {
      deviceId: 'clinic-server',
      workspaceId: 'workspace-1',
      path: 'src\\file.ts',
    });

    expect(response.isError).toBe(true);
    expect(response.structuredContent).toMatchObject({
      error: { code: 'PERMISSION_REQUIRED' },
    });
    expect(localRead).not.toHaveBeenCalled();
    expect(callMcpTool).not.toHaveBeenCalled();
  });
});
