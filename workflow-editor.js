#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Command-line interface for workflow editing
const command = process.argv[2];
const args = process.argv.slice(3);

const workflow = JSON.parse(fs.readFileSync('workflow.json', 'utf8'));

// Helper functions
function findNodeByName(name) {
    return workflow.nodes.find(node => node.name === name);
}

function findNodeById(id) {
    return workflow.nodes.find(node => node.id === id);
}

function saveWorkflow(backup = true) {
    if (backup) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        fs.copyFileSync('workflow.json', `workflow-backup-${timestamp}.json`);
    }
    fs.writeFileSync('workflow.json', JSON.stringify(workflow, null, 2));
}

// Commands
const commands = {
    list: () => {
        console.log('\nWorkflow Nodes:');
        workflow.nodes.forEach((node, i) => {
            console.log(`${i}: ${node.name} (${node.type})`);
        });
    },
    
    show: (nodeName) => {
        const node = findNodeByName(nodeName);
        if (!node) {
            console.error(`Node "${nodeName}" not found`);
            return;
        }
        console.log(JSON.stringify(node, null, 2));
    },
    
    extract: (nodeName, outputFile) => {
        const node = findNodeByName(nodeName);
        if (!node) {
            console.error(`Node "${nodeName}" not found`);
            return;
        }
        
        if (node.type === 'n8n-nodes-base.code' && node.parameters?.jsCode) {
            fs.writeFileSync(outputFile || `${nodeName.replace(/\s+/g, '_')}.js`, node.parameters.jsCode);
            console.log(`Extracted code to ${outputFile || nodeName.replace(/\s+/g, '_') + '.js'}`);
        } else {
            console.error('Node does not contain JavaScript code');
        }
    },
    
    update: (nodeName, codeFile) => {
        const node = findNodeByName(nodeName);
        if (!node) {
            console.error(`Node "${nodeName}" not found`);
            return;
        }
        
        if (!fs.existsSync(codeFile)) {
            console.error(`File "${codeFile}" not found`);
            return;
        }
        
        const newCode = fs.readFileSync(codeFile, 'utf8');
        node.parameters.jsCode = newCode;
        saveWorkflow();
        console.log(`Updated "${nodeName}" with code from ${codeFile}`);
    },
    
    search: (searchTerm) => {
        console.log(`\nSearching for "${searchTerm}":\n`);
        workflow.nodes.forEach(node => {
            const nodeStr = JSON.stringify(node);
            if (nodeStr.toLowerCase().includes(searchTerm.toLowerCase())) {
                console.log(`Found in: ${node.name} (${node.type})`);
                // Show context
                if (node.parameters?.jsCode && node.parameters.jsCode.includes(searchTerm)) {
                    const lines = node.parameters.jsCode.split('\n');
                    lines.forEach((line, i) => {
                        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                            console.log(`  Line ${i + 1}: ${line.trim()}`);
                        }
                    });
                }
            }
        });
    },
    
    connections: (nodeName) => {
        const node = nodeName ? findNodeByName(nodeName) : null;
        
        if (nodeName && !node) {
            console.error(`Node "${nodeName}" not found`);
            return;
        }
        
        console.log('\nConnections:');
        Object.entries(workflow.connections).forEach(([sourceId, outputs]) => {
            const sourceNode = findNodeById(sourceId);
            if (!nodeName || sourceNode?.name === nodeName || node?.id === sourceId) {
                Object.entries(outputs).forEach(([outputType, targets]) => {
                    targets.forEach(target => {
                        const targetNode = findNodeById(target.node);
                        console.log(`${sourceNode?.name || sourceId} --[${outputType}]--> ${targetNode?.name || target.node}`);
                    });
                });
            }
        });
    },
    
    help: () => {
        console.log(`
n8n Workflow Editor

Commands:
  node workflow-editor.js list                          - List all nodes
  node workflow-editor.js show <node-name>              - Show node details
  node workflow-editor.js extract <node-name> [file]    - Extract code from node
  node workflow-editor.js update <node-name> <file>     - Update node code from file
  node workflow-editor.js search <term>                 - Search for term in workflow
  node workflow-editor.js connections [node-name]       - Show connections
  node workflow-editor.js help                          - Show this help
        `);
    }
};

// Execute command
if (!command || !commands[command]) {
    commands.help();
} else {
    commands[command](...args);
}