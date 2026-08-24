import { appError, err, ok, type AppErrorCode, type Result } from '@lnwjud/domain';
import type { ExtensionsService, McpServerListItem, McpToolSummary } from '@lnwjud/extensions';

const DEVICE_SERVER_PREFIX = 'device:';
const LOCAL_DEVICE_ID = 'local';

export interface DeviceSummary {
  readonly deviceId: string;
  readonly local: boolean;
  readonly enabled: boolean;
  readonly connected: boolean;
  readonly source: string;
  readonly command?: string;
}

export interface DeviceInfo {
  readonly device: DeviceSummary;
  readonly tools: readonly McpToolSummary[];
}

export interface DeviceRouterOptions {
  readonly extensions?: ExtensionsService;
  readonly localDeviceId?: string;
}

export class DeviceRouter {
  private readonly extensions: ExtensionsService | undefined;
  private readonly localDeviceId: string;

  public constructor(options: DeviceRouterOptions = {}) {
    this.extensions = options.extensions;
    this.localDeviceId = normalizeDeviceId(options.localDeviceId) ?? LOCAL_DEVICE_ID;
  }

  public isLocal(deviceId: string | undefined): boolean {
    const normalized = normalizeDeviceId(deviceId);
    return normalized === undefined || normalized === LOCAL_DEVICE_ID || normalized === this.localDeviceId;
  }

  public async list(): Promise<Result<{ readonly devices: readonly DeviceSummary[] }>> {
    const local = this.localSummary();
    if (this.extensions === undefined) return ok({ devices: [local] });

    const listed = await this.extensions.listMcpServers();
    if (!listed.ok) return listed;
    const remote = listed.value.servers
      .filter(isDeviceServer)
      .map(toDeviceSummary)
      .filter((device) => device.deviceId !== this.localDeviceId && device.deviceId !== LOCAL_DEVICE_ID)
      .sort((left, right) => left.deviceId.localeCompare(right.deviceId));
    return ok({ devices: [local, ...remote] });
  }

  public async info(deviceId: string, signal?: AbortSignal): Promise<Result<DeviceInfo>> {
    const normalized = normalizeDeviceId(deviceId);
    if (normalized === undefined) return err(appError('INVALID_INPUT', 'deviceId is required'));
    if (this.isLocal(normalized)) return ok({ device: this.localSummary(), tools: [] });

    const remote = await this.findRemote(normalized);
    if (!remote.ok) return remote;
    if (this.extensions === undefined) return deviceNotFound(normalized);

    const described = await this.extensions.describeMcpServer({ server: remote.value.name }, signal ?? new AbortController().signal);
    if (!described.ok) return mapTransportFailure(normalized, described);
    return ok({
      device: {
        ...toDeviceSummary(remote.value),
        connected: described.value.connected,
      },
      tools: described.value.tools,
    });
  }

  public async ping(deviceId: string, signal?: AbortSignal): Promise<Result<{
    readonly deviceId: string;
    readonly reachable: boolean;
    readonly local: boolean;
  }>> {
    const normalized = normalizeDeviceId(deviceId);
    if (normalized === undefined) return err(appError('INVALID_INPUT', 'deviceId is required'));
    if (this.isLocal(normalized)) return ok({ deviceId: this.localDeviceId, reachable: true, local: true });

    const info = await this.info(normalized, signal);
    if (!info.ok) return info;
    return ok({ deviceId: normalized, reachable: true, local: false });
  }

  public async call(
    deviceId: string,
    tool: string,
    args: Readonly<Record<string, unknown>>,
    signal?: AbortSignal,
  ): Promise<Result<unknown>> {
    const normalized = normalizeDeviceId(deviceId);
    if (normalized === undefined) return err(appError('INVALID_INPUT', 'deviceId is required'));
    if (this.isLocal(normalized)) return err(appError('INVALID_INPUT', 'Local device calls must execute through the local ToolRegistry'));

    const remote = await this.findRemote(normalized);
    if (!remote.ok) return remote;
    if (this.extensions === undefined) return deviceNotFound(normalized);

    const called = await this.extensions.callMcpTool({
      server: remote.value.name,
      tool,
      arguments: { ...args },
    }, signal ?? new AbortController().signal);
    if (!called.ok) return mapTransportFailure(normalized, called);
    return decodeRemoteToolResult(called.value);
  }

  private localSummary(): DeviceSummary {
    return {
      deviceId: this.localDeviceId,
      local: true,
      enabled: true,
      connected: true,
      source: 'local',
    };
  }

  private async findRemote(deviceId: string): Promise<Result<McpServerListItem>> {
    if (this.extensions === undefined) return deviceNotFound(deviceId);
    const listed = await this.extensions.listMcpServers();
    if (!listed.ok) return listed;
    const expected = DEVICE_SERVER_PREFIX + deviceId;
    const server = listed.value.servers.find((entry) => entry.name === expected);
    return server === undefined ? deviceNotFound(deviceId) : ok(server);
  }
}

function isDeviceServer(server: McpServerListItem): boolean {
  return server.name.startsWith(DEVICE_SERVER_PREFIX) && server.name.length > DEVICE_SERVER_PREFIX.length;
}

function toDeviceSummary(server: McpServerListItem): DeviceSummary {
  return {
    deviceId: server.name.slice(DEVICE_SERVER_PREFIX.length),
    local: false,
    enabled: server.enabled && !server.excluded,
    connected: server.connected,
    source: server.source,
    command: server.command,
  };
}

function normalizeDeviceId(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function deviceNotFound<T = never>(deviceId: string): Result<T> {
  return err(appError('DEVICE_NOT_FOUND', `Device is not configured: ${deviceId}`));
}

function mapTransportFailure<T>(deviceId: string, failure: { readonly ok: false; readonly error: { readonly code: AppErrorCode; readonly message: string; readonly recoverable: boolean } }): Result<T> {
  if (failure.error.code !== 'INTERNAL_ERROR') return failure as Result<T>;
  return err(appError('DEVICE_OFFLINE', `Device is unavailable: ${deviceId}`, true));
}

function decodeRemoteToolResult(value: unknown): Result<unknown> {
  if (!isRecord(value)) return ok(value);
  if (value.isError === true) {
    const remoteError = readRemoteError(value.structuredContent);
    if (remoteError !== undefined) return err(remoteError);
    return err(appError('INTERNAL_ERROR', 'Remote device returned an MCP error', true));
  }
  if ('structuredContent' in value && value.structuredContent !== undefined) return ok(value.structuredContent);
  return ok(value);
}

function readRemoteError(structuredContent: unknown): ReturnType<typeof appError> | undefined {
  if (!isRecord(structuredContent) || !isRecord(structuredContent.error)) return undefined;
  const code = structuredContent.error.code;
  const message = structuredContent.error.message;
  const recoverable = structuredContent.error.recoverable;
  if (!isAppErrorCode(code) || typeof message !== 'string') return undefined;
  return appError(code, message, recoverable === true);
}

function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === 'string' && APP_ERROR_CODES.has(value as AppErrorCode);
}

const APP_ERROR_CODES = new Set<AppErrorCode>([
  'INVALID_INPUT',
  'WORKSPACE_NOT_FOUND',
  'PATH_OUTSIDE_WORKSPACE',
  'SECRET_ACCESS_DENIED',
  'PERMISSION_DENIED',
  'PERMISSION_REQUIRED',
  'FILE_NOT_FOUND',
  'FILE_TOO_LARGE',
  'BINARY_FILE',
  'PROCESS_NOT_FOUND',
  'PROCESS_TIMEOUT',
  'EXECUTABLE_NOT_FOUND',
  'GIT_NOT_REPOSITORY',
  'CODEX_NOT_AVAILABLE',
  'DEVICE_NOT_FOUND',
  'DEVICE_OFFLINE',
  'INTERNAL_ERROR',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
