# Workflow Analysis Report

## Summary
- Total Nodes: 39
- Code Blocks: 23
- Potential Prompts: 22

## Node Types
- n8n-nodes-base.webhook: 2 nodes
- n8n-nodes-base.code: 23 nodes
- n8n-nodes-base.merge: 1 nodes
- n8n-nodes-base.respondToWebhook: 2 nodes
- n8n-nodes-base.manualTrigger: 1 nodes
- n8n-nodes-base.set: 1 nodes
- n8n-nodes-base.httpRequest: 6 nodes
- n8n-nodes-base.switch: 3 nodes

## Code Nodes

### Session State Manager
- Length: 1707 chars
- Preview: // CLEAN Session State Manager - ONLY manages state storage
// No business logic, no routing, no decisions

const sessionId = $json.sessionId || 'default-session';
const action = $json.action || 'star...

### Course Completion
- Length: 1449 chars
- Preview: // Course Completion Handler
const sessionId = $json.sessionId;
const session = $json.sessionState;

// Calculate final statistics
const totalConcepts = session.completedConcepts.length;
const coreCon...

### Concept Card Handler
- Length: 1697 chars
- Preview: // Fix for Concept Card Handler
// Location: "Concept Card Handler" node

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const learnerNote = $json.learnerInput?.note;

// Get...

### Assessment Handler
- Length: 1690 chars
- Preview: // Fix for Assessment Handler
// Location: "Assessment Handler" node

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const learnerAnswer = $json.learnerInput?.answer;
const s...

