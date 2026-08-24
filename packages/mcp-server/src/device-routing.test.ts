import { describe, expect, it, vi } from 'vitest';
import { ok } from '@lnwjud/domain';
import { DeviceRouter } from './device-routing.js';
import { ToolRegistry, type McpApplicationServices } from './tool-registry.js';

const actor = { clientId: 'client-1', clientName: 'device-routing-test' };

type Extensions = NonNullable<McpApplicationServices['extensions']>;

function fakeExtensions(overrides: Partial<Extensions> = {}): Extensions {
  return {
    async listSkills() { return ok({ skills: [] }); },
    async readSkill() { return ok({ id: 'none', name: 'none', description: '', source: '', path: '', content: '' }); },
    async listMcpServers() { return ok({ servers: [] }); },
    async describeMcpServer(input) { return ok({ server: input.server, enabled: true, connected: true, tools: [] }); },
    async callMcpTool() { return ok({ structuredContent: { ok: true } }); },
    async close() {},
    ...overrides,
  } as Extensions;
}

describe('multi-device routing', () => {
  it('discovers local and device-prefixed child MCP servers only', async () => {
    const router = new DeviceRouter({
      extensions: fakeExtensions({
        async listMcpServers() {
          return ok({
            servers: [
              { name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' },
              { name: 'unrelated-mcp', source: 'settings', enabled: true, connected: false, excluded: false, command: 'node' },
            ],
          });
        },
      }),
    });

    const result = await router.list();

    expect(result).toMatchObject({
      ok: true,
      value: {
        devices: [
          { deviceId: 'local', local: true, enabled: true, connected: true },
          { deviceId: 'clinic-server', local: false, enabled: true, connected: false },
        ],
      },
    });
  });

  it('decodes a remote MCP success response back into a normal domain result', async () => {
    const callMcpTool = vi.fn(async () => ok({
      content: [{ type: 'text', text: 'remote ok' }],
      structuredContent: { entries: [{ path: 'src' }] },
    }));
    const router = new DeviceRouter({
      extensions: fakeExtensions({
        async listMcpServers() {
          return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' }] });
        },
        callMcpTool,
      }),
    });

    const result = await router.call('clinic-server', 'workspace_tree', { path: 'D:\\Codex' });

    expect(result).toEqual(ok({ entries: [{ path: 'src' }] }));
    expect(callMcpTool).toHaveBeenCalledWith({
      server: 'device:clinic-server',
      tool: 'workspace_tree',
      arguments: { path: 'D:\\Codex' },
    }, expect.any(AbortSignal));
  });

  it('preserves a remote workspace-boundary error instead of masking it', async () => {
    const router = new DeviceRouter({
      extensions: fakeExtensions({
        async listMcpServers() {
          return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: true, excluded: false, command: 'ssh' }] });
        },
        async callMcpTool() {
          return ok({
            isError: true,
            structuredContent: {
              error: {
                code: 'PATH_OUTSIDE_WORKSPACE',
                message: 'Path is not inside a registered workspace',
                recoverable: false,
              },
            },
          });
        },
      }),
    });

    const result = await router.call('clinic-server', 'workspace_tree', { path: 'C:\\Windows' });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'PATH_OUTSIDE_WORKSPACE', message: 'Path is not inside a registered workspace' },
    });
  });

  it('fails closed when a requested device is not configured', async () => {
    const router = new DeviceRouter({ extensions: fakeExtensions() });

    const result = await router.call('missing-device', 'workspace_tree', { path: 'D:\\Codex' });

    expect(result).toMatchObject({ ok: false, error: { code: 'DEVICE_NOT_FOUND', recoverable: false } });
  });

  it('accepts deviceId on an ordinary strict tool schema but strips it from the parsed handler input', () => {
    const registry = new ToolRegistry({}, actor);
    const readFile = registry.list().find((tool) => tool.name === 'read_file');

    expect(readFile?.parse({ deviceId: 'clinic-server', workspaceId: 'workspace-1', path: 'src\\file.ts' })).toEqual(ok({
      workspaceId: 'workspace-1',
      path: 'src\\file.ts',
    }));
  });

  it('routes an ordinary call to device:<id> and never executes the local service', async () => {
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
      extensions: fakeExtensions({
        async listMcpServers() {
          return ok({ servers: [{ name: 'device:clinic-server', source: 'settings', enabled: true, connected: false, excluded: false, command: 'ssh' }] });
        },
        callMcpTool,
      }),
    };

    const response = await new ToolRegistry(services, actor).invoke('read_file', {
      deviceId: 'clinic-server',
      workspaceId: 'workspace-1',
      path: 'src\\file.ts',
    });

    expect(response.isError).not.toBe(true);
    expect(response.structuredContent).toEqual({ content: 'remote' });
    expect(localRead).not.toHaveBeenCalled();
    expect(callMcpTool).toHaveBeenCalledWith({
      server: 'device:clinic-server',
      tool: 'read_file',
      arguments: { workspaceId: 'workspace-1', path: 'src\\file.ts' },
    }, expect.any(AbortSignal));
  });

  it('keeps no-device and deviceId=local calls on the local runtime', async () => {
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
      extensions: fakeExtensions({ callMcpTool }),
    };
    const registry = new ToolRegistry(services, actor);

    const first = await registry.invoke('read_file', { workspaceId: 'workspace-1', path: 'a.ts' });
    const second = await registry.invoke('read_file', { deviceId: 'local', workspaceId: 'workspace-1', path: 'b.ts' });

    expect(first.structuredContent).toMatchObject({ content: 'local' });
    expect(second.structuredContent).toMatchObject({ content: 'local' });
    expect(localRead).toHaveBeenCalledTimes(2);
    expect(callMcpTool).not.toHaveBeenCalled();
  });
});
