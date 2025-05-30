// Node: Process Generated Prompt Exercise
// Node ID: 3c50e1c8-db67-4701-a15a-0442e5ccfe22

// Process Generated Prompt Exercise - FIXED
const exerciseData = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline
const sessionId = $('Generate Prompt Exercise Prompt').first().json.originalData.sessionId;
const originalData = $('Generate Prompt Exercise Prompt').first().json.originalData;

// Get session from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Store the enhanced task in session
session.currentPromptExercise = exerciseData;

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

// HERE'S THE KEY: Build the response with the ACTUAL enhanced task data
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
    task: exerciseData.task,  // Use the actual generated task
    context: exerciseData.context,
    hints: exerciseData.hints,
    conceptTitle: session.currentConcept?.title
  },
  waitingForInput: true,
  inputType: 'prompt',
  message: 'Practice your prompt engineering skills with this task.'
};

// Pass the enhanced response forward
return {
  ...originalData,
  responseData,  // This contains the enhanced task
  sessionId,
  learnerProfile: originalData.learnerProfile
};