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
  isDirect: true, // Flag to indicate this was not generated
  promptCriteria: concept.promptCriteria || [] // Include criteria if available
};

// Initialize prompt refinement state if criteria exist
if (concept.promptCriteria && concept.promptCriteria.length > 0) {
  // Check if we're continuing refinement or starting fresh
  if (!session.promptRefinementState.isRefining) {
    // Starting fresh - initialize criteria status
    session.promptRefinementState = {
      currentCriteriaIndex: 0,
      criteriaStatus: concept.promptCriteria.map(c => ({
        name: c.name,
        description: c.description,
        evaluationHint: c.evaluationHint,
        met: false,
        attempts: 0,
        feedback: "",
        example: ""
      })),
      promptHistory: [],
      currentPrompt: "",
      feedbackHistory: [],
      isRefining: true
    };
  }
}

// Save session
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Check if we're in refinement mode
const refinementState = session.promptRefinementState;
const isRefining = refinementState.isRefining && refinementState.criteriaStatus.length > 0;

// Get current criteria if refining
let currentCriteria = null;
let refinementMessage = 'Practice your prompt engineering skills with this task.';
if (isRefining) {
  currentCriteria = refinementState.criteriaStatus[refinementState.currentCriteriaIndex];
  const unmetCount = refinementState.criteriaStatus.filter(c => !c.met).length;
  refinementMessage = `Focus on: **${currentCriteria.name}** (${unmetCount} criteria remaining)`;
}

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
    conceptTitle: concept.title,
    // Add refinement data if in refinement mode
    isRefining: isRefining,
    currentCriteria: currentCriteria,
    previousPrompt: refinementState.currentPrompt || "",
    previousFeedback: currentCriteria?.feedback || "",
    criteriaProgress: isRefining ? {
      total: refinementState.criteriaStatus.length,
      met: refinementState.criteriaStatus.filter(c => c.met).length
    } : null
  },
  waitingForInput: true,
  inputType: 'prompt',
  message: refinementMessage
};

// Pass the response forward with all original data
return {
  ...$json,
  responseData,
  // Add flag for Smart Reply Generator to know this is from direct prompt
  sourceNode: 'direct_prompt_exercise'
};