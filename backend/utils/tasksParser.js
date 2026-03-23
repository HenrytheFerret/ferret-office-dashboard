
// utils/tasksParser.js
const fs = require('fs').promises;

/**
 * Reliably parses TASKS.md to extract agent assignments and task statuses.
 * @param {string} filePath - Path to the TASKS.md file.
 * @returns {Promise<Object>} - A promise that resolves to an object of agent statuses.
 */
async function parseTasks(filePath) {
    console.log(`Parsing tasks from: ${filePath}`);
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const agentStatuses = {};
        const agentRegex = /## TASK-\d{3}: [^\n]+\n\n\*\*Assigned to: ([^\(]+) \(([^\)]+)\*\*\n\n\*\*Status: ([^\*]+)\*\*/g;

        let match;
        while ((match = agentRegex.exec(content)) !== null) {
            const agentName = match[1].trim(); // e.g., "Milo"
            const agentId = match[2].split(' ')[0].trim().toLowerCase(); // e.g., "milo" from "Backend API/WebSocket"

            let status = match[3].trim().toLowerCase(); // e.g., "in progress"
            // Normalize status values to a controlled vocabulary
            if (status.includes('complete')) {
                status = 'complete';
            } else if (status.includes('in progress')) {
                status = 'working'; // map 'in progress' to 'working' for consistency
            } else if (status.includes('on hold') || status.includes('blocked')) {
                status = 'blocked';
            } else {
                status = 'unknown'; // default or fallback status
            }

            // Extract sub-tasks for detailed status (optional, but good for richer data)
            const subTaskSectionRegex = new RegExp(`### Sub-tasks:\n\n([\s\S]*?)(?=\n## TASK|$)`, 'g');
            const subTaskSectionMatch = subTaskSectionRegex.exec(content.substring(match.index));
            let currentTask = '';
            let completedSubtasks = 0;
            let totalSubtasks = 0;

            if (subTaskSectionMatch && subTaskSectionMatch[1]) {
                const subtasks = subTaskSectionMatch[1].split('\n').filter(line => line.trim().startsWith('1.') || line.trim().startsWith('-'));
                totalSubtasks = subtasks.length;
                for (const subtask of subtasks) {
                    if (subtask.includes('✅')) {
                        completedSubtasks++;
                    } else if (currentTask === '' && !subtask.includes('✅')) {
                        currentTask = subtask.replace(/\d+\.\s*|\-\s*/, '').trim();
                    }
                }
            }


            agentStatuses[agentId] = {
                name: agentName,
                status: status,
                currentTask: currentTask || (status === 'complete' ? 'All tasks complete' : 'Idle'),
                progress: totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) : null,
                details: `Status for ${agentName}: ${status}`
            };
        }
        console.log('Parsed agent statuses:', agentStatuses);
        return agentStatuses;
    } catch (error) {
        console.error('Failed to read or parse TASKS.md:', error);
        return {};
    }
}

module.exports = { parseTasks };
