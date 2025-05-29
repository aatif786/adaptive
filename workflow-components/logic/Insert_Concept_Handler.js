// Node: Insert Concept Handler
// Node ID: 878f49b5-1fd1-4f9c-b23f-21b9b335b670

// Fix for Insert Concept Handler
// Location: "Insert Concept" node

const newConcept = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Generate New Concept AI Call)
const sessionId = $('Generate New Concept Prompt').first().json.originalData.sessionId;
const originalData = $('Generate New Concept Prompt').first().json.originalData;

const orchestratorDecision = originalData.orchestratorDecision;

// Add metadata to new concept
newConcept.id = `dynamic_${Date.now()}`;
newConcept.isCore = false;
newConcept.isDynamic = true;

// Get session from global directly
const session = $getWorkflowStaticData('global').sessions[sessionId];

// UPDATE STATE MACHINE - Track dynamic concept insertion
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'dynamic_concept_inserted';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'dynamic_concept_inserted',
  action: 'insert_dynamic_concept',
  timestamp: new Date().toISOString(),
  dynamicConceptId: newConcept.id,
  dynamicConceptTitle: newConcept.title,
  targetedGap: orchestratorDecision.conceptNeeded.reason || session.knowledgeGaps[0],
  previousConceptId: session.currentConcept?.id,
  previousConceptTitle: session.currentConcept?.title
});

// Set targeted gaps from orchestrator decision
const targetGap = orchestratorDecision.conceptNeeded.reason || session.knowledgeGaps[0];
newConcept.targetedGaps = [targetGap];
newConcept.targetedGap = targetGap; // Keep both for compatibility

// Increment the attempt counter for this gap
if (targetGap) {
  if (!session.gapAttempts) session.gapAttempts = {};
  session.gapAttempts[targetGap] = (session.gapAttempts[targetGap] || 0) + 1;
  newConcept.attemptNumber = session.gapAttempts[targetGap];
}

// IMPORTANT: Mark the struggling concept as completed so we don't return to it
if (session.currentConcept && session.currentConcept.isCore) {
  // Add the original concept to completed list
  session.completedConcepts.push(session.currentConcept.id);
  
  // Remove it from remaining core concepts
  session.remainingCoreConcepts = session.remainingCoreConcepts.filter(
    id => id !== session.currentConcept.id
  );
}

// Set the new concept as current
session.currentConcept = newConcept;
session.currentConceptTools = []; // Fresh start for the new concept
session.lastToolUsed = null;

// Track the inserted dynamic concept
session.insertedConcepts.push(newConcept.id);

// Clear previous assessment data since this is a new concept
session.lastAssessmentScore = null;
session.knowledgeGaps = []; // Clear the gaps

// Save updated state back to global
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Return with the updated current concept
return {
  ...originalData,
  currentConcept: newConcept,
  nextAction: 'concept_card',
  newConceptInserted: true
};