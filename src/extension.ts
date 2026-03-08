import * as vscode from "vscode";
import * as RPC from "discord-rpc";
import * as path from "path";

const CLIENT_ID = "1479825936299065404";

let rpcClient: RPC.Client | null = null;
let sessionStart: number = 0;

let idleTimer: NodeJS.Timeout | null = null;
const IDLE_THRESHOLD = 2 * 60 * 1000;

let updateTimeout: NodeJS.Timeout | null = null;
const UPDATE_DELAY = 500; // milliseconds

const afkMessages = [
  "Wasting precious time",
  "Taking a dump",
  "Eating a large pizza",
  "Gone fishing",
  "Touching grass",
  "Making coffee",
];

const languageIcons: Record<string, string> = {
  typescript: "typescript",
  typescriptreact: "typescript",
  javascript: "javascript",
  javascriptreact: "react",
  python: "python",
  html: "html5",
  css: "css",
  scss: "sass",
  sass: "sass",
  json: "json",
  jsonc: "json",
  markdown: "markdown",
  php: "php",
  c: "c",
  cpp: "cplusplus",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  java: "java",
  lua: "lua",
  vue: "vuejs",
  dart: "flutter",
  "git-commit": "git",
  "git-rebase": "git",
  gitignore: "git",
};

export function activate(context: vscode.ExtensionContext) {
  console.log("VSCord is now active");

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
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Clear previous pending update
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // Schedule new update after delay
      updateTimeout = setTimeout(() => {
        updatePresence(editor);
      }, UPDATE_DELAY);
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState((state) => {
      if (!state.focused) {
        idleTimer = setTimeout(() => {
          const randomAfk =
            afkMessages[Math.floor(Math.random() * afkMessages.length)];
          setActivity(randomAfk, "Away from keyboard", "burrito");
        }, IDLE_THRESHOLD);
      } else {
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

  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
}

function setActivity(details: string, state: string, largeImageKey?: string) {
  if (!rpcClient) {
    return;
  }

  rpcClient.setActivity({
    details,
    state,
    startTimestamp: sessionStart,
    largeImageKey: largeImageKey || "vscode",
    smallImageKey: 'code',
    smallImageText: 'Visual Studio Code',
  });
}

const idleMessages = [
  "Probably reading docs",
  "Configuring shit",
  "Pretending to work",
  "Lost in the sauce",
  "Taking a break",
];

function updatePresence(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    const randomMessage =
      idleMessages[Math.floor(Math.random() * idleMessages.length)];
    setActivity(randomMessage, "No file open", "zany");
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    editor.document.uri,
  );
  const workspaceName = workspaceFolder?.name;
  const fileName = path.basename(editor.document.fileName);
  const state = workspaceName ? workspaceName : "The Void";

  // Get icon for current language
  const languageId = editor.document.languageId;
  const icon = languageIcons[languageId] || "vscode";

  setActivity(`Working on: ${fileName}`, `In: ${state}`, icon);
}
