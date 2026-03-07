import * as vscode from 'vscode';
import * as RPC from 'discord-rpc';

const CLIENT_ID = '1479825936299065404';

let rpcClient: RPC.Client | null = null;

export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('RAYDAR STARTING UP');
    console.log('Raydar is now active');

    rpcClient = new RPC.Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
        console.log('Connected to Discord');
        setActivity('Just opened VSCode', 'Idle');
    });

    rpcClient.on('error', (error) => {
        console.error('Discord RPC Error:', error);
    });

    rpcClient.login({ clientId: CLIENT_ID })
        .then(() => console.log('Login successful'))
        .catch((error) => console.error('Login failed:', error));
}

export function deactivate() {
    if (rpcClient) {
        rpcClient.destroy();
    }
}

function setActivity(details: string, state: string) {
    if (!rpcClient) {return;}

    rpcClient.setActivity({
        details: details,
        state: state,
        startTimestamp: Date.now(),
    });
}