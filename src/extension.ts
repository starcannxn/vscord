import * as vscode from "vscode";
import * as RPC from "discord-rpc";
import * as path from "path";

const CLIENT_ID = "1479825936299065404";

let rpcClient: RPC.Client | null = null;
let sessionStart: number = 0;

let idleTimer: NodeJS.Timeout | null = null;
const IDLE_THRESHOLD = 2 * 60 * 1000;

const afkMessages = [
  "Wasting precious time",
  "Taking a dump",
  "Eating a large pizza",
  "Gone fishing",
  "Touching grass",
  "Making coffee",
];

export function activate(context: vscode.ExtensionContext) {
  console.log("Raydar is now active");

  rpcClient = new RPC.Client({ transport: "ipc" });

  rpcClient.on("ready", () => {
    console.log("Connected to Discord");
    sessionStart = Date.now(); // Set timestamp once

    // Clear any stale presence from previous session
    rpcClient?.clearActivity();

    updatePresence(vscode.window.activeTextEditor);
  });

  rpcClient.on("error", (error) => {
    console.error("Discord RPC Error:", error);
  });

  rpcClient.login({ clientId: CLIENT_ID }).catch(console.error);

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updatePresence),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState((state) => {
      if (!state.focused) {
        // Lost focus - start idle timer
        idleTimer = setTimeout(() => {
          const randomAfk =
            afkMessages[Math.floor(Math.random() * afkMessages.length)];
          setActivity(randomAfk, "Away from keyboard");
        }, IDLE_THRESHOLD);
      } else {
        // Gained focus - cancel timer and restore presence
        if (idleTimer) {
          clearTimeout(idleTimer);
          idleTimer = null;
        }
        updatePresence(vscode.window.activeTextEditor);
      }
    }),
  );
}

export function deactivate() {
  if (rpcClient) {
    rpcClient.clearActivity(); // Clear presence first
    rpcClient.destroy(); // Then disconnect
  }

  // Also clear idle timer if running
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
}

function setActivity(details: string, state: string) {
  if (!rpcClient) {
    return;
  }

  rpcClient.setActivity({
    details,
    state,
    startTimestamp: sessionStart,
  });
}

const idleMessages = [
  "Probably reading docs",
  "Configuring shit",
  "Pretending to work",
  "Lost in the settings",
  "Taking a break",
  "Browsing extensions",
];

function updatePresence(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    // Pick random idle message
    const randomMessage =
      idleMessages[Math.floor(Math.random() * idleMessages.length)];
    setActivity(randomMessage, "No file open");
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    editor.document.uri,
  );
  const workspaceName = workspaceFolder?.name;
  const fileName = path.basename(editor.document.fileName);
  const state = workspaceName ? workspaceName : "The Void";

  setActivity(`Working on: ${fileName}`, `In: ${state}`);
}
