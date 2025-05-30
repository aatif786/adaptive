// Node: Direct Prompt Exercise Handler
// Node ID: [new-node-id]

// This node handles prompts that are already defined in the concept (no generation needed)
// It formats the response to match Process Generated Prompt Exercise output

const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];
const concept = session.currentConcept;

if (!concept) {
  throw new Error('No current concept found');
}

// Use the prompt data directly from the concept
const promptData = concept.prompt;

if (!promptData || !promptData.task) {
  throw new Error('No prompt data found in concept');
}

// Store the prompt exercise in session for evaluation later
session.currentPromptExercise = {
  task: promptData.task,
  context: promptData.context || null,
  hints: [], // Direct prompts don't have hints by default
  conceptTitle: concept.title,
  conceptId: concept.id,
  isDirect: true // Flag to indicate this was not generated
};

// Save session
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Build response that matches Process Generated Prompt Exercise
const responseData = {
  sessionId,
  toolType: 'prompt_exercise',
  conceptProgress: {
    current: session.completedConcepts.length + 1,
    total: session.remainingCoreConcepts.length + 
           session.completedConcepts.length + 
           session.insertedConcepts.length
  },
  toolData: {
    task: promptData.task,
    context: promptData.context || null,
    hints: [], // No hints for direct prompts
    conceptTitle: concept.title
  },
  waitingForInput: true,
  inputType: 'prompt',
  message: 'Practice your prompt engineering skills with this task.'
};

// Pass the response forward with all original data
return {
  ...$json,
  responseData,
  // Add flag for Smart Reply Generator to know this is from direct prompt
  sourceNode: 'direct_prompt_exercise'
};