#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the workflow file
const workflow = JSON.parse(fs.readFileSync('workflow.json', 'utf8'));

// Create output directories
const dirs = ['workflow-components/prompts', 'workflow-components/logic', 'workflow-components/nodes'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Extract components
let nodeIndex = {};
let prompts = {};
let jsCode = {};

workflow.nodes.forEach((node, index) => {
    // Create node index
    nodeIndex[node.id] = {
        name: node.name,
        type: node.type,
        position: node.position,
        index: index
    };
    
    // Extract prompts from OpenAI nodes
    if (node.type === 'n8n-nodes-base.openAi' || node.type === '@n8n/n8n-nodes-langchain.openAi') {
        if (node.parameters?.messages?.values) {
            node.parameters.messages.values.forEach((msg, msgIndex) => {
                if (msg.content) {
                    const promptKey = `${node.name.replace(/\s+/g, '_')}_${msgIndex}`;
                    prompts[promptKey] = {
                        nodeName: node.name,
                        nodeId: node.id,
                        messageIndex: msgIndex,
                        content: msg.content
                    };
                }
            });
        }
        // Check for text in prompt property
        if (node.parameters?.prompt) {
            const promptKey = `${node.name.replace(/\s+/g, '_')}_prompt`;
            prompts[promptKey] = {
                nodeName: node.name,
                nodeId: node.id,
                content: node.parameters.prompt
            };
        }
    }
    
    // Extract JavaScript code
    if (node.type === 'n8n-nodes-base.code') {
        const codeKey = node.name.replace(/\s+/g, '_');
        jsCode[codeKey] = {
            nodeName: node.name,
            nodeId: node.id,
            code: node.parameters.jsCode || node.parameters.pythonCode || ''
        };
    }
});

// Save node index
fs.writeFileSync('workflow-components/nodes/node-index.json', JSON.stringify(nodeIndex, null, 2));

// Save prompts
Object.entries(prompts).forEach(([key, data]) => {
    const filename = `workflow-components/prompts/${key}.txt`;
    const content = `Node: ${data.nodeName}\nNode ID: ${data.nodeId}\n${data.messageIndex !== undefined ? `Message Index: ${data.messageIndex}\n` : ''}\n---\n${data.content}`;
    fs.writeFileSync(filename, content);
});

// Save JS code
Object.entries(jsCode).forEach(([key, data]) => {
    const filename = `workflow-components/logic/${key}.js`;
    const content = `// Node: ${data.nodeName}\n// Node ID: ${data.nodeId}\n\n${data.code}`;
    fs.writeFileSync(filename, content);
});

// Create workflow summary
const summary = {
    totalNodes: workflow.nodes.length,
    nodeTypes: {},
    connections: workflow.connections,
    promptCount: Object.keys(prompts).length,
    codeNodeCount: Object.keys(jsCode).length
};

// Count node types
workflow.nodes.forEach(node => {
    summary.nodeTypes[node.type] = (summary.nodeTypes[node.type] || 0) + 1;
});

fs.writeFileSync('workflow-components/workflow-summary.json', JSON.stringify(summary, null, 2));

console.log(`Extracted:
- ${Object.keys(prompts).length} prompts
- ${Object.keys(jsCode).length} code blocks
- ${workflow.nodes.length} total nodes
- Node index created`);