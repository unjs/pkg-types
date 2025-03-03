export interface GitRemote {
  [key: string]: unknown;
  name?: string;
  url?: string;
  fetch?: string;
}

export interface GitBranch {
  [key: string]: unknown;
  remote?: string;
  merge?: string;
  description?: string;
  rebase?: boolean;
}

export interface GitCoreConfig {
  [key: string]: unknown;
}

export interface GitConfigUser {
  [key: string]: unknown;
  name?: string;
  email?: string;
}

export interface GitConfig {
  [key: string]: unknown;
  core?: GitCoreConfig;
  user?: GitConfigUser;
  remote?: Record<string, GitRemote>;
  branch?: Record<string, GitBranch>;
}
