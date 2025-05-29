// Node: Complete Concept Handler
// Node ID: abb2e55b-e968-4306-a18e-c641a70002a9

// Fix for Complete Concept Handler
// Location: "Complete Concept" node

const sessionId = $json.sessionId;
const currentConcept = $json.currentConcept || $json.sessionState?.currentConcept;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!currentConcept) {
  console.log('Warning: No current concept to complete');
}

// UPDATE STATE MACHINE - Track concept completion
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'concept_completing';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'concept_completing',
  action: 'complete_concept',
  timestamp: new Date().toISOString(),
  completedConceptId: currentConcept?.id,
  completedConceptTitle: currentConcept?.title,
  wasSkipped: session.skippedConcepts?.some(skip => skip.conceptId === currentConcept?.id),
  finalScore: session.lastAssessmentScore
});

// Mark current concept as completed ONLY if we have one and it's not already completed
if (currentConcept && !session.completedConcepts.includes(currentConcept.id)) {
  session.completedConcepts.push(currentConcept.id);
  
  console.log(`Completed concept ${currentConcept.id}: ${currentConcept.title}`);
  console.log(`Total completed: ${session.completedConcepts.length}`);
  
  // Note: We already removed it from remainingCoreConcepts when we started it
  // So we don't need to remove it again here
}

// Check if this was a skipped concept
const wasSkipped = session.skippedConcepts?.some(
  skip => skip.conceptId === currentConcept?.id
);

// Add metadata to completion
if (!session.completionMetadata) session.completionMetadata = {};
if (currentConcept) {
  session.completionMetadata[currentConcept.id] = {
    completedAt: new Date().toISOString(),
    wasSkipped: wasSkipped,
    toolsUsed: session.currentConceptTools,
    assessmentScore: session.lastAssessmentScore,
    completionType: wasSkipped ? 'skipped' : 
                    session.lastAssessmentScore >= 4 ? 'mastered' :
                    session.lastAssessmentScore >= 3 ? 'adequate' : 'struggled'
  };
}

// Reset for next concept - INCLUDING PROMPT EXERCISE CLEANUP
session.currentConcept = null;
session.currentConceptTools = [];
session.lastToolUsed = null;
session.lastAssessmentScore = null;
session.knowledgeGaps = [];
session.currentPromptExercise = null; // Clear the enhanced prompt exercise
session.currentExerciseFocus = null; // Clear any exercise focus from orchestrator
session.pendingAssessment = null;
session.pendingPromptEvaluation = null;

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Prepare response to move to next concept
const responseData = {
  sessionId,
  toolType: 'transition',
  conceptProgress: {
    current: session.completedConcepts.length,
    total: session.remainingCoreConcepts.length + 
           session.completedConcepts.length + 
           session.insertedConcepts.length
  },
  toolData: {
    completedConcept: currentConcept?.title || 'Unknown',
    message: 'Moving to next concept...'
  },
  waitingForInput: false,
  nextAction: 'auto_continue'
};

// Debug info
console.log(`Remaining concepts: ${session.remainingCoreConcepts.join(', ')}`);
console.log(`State: ${session.stateMachine.currentState}`);

return {
  ...($json),
  responseData,
  moveToNext: true,
  sessionState: session // Pass session state for debugging
};