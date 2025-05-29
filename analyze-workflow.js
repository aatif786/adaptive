#!/usr/bin/env node

const fs = require('fs');

// Read and parse workflow
const workflow = JSON.parse(fs.readFileSync('workflow.json', 'utf8'));

// Create comprehensive analysis
const analysis = {
    nodes: [],
    codeBlocks: [],
    prompts: [],
    connections: {},
    nodesByType: {}
};

// Analyze each node
workflow.nodes.forEach((node, index) => {
    const nodeInfo = {
        index,
        id: node.id,
        name: node.name,
        type: node.type,
        hasCode: false,
        hasPrompt: false,
        position: node.position
    };
    
    // Group by type
    if (!analysis.nodesByType[node.type]) {
        analysis.nodesByType[node.type] = [];
    }
    analysis.nodesByType[node.type].push(node.name);
    
    // Check for code nodes
    if (node.type === 'n8n-nodes-base.code' && node.parameters?.jsCode) {
        nodeInfo.hasCode = true;
        analysis.codeBlocks.push({
            nodeName: node.name,
            nodeId: node.id,
            codeLength: node.parameters.jsCode.length,
            preview: node.parameters.jsCode.substring(0, 200) + '...'
        });
    }
    
    // Check for any text/prompt content in parameters
    if (node.parameters) {
        const paramStr = JSON.stringify(node.parameters);
        // Look for prompts in various forms
        if (paramStr.includes('prompt') || paramStr.includes('message') || paramStr.includes('text')) {
            // Deep search for prompts
            const searchForPrompts = (obj, path = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.length > 50) {
                        // Likely a prompt if it's a long string
                        if (key.toLowerCase().includes('prompt') || 
                            key.toLowerCase().includes('message') || 
                            key.toLowerCase().includes('text') ||
                            value.includes('{{') || // Template syntax
                            value.includes('learner') || // Domain-specific
                            value.includes('concept')) {
                            analysis.prompts.push({
                                nodeName: node.name,
                                nodeId: node.id,
                                path: `${path}.${key}`,
                                preview: value.substring(0, 100) + '...',
                                fullLength: value.length
                            });
                            nodeInfo.hasPrompt = true;
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        searchForPrompts(value, `${path}.${key}`);
                    }
                }
            };
            searchForPrompts(node.parameters, 'parameters');
        }
    }
    
    analysis.nodes.push(nodeInfo);
});

// Analyze connections
Object.entries(workflow.connections).forEach(([nodeId, connections]) => {
    const sourceName = analysis.nodes.find(n => n.id === nodeId)?.name || nodeId;
    analysis.connections[sourceName] = {};
    
    Object.entries(connections).forEach(([output, targets]) => {
        analysis.connections[sourceName][output] = targets.map(target => {
            const targetNode = analysis.nodes.find(n => n.id === target.node);
            return targetNode?.name || target.node;
        });
    });
});

// Save analysis
fs.writeFileSync('workflow-components/workflow-analysis.json', JSON.stringify(analysis, null, 2));

// Create summary report
const report = `# Workflow Analysis Report

## Summary
- Total Nodes: ${analysis.nodes.length}
- Code Blocks: ${analysis.codeBlocks.length}
- Potential Prompts: ${analysis.prompts.length}

## Node Types
${Object.entries(analysis.nodesByType).map(([type, nodes]) => 
    `- ${type}: ${nodes.length} nodes`
).join('\n')}

## Code Nodes
${analysis.codeBlocks.map(block => 
    `\n### ${block.nodeName}\n- Length: ${block.codeLength} chars\n- Preview: ${block.preview}`
).join('\n')}

## Detected Prompts/Text
${analysis.prompts.slice(0, 10).map(prompt => 
    `\n### ${prompt.nodeName}\n- Path: ${prompt.path}\n- Length: ${prompt.fullLength} chars\n- Preview: ${prompt.preview}`
).join('\n')}
${analysis.prompts.length > 10 ? `\n... and ${analysis.prompts.length - 10} more prompts` : ''}
`;

fs.writeFileSync('workflow-components/analysis-report.md', report);

console.log('Analysis complete. Check workflow-components/analysis-report.md');