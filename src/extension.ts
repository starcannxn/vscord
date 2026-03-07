import * as vscode from "vscode";
import * as RPC from "discord-rpc";
import * as path from "path";

const CLIENT_ID = "1479825936299065404";

let rpcClient: RPC.Client | null = null;
let sessionStart: number = 0;

export function activate(context: vscode.ExtensionContext) {
  console.log("Raydar is now active");

  rpcClient = new RPC.Client({ transport: "ipc" });

  rpcClient.on("ready", () => {
    console.log("Connected to Discord");
	sessionStart = Date.now(); // Set timestamp once
    updatePresence(vscode.window.activeTextEditor);
  });

  rpcClient.on("error", (error) => {
    console.error("Discord RPC Error:", error);
  });

  rpcClient.login({ clientId: CLIENT_ID }).catch(console.error);

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updatePresence)
  );
}

export function deactivate() {
  if (rpcClient) {
    rpcClient.destroy();
  }
}

function setActivity(details: string, state: string) {
  if (!rpcClient) return;

  rpcClient.setActivity({
    details,
    state,
    startTimestamp: sessionStart,
  });
}

function updatePresence(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    setActivity("Coding this bitch", "No file open");
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  const workspaceName = workspaceFolder?.name;

  const fileName = path.basename(editor.document.fileName);

  const state = workspaceName 
    ? workspaceName
    : "The Void";

  setActivity(`Working on: ${fileName}`, `In: ${state}`);
}