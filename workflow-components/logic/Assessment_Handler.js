// Node: Assessment Handler
// Node ID: 2a55c1e2-d092-40e6-a2d6-f2c196a4f0a7

// Fix for Assessment Handler
// Location: "Assessment Handler" node

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const learnerAnswer = $json.learnerInput?.answer;
const session = $json.sessionState;

// UPDATE STATE MACHINE
// This handler runs when showing assessment - always transitions to 'assessment_shown'
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'assessment_shown';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'assessment_shown',
  action: 'show_assessment',
  timestamp: new Date().toISOString(),
  conceptId: concept.id,
  conceptTitle: concept.title
});

// Update session state
if (!session.currentConceptTools.includes('assessment')) {
  session.currentConceptTools.push('assessment');
}
session.lastToolUsed = 'assessment';

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

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
    question: concept.assessmentQuestion,
    conceptTitle: concept.title
  },
  waitingForInput: !learnerAnswer,
  inputType: 'answer',
  message: 'Answer the question to check your understanding.'
};

// If we have an answer, we need to grade it
if (learnerAnswer) {
  return {
    ...($json),
    needsGrading: true,
    learnerAnswer,
    responseData
  };
}

return {
  ...($json),
  needsGrading: false,
  responseData
};