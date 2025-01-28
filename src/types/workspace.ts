export type WorkspaceType = "npm" | "yarn" | "pnpm" | "lerna";

export interface Workspace {
  /**
   * The root directory of the workspace.
   */
  root: string;

  /**
   * The type of the workspace.
   */
  type: WorkspaceType;

  /**
   * Paths to the workspaces.
   */
  workspaces: string[];
}
