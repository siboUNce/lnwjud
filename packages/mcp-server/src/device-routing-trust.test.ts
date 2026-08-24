import { describe, expect, it } from 'vitest';
import { ok } from '@lnwjud/domain';
import { DeviceRouter } from './device-routing.js';
import type { McpApplicationServices } from './tool-registry.js';

describe('remote device registry trust boundary', () => {
  it('discovers device-prefixed servers only from lnwjud settings, not Cursor or Claude config', async () => {
    const extensions = {
      async listSkills() { return ok({ skills: [] }); },
      async readSkill() { return ok({ id: 'none', name: 'none', description: '', source: '', path: '', content: '' }); },
      async listMcpServers() {
        return ok({
          servers: [
            { name: 'device:clinic-server', source: 'lnwjud-settings', enabled: true, connected: false, excluded: false, command: 'ssh' },
            { name: 'device:rogue-cursor', source: 'cursor', enabled: true, connected: false, excluded: false, command: 'node' },
            { name: 'device:rogue-claude', source: 'claude-desktop', enabled: true, connected: false, excluded: false, command: 'node' },
          ],
        });
      },
      async describeMcpServer(input: { server: string }) { return ok({ server: input.server, enabled: true, connected: true, tools: [] }); },
      async callMcpTool() { return ok({ structuredContent: {} }); },
      async close() {},
    } as NonNullable<McpApplicationServices['extensions']>;

    const result = await new DeviceRouter({ extensions }).list();

    expect(result).toMatchObject({
      ok: true,
      value: {
        devices: [
          { deviceId: 'local', local: true },
          { deviceId: 'clinic-server', local: false },
        ],
      },
    });
  });
});
