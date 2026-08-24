import { describe, expect, it } from 'vitest';
import { McpConfigLoader } from './mcp-config-loader.js';
import { DEFAULT_EXTENSIONS_SETTINGS } from './types.js';

describe('remote device MCP configuration', () => {
  it('allows an explicit device server through an intermediary transport but still rejects direct local lnwjud recursion', async () => {
    const loader = new McpConfigLoader({
      settings: {
        ...DEFAULT_EXTENSIONS_SETTINGS,
        extraMcpServers: {
          'device:clinic-server': {
            command: 'ssh',
            args: ['clinic-server', 'lnwjud-mcp-stdio.cmd', '--strict-roots', '--allowed-root', 'D:\\Codex'],
          },
          'device:local-loop': {
            command: 'lnwjud-mcp-stdio.cmd',
            args: ['--strict-roots', '--allowed-root', 'D:\\Codex'],
          },
        },
      },
    });

    const discovered = await loader.discover();
    const remote = discovered.find((server) => server.name === 'device:clinic-server');
    const localLoop = discovered.find((server) => server.name === 'device:local-loop');

    expect(remote).toMatchObject({ enabled: true, excluded: false });
    expect(localLoop).toMatchObject({ enabled: false, excluded: true });
    expect(localLoop?.exclusionReason).toMatch(/Refusing to aggregate lnwjud itself/);
  });
});
