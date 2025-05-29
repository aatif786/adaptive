// Node: Process Grading
// Node ID: 2a7f4f29-fd10-48f2-b75d-4567c928cfe0

// Process Combined Grading and Knowledge Analysis
const result = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Grade Assessment AI Call)
const sessionId = $('Generate Assessment Grading Prompt').first().json.originalData.sessionId;
const originalData = $('Generate Assessment Grading Prompt').first().json.originalData;

// Get session directly from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Update assessment score
session.lastAssessmentScore = result.score;

// Update knowledge state from the combined analysis
if (result.knowledgeUpdate) {
  session.knowledgeStrengths = result.knowledgeUpdate.updatedStrengths || [];
  session.knowledgeGaps = result.knowledgeUpdate.updatedGaps || [];
  
  // Track knowledge evolution
  if (!session.knowledgeEvolution) {
    session.knowledgeEvolution = [];
  }
  
  session.knowledgeEvolution.push({
    timestamp: new Date().toISOString(),
    concept: session.currentConcept.title,
    conceptId: session.currentConcept.id,
    isDynamic: session.currentConcept.isDynamic || false,
    score: result.score,
    strengths: result.knowledgeUpdate.updatedStrengths,
    gaps: result.knowledgeUpdate.updatedGaps,
    reasoning: result.knowledgeUpdate.reasoning
  });
}

// UPDATE STATE MACHINE
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'assessment_graded';
session.stateMachine.stateHistory.push({
  from: 'assessment_submitted',
  to: 'assessment_graded',
  action: 'grading_complete',
  timestamp: new Date().toISOString(),
  orchestrator: 'core',
  data: { score: result.score }
});

// Handle dynamic concept gap resolution
if (session.currentConcept.isDynamic && result.score >= 3 && session.currentConcept.targetedGaps) {
  session.knowledgeGaps = session.knowledgeGaps.filter(
    gap => !session.currentConcept.targetedGaps.includes(gap)
  );
}

// Track assessment history
if (!session.assessmentHistory) {
  session.assessmentHistory = [];
}

session.assessmentHistory.push({
  concept: session.currentConcept.title,
  conceptId: session.currentConcept.id,
  score: result.score,
  timestamp: new Date().toISOString()
});

// Save updated state back to global
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Build the response data structure
const responseData = {
  sessionId,
  toolType: 'assessment',
  conceptProgress: {
    current: session.completedConcepts.length + 1,
    total: session.remainingCoreConcepts.length + 
           session.completedConcepts.length + 
           session.insertedConcepts.length
  },
  toolData: {
    question: session.currentConcept?.assessmentQuestion,
    conceptTitle: session.currentConcept?.title,
    gradingResult: {
      score: result.score,
      feedback: result.feedback,
      understood: result.understood
    }
  },
  waitingForInput: false,
  nextAction: result.score >= 4 ? 
    'Excellent work! Click Next to continue.' : 
    result.score >= 3 ?
    'Good understanding! Click Next to continue.' :
    'Let\'s reinforce this concept. Click Next to continue.'
};

// Pass all necessary data forward in the pipeline
return {
  ...originalData, // Spread the original data
  gradingResult: result,
  responseData,
  sessionId,
  learnerProfile: originalData.learnerProfile
};