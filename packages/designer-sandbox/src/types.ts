export type SandboxScope = Record<string, unknown>;

export type SandboxRunMode = 'expression' | 'script';

export interface RunInSandboxOptions {
  mode?: SandboxRunMode;
}
