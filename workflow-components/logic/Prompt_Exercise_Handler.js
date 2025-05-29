// Node: Prompt Exercise Handler
// Node ID: ae9f1a2b-60b1-4f22-909d-1ab51c87010d

// Simple Fix for Prompt Exercise Handler
// This checks session for any previously generated enhanced task

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Check multiple sources for enhanced task data
const enhancedTask = $json.enhancedPromptTask || 
                    session.currentPromptExercise || 
                    null;

// UPDATE STATE MACHINE
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'prompt_exercise_shown';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'prompt_exercise_shown',
  action: 'show_prompt_exercise',
  timestamp: new Date().toISOString(),
  conceptId: concept.id,
  conceptTitle: concept.title
});

// Update session state
if (!session.currentConceptTools.includes('prompt_exercise')) {
  session.currentConceptTools.push('prompt_exercise');
}
session.lastToolUsed = 'prompt_exercise';

// Check if this is the SECOND time showing prompt exercise
// (after enhancement was generated)
const isEnhancedDisplay = session.promptExerciseShowCount > 0;

// Increment show count
session.promptExerciseShowCount = (session.promptExerciseShowCount || 0) + 1;

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Use enhanced task if available, otherwise show basic
const taskToShow = enhancedTask?.task || 
                  (concept.promptTask || 'Generate a prompt for this concept');

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
    task: taskToShow,
    context: enhancedTask?.context || null,
    hints: enhancedTask?.hints || [],
    conceptTitle: concept.title,
    difficulty: enhancedTask?.difficulty || 'intermediate'
  },
  waitingForInput: true,
  inputType: 'prompt',
  message: 'Practice your prompt engineering skills with this task.'
};

// Return the response
return {
  ...($json),
  responseData,
  sessionId,
  learnerProfile: $json.learnerProfile
};