// Node: Concept Card Handler
// Node ID: 54256739-0559-4806-a0e6-fdf2f73866fd

// Fix for Concept Card Handler
// Location: "Concept Card Handler" node

const concept = $json.currentConcept;
const sessionId = $json.sessionId;
const learnerNote = $json.learnerInput?.note;

// Get session from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// UPDATE STATE MACHINE
// This handler only runs when first showing the concept card
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'concept_card_shown';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'concept_card_shown',
  action: 'show_concept_card',
  timestamp: new Date().toISOString(),
  conceptId: concept.id,
  conceptTitle: concept.title
});

// Update concept tools tracking
if (!session.currentConceptTools.includes('concept_card')) {
  session.currentConceptTools.push('concept_card');
}
session.lastToolUsed = 'concept_card';

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

const responseData = {
  sessionId,
  toolType: 'concept_card',
  conceptProgress: {
    current: session.completedConcepts.length + 1,
    total: session.remainingCoreConcepts.length + 
           session.completedConcepts.length + 
           session.insertedConcepts.length
  },
  toolData: {
    title: concept.title,
    summary: concept.summary,
    expertTips: concept.expertTips,
    canSubmitNote: true
  },
  waitingForInput: true,
  inputType: 'note',
  message: 'Read through the concept and feel free to add any notes or questions.'
};

// Just return the response
return {
  ...($json),
  responseData,
  sessionId,
  learnerProfile: $json.learnerProfile
};