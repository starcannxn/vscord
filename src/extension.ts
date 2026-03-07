import * as vscode from 'vscode';
import * as RPC from 'discord-rpc';

const CLIENT_ID = '1479825936299065404'; // Replace with your actual client ID

let rpcClient: RPC.Client | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('Raydar is now active');

    // Initialize Discord RPC
    rpcClient = new RPC.Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
        console.log('Connected to Discord');
        setActivity('Just opened VSCode', 'Idle');
    });

    rpcClient.login({ clientId: CLIENT_ID }).catch(console.error);
}

export function deactivate() {
    if (rpcClient) {
        rpcClient.destroy();
    }
}

function setActivity(details: string, state: string) {
    if (!rpcClient) return;

    rpcClient.setActivity({
        details: details,
        state: state,
        startTimestamp: Date.now(),
    });
}