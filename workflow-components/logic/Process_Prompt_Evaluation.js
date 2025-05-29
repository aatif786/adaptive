// Node: Process Prompt Evaluation
// Node ID: 26b5b049-d975-45a7-b455-4305170199de

// This node processes the AI's evaluation of the user's prompt

const evaluationResult = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Generate Prompt Exercise Evaluation AI Call)
const originalData = $('Generate Evaluate Prompt Excercise Prompt').first().json.originalData;
const sessionId = originalData.sessionId;
const responseData = originalData.responseData;

// Get session from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// UPDATE STATE MACHINE
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'prompt_evaluated';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'prompt_evaluated',
  action: 'evaluation_complete',
  timestamp: new Date().toISOString(),
  score: evaluationResult.score,
  conceptId: session.currentConcept?.id,
  conceptTitle: session.currentConcept?.title
});

// Update knowledge state based on evaluation
if (evaluationResult.knowledgeUpdate) {
  // Add mastered concepts to strengths
  evaluationResult.knowledgeUpdate.masteredConcepts.forEach(concept => {
    if (!session.knowledgeStrengths.includes(concept)) {
      session.knowledgeStrengths.push(concept);
    }
  });
  
  // Update gaps - remove mastered ones, add new ones
  session.knowledgeGaps = session.knowledgeGaps.filter(
    gap => !evaluationResult.knowledgeUpdate.masteredConcepts.includes(gap)
  );
  
  evaluationResult.knowledgeUpdate.identifiedGaps.forEach(gap => {
    if (!session.knowledgeGaps.includes(gap)) {
      session.knowledgeGaps.push(gap);
    }
  });
  
  // Track in knowledge evolution
  if (!session.knowledgeEvolution) {
    session.knowledgeEvolution = [];
  }
  
  session.knowledgeEvolution.push({
    timestamp: new Date().toISOString(),
    tool: 'prompt_exercise',
    concept: session.currentConcept.title,
    conceptId: session.currentConcept.id,
    score: evaluationResult.score,
    mastered: evaluationResult.knowledgeUpdate.masteredConcepts,
    gaps: evaluationResult.knowledgeUpdate.identifiedGaps,
    reasoning: evaluationResult.knowledgeUpdate.reasoning
  });
}

// Clear pending evaluation
session.pendingPromptEvaluation = null;

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Create updated response data with evaluation results
const updatedResponseData = {
  ...responseData,
  toolData: {
    ...responseData.toolData,
    evaluationResult: evaluationResult
  },
  waitingForInput: false,
  nextAction: 'Click Next to continue to the next concept.'
};

// Pass all necessary data forward in the pipeline
return {
  ...originalData,
  evaluationResult,
  responseData: updatedResponseData,
  sessionId,
  learnerProfile: originalData.learnerProfile
};