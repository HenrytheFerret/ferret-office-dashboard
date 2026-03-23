
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const { parseTasks } = require('./utils/tasksParser');

const WS_PORT = process.env.WS_PORT || 8080;
const TASKS_FILE_PATH = process.env.TASKS_FILE_PATH || path.resolve(__dirname, '../../TASKS.md');

console.log(`Monitoring TASKS.md at: ${TASKS_FILE_PATH}`);
console.log(`Set TASKS_FILE_PATH env var to use a different location.`);

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
    console.log(`WebSocket server started on port ${WS_PORT}`);
});

let currentAgentStatuses = {};

// Function to send current agent statuses to a new client
function sendCurrentStatuses(ws) {
    if (Object.keys(currentAgentStatuses).length > 0) {
        ws.send(JSON.stringify({
            type: 'INITIAL_STATUS_SNAPSHOT',
            payload: currentAgentStatuses
        }));
    }
}

wss.on('connection', ws => {
    console.log('Client connected');
    sendCurrentStatuses(ws); // Send current statuses to new client
    ws.on('close', () => console.log('Client disconnected'));
    ws.on('error', error => console.error('WebSocket error:', error));
});

function broadcastStatusUpdate(update) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'AGENT_STATUS_UPDATE', payload: update }));
        }
    });
}

async function processTasksFile() {
    console.log(`Processing TASKS.md file: ${TASKS_FILE_PATH}`);
    try {
        const agentStatuses = await parseTasks(TASKS_FILE_PATH);
        if (JSON.stringify(agentStatuses) !== JSON.stringify(currentAgentStatuses)) {
            console.log('Detected changes in agent statuses. Broadcasting update.');
            currentAgentStatuses = agentStatuses;
            broadcastStatusUpdate(currentAgentStatuses);
        } else {
            console.log('No significant changes in agent statuses. No broadcast.');
        }
    } catch (error) {
        console.error('Error processing TASKS.md:', error);
    }
}

// Initial processing of the tasks file
processTasksFile();

// Watch for changes in TASKS.md
chokidar.watch(TASKS_FILE_PATH, { ignored: /(^|[\/\\])\../, persistent: true })
    .on('change', path => {
        console.log(`File ${path} has been changed. Reprocessing.`);
        processTasksFile();
    })
    .on('error', error => console.error(`Watcher error: ${error}`))
    .on('ready', () => console.log('Initial scan complete. Ready for changes.'));

console.log('Backend server setup complete. Waiting for file changes and client connections.');

