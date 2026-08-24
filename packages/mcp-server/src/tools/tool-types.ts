import { err, ok, type Result } from '@lnwjud/domain';
import type { CapabilityService } from '@lnwjud/capabilities';
import type { ExtensionsService } from '@lnwjud/extensions';
import type {
  ApplyPatchRequest,
  CodexService,
  DeleteFileRequest,
  FileActor,
  FileService,
  GitService,
  MoveFileRequest,
  ProcessService,
  ProjectService,
  ReadFileRequest,
  ReadFilesRequest,
  SearchService,
  WorkspaceIndexService,
  WorkspaceQueryService,
  WriteFileRequest,
} from '@lnwjud/application';
import { z } from 'zod';
import type { ContextEconomyRuntime } from '../context-economy.js';

export interface WorkspaceInfoPort {
  info(actor: FileActor, workspaceId: string): Promise<Result<unknown>>;
  list?(actor: FileActor): Promise<Result<unknown>>;
  register?(actor: FileActor, request: {
    readonly parentWorkspaceId: string;
    readonly path: string;
    readonly displayName?: string;
  }): Promise<Result<unknown>>;
}

export interface ProjectSnapshotPort {
  snapshot(actor: FileActor, workspaceId: string): Promise<Result<unknown>>;
}

export interface McpRuntimeTiming {
  readonly mcpPollWaitSeconds: number;
}

export interface McpApplicationServices {
  readonly runtimeStatePath?: string;
  readonly runtimeTiming?: () => McpRuntimeTiming;
  readonly localProviders?: () => { readonly pdfProvider?: string; readonly lspCommands?: Readonly<Record<string, string>> };
  readonly capabilities?: CapabilityService;
  readonly extensions?: ExtensionsService;
  readonly workspaceInfo?: WorkspaceInfoPort;
  readonly workspaceQuery?: Pick<WorkspaceQueryService, 'tree'>;
  readonly projectSnapshot?: ProjectSnapshotPort;
  readonly project?: Pick<ProjectService, 'detect'>;
  readonly file?: Pick<FileService, 'readFile' | 'readFiles' | 'writeFile' | 'applyPatch' | 'moveFile' | 'copyFile' | 'deleteFile' | 'restoreDeletedFile'>;
  readonly search?: Pick<SearchService, 'searchFiles' | 'searchText'>;
  readonly workspaceIndex?: Pick<WorkspaceIndexService, 'indexWorkspace' | 'status' | 'startWatch' | 'stopWatch'>;
  readonly git?: Pick<GitService, 'status' | 'diff' | 'log' | 'run'>;
  readonly process?: Pick<ProcessService, 'start' | 'list' | 'status' | 'logs' | 'stop' | 'startProjectCommand'>;
  readonly codex?: Pick<CodexService, 'status' | 'run' | 'list' | 'taskStatus' | 'taskLogs' | 'stop'>;
}

export interface McpToolAnnotations {
  readonly readOnlyHint: boolean;
  readonly destructiveHint: boolean;
}

export type McpPermissionLevel = 'READ' | 'WRITE' | 'EXECUTE' | 'DANGEROUS';

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly permission: McpPermissionLevel;
  readonly annotations: McpToolAnnotations;
  readonly inputSchema: z.ZodType;
  parse(input: unknown): Result<unknown>;
  execute(input: unknown, signal: AbortSignal): Promise<Result<unknown>>;
}

export interface McpToolContext {
  readonly actor: FileActor;
  readonly services: McpApplicationServices;
  readonly contextEconomy: ContextEconomyRuntime;
}

export interface ToolConfig<T extends z.ZodType> {
  readonly name: string;
  readonly description: string;
  readonly permission: McpPermissionLevel;
  readonly annotations: McpToolAnnotations;
  readonly inputSchema: T;
  /** Set false when deviceId is part of the tool's own local-management contract. */
  readonly routeByDevice?: boolean;
  handler(input: z.infer<T>, signal: AbortSignal): Promise<Result<unknown>>;
}

const routingDeviceIdSchema = z.string().trim().min(1).max(128);

export function defineTool<T extends z.ZodType>(config: ToolConfig<T>): McpToolDefinition {
  const routeByDevice = config.routeByDevice !== false;
  const publicInputSchema = routeByDevice ? withRoutingDeviceId(config.inputSchema) : config.inputSchema;
  return {
    name: config.name,
    description: config.description,
    permission: config.permission,
    annotations: config.annotations,
    inputSchema: publicInputSchema,
    parse(input: unknown): Result<unknown> {
      if (routeByDevice) {
        const routingValidation = validateRoutingDeviceId(input);
        if (!routingValidation.ok) return routingValidation;
      }
      const parsed = config.inputSchema.safeParse(routeByDevice ? withoutRoutingDeviceId(input) : input);
      return parsed.success ? ok(parsed.data) : err({ code: 'INVALID_INPUT', message: 'Tool input is invalid', recoverable: false });
    },
    execute(input: unknown, signal: AbortSignal): Promise<Result<unknown>> {
      return config.handler(input as z.infer<T>, signal);
    },
  };
}

export function missingService<T>(): Result<T> {
  return err({ code: 'INTERNAL_ERROR', message: 'MCP application service is unavailable', recoverable: true });
}

function withRoutingDeviceId<T extends z.ZodType>(schema: T): z.ZodType {
  if (schema instanceof z.ZodObject) return schema.safeExtend({ deviceId: routingDeviceIdSchema.optional() });
  return schema;
}

function validateRoutingDeviceId(input: unknown): Result<undefined> {
  if (!isRecord(input) || !('deviceId' in input) || input.deviceId === undefined) return ok(undefined);
  const parsed = routingDeviceIdSchema.safeParse(input.deviceId);
  return parsed.success
    ? ok(undefined)
    : err({ code: 'INVALID_INPUT', message: 'Tool input is invalid', recoverable: false });
}

function withoutRoutingDeviceId(input: unknown): unknown {
  if (!isRecord(input) || !('deviceId' in input)) return input;
  const { deviceId: _deviceId, ...rest } = input;
  return rest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type { ApplyPatchRequest, DeleteFileRequest, MoveFileRequest, ReadFileRequest, ReadFilesRequest, WriteFileRequest };