### Process Grading
- Length: 3343 chars
- Preview: // Process Combined Grading and Knowledge Analysis
const result = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Grade Assessment AI Call)
const sessionId = $('Gene...

### Prompt Exercise Handler
- Length: 2294 chars
- Preview: // Simple Fix for Prompt Exercise Handler
// This checks session for any previously generated enhanced task

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const session = $g...

### Reset Session
- Length: 359 chars
- Preview: // Reset Session
const sessionId = $json.query?.sessionId || 'default-session';

// Clear session data
const sessionState = $getWorkflowStaticData('global');
if (sessionState.sessions && sessionState....

### Init Course Data
- Length: 6013 chars
- Preview: // Extract webhook data from the first item in the array
const webhookData = $input.first().json.body;

// Add course data
return {
  sessionId: webhookData.sessionId,
  userName: webhookData.userName...

### Limit Data
- Length: 2659 chars
- Preview: // Node: Limit Data
// Node ID: ddb6f37f-de10-4755-bcb2-322171d87022

// Extract Response Data
const responseData = $json.responseData;

if (!responseData) {
  throw new Error('No responseData found i...

### Generate New Concept Prompt
- Length: 1695 chars
- Preview: // Generate Concept Prompt - Prepares prompt for creating new adaptive concepts
const messages = [
  {
    role: "system",
    content: "Generate a new mini-concept to address a specific learning gap....

### Core Orchestrator
- Length: 10737 chars
- Preview: // Enhanced Core Orchestrator - Handles deterministic flow logic
// This replaces the existing Core Orchestrator node code

const sessionId = $json.sessionId;
const action = $json.action;
const learne...

### Process Adaptive Orchestrator Decision
- Length: 12690 chars
- Preview: // Process Adaptive Orchestrator Decision - UPDATED FOR NEW FORMAT
const orchestratorDecision = JSON.parse($json.choices[0].message.content);

const sessionId = $('Generate Adaptive Orchestrator Route...

### Smart Reply Generator Prompt
- Length: 8102 chars
- Preview: // Smart Reply Generator for 6 Input Handlers
const toolType = $json.responseData?.toolType;
const toolData = $json.responseData?.toolData;
const sessionId = $json.sessionId;

// Get session for conte...

### Process Smart Replies
- Length: 606 chars
- Preview: // Process Smart Replies - Add generated replies to response
const smartReplies = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Smart Reply Generator AI Call)
cons...

### Generate Prompt Exercise Prompt
- Length: 2523 chars
- Preview: // Generate Prompt Exercise - Creates targeted prompt exercises
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
  throw new Er...

### Process Prompt Evaluation
- Length: 2812 chars
- Preview: // This node processes the AI's evaluation of the user's prompt

const evaluationResult = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Generate Prompt Exercise Ev...

### Generate Assessment Grading Prompt
- Length: 2764 chars
- Preview: // Generate Assessment Grading Prompt - FIXED to properly get learner answer
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
 ...

### Process Generated Prompt Exercise
- Length: 1486 chars
- Preview: // Process Generated Prompt Exercise - FIXED
const exerciseData = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline
const sessionId = $('Generate Prompt Exercise Prompt').fi...

### Generate Adaptive Orchestrator Router Prompt
- Length: 7498 chars
- Preview: // Simplified Generate Adaptive Orchestrator Router Prompt
// This focuses on learner notes and pedagogical overrides

// Get session from the input JSON
const sessionId = $json.sessionId;
const sessi...

### Generate Evaluate Prompt Excercise Prompt
- Length: 2924 chars
- Preview: // This node prepares the prompt for evaluating user's prompt exercise submission

// Prepare Prompt Evaluation Request
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('globa...

### Welcome Message Handler
- Length: 1059 chars
- Preview: // Fix for Welcome Message Handler
// Location: "Welcome Message" node

const sessionId = $json.sessionId;
const courseTopic = $json.courseTopic;

// Get session from global
const session = $getWorkfl...

### Complete Concept Handler
- Length: 3440 chars
- Preview: // Fix for Complete Concept Handler
// Location: "Complete Concept" node

const sessionId = $json.sessionId;
const currentConcept = $json.currentConcept || $json.sessionState?.currentConcept;
const se...

### Insert Concept Handler
- Length: 2918 chars
- Preview: // Fix for Insert Concept Handler
// Location: "Insert Concept" node

const newConcept = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Generate New Concept AI Call...

## Detected Prompts/Text

### Course Completion
- Path: parameters.jsCode
- Length: 1449 chars
- Preview: // Course Completion Handler
const sessionId = $json.sessionId;
const session = $json.sessionState;
...

### Concept Card Handler
- Path: parameters.jsCode
- Length: 1697 chars
- Preview: // Fix for Concept Card Handler
// Location: "Concept Card Handler" node

const concept = $json.curr...

### Assessment Handler
- Path: parameters.jsCode
- Length: 1690 chars
- Preview: // Fix for Assessment Handler
// Location: "Assessment Handler" node

const concept = $json.currentC...

### Process Grading
- Path: parameters.jsCode
- Length: 3343 chars
- Preview: // Process Combined Grading and Knowledge Analysis
const result = JSON.parse($json.choices[0].messag...

### Prompt Exercise Handler
- Path: parameters.jsCode
- Length: 2294 chars
- Preview: // Simple Fix for Prompt Exercise Handler
// This checks session for any previously generated enhanc...

### Init Course Data
- Path: parameters.jsCode
- Length: 6013 chars
- Preview: // Extract webhook data from the first item in the array
const webhookData = $input.first().json.bod...

### Limit Data
- Path: parameters.jsCode
- Length: 2659 chars
- Preview: // Node: Limit Data
// Node ID: ddb6f37f-de10-4755-bcb2-322171d87022

// Extract Response Data
const...

### Generate New Concept Prompt
- Path: parameters.jsCode
- Length: 1695 chars
- Preview: // Generate Concept Prompt - Prepares prompt for creating new adaptive concepts
const messages = [
 ...

### Core Orchestrator
- Path: parameters.jsCode
- Length: 10737 chars
- Preview: // Enhanced Core Orchestrator - Handles deterministic flow logic
// This replaces the existing Core ...

### Process Adaptive Orchestrator Decision
- Path: parameters.jsCode
- Length: 12690 chars
- Preview: // Process Adaptive Orchestrator Decision - UPDATED FOR NEW FORMAT
const orchestratorDecision = JSON...

... and 12 more prompts
