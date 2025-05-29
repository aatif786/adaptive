// Node: Process Adaptive Orchestrator Decision
// Node ID: 2420d12f-4baf-487b-946f-1ee34c25f512

// Process Adaptive Orchestrator Decision - ENHANCED WITH CONCEPT LOADING
const orchestratorDecision = JSON.parse($json.choices[0].message.content);

const sessionId = $('Generate Adaptive Orchestrator Router Prompt').first().json.originalData.sessionId;
const originalData = $('Generate Adaptive Orchestrator Router Prompt').first().json.originalData;

// Get session directly from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Initialize tracking if needed
if (!session.gapAttempts) session.gapAttempts = {};
if (!session.deferredGaps) session.deferredGaps = [];
if (!session.skippedConcepts) session.skippedConcepts = [];

// CRITICAL: Load next concept if we don't have one and need to show concept_card
if (!session.currentConcept && orchestratorDecision.nextAction === 'concept_card') {
  console.log('Adaptive Orchestrator: No current concept, loading next...');
  
  if (session.remainingCoreConcepts.length > 0) {
    const nextId = session.remainingCoreConcepts[0];
    const nextConcept = originalData.coreConcepts.find(c => c.id === nextId);
    
    if (nextConcept) {
      // Remove from remaining
      session.remainingCoreConcepts = session.remainingCoreConcepts.filter(id => id !== nextId);
      
      // Mark it as core concept
      nextConcept.isCore = true;
      
      // Set as current
      session.currentConcept = nextConcept;
      session.currentConceptTools = [];
      session.lastAssessmentScore = null;
      session.knowledgeGaps = [];
      session.promptExerciseShowCount = 0; // Reset prompt exercise counter
      
      console.log(`Loaded concept ${nextConcept.id}: ${nextConcept.title}`);
      
      // Update state machine
      session.stateMachine.previousState = session.stateMachine.currentState;
      session.stateMachine.currentState = 'concept_started';
      session.stateMachine.stateHistory.push({
        from: session.stateMachine.previousState,
        to: 'concept_started',
        action: 'load_next_concept',
        timestamp: new Date().toISOString(),
        conceptId: nextConcept.id,
        conceptTitle: nextConcept.title
      });
    } else {
      console.error(`Could not find concept with id ${nextId}`);
      // Override to show completion if no valid concept found
      orchestratorDecision.nextAction = 'concept_complete';
    }
  } else {
    console.log('No remaining concepts - course should be complete');
    // Override to show completion
    orchestratorDecision.nextAction = 'concept_complete';
  }
}

// PROMPT EXERCISE SAFETY CHECK
if (orchestratorDecision.nextAction === 'prompt_exercise') {
  const shouldHavePromptTask = !!session.currentConcept?.shouldHavePromptTask;
  
  if (!shouldHavePromptTask) {
    // Override the decision - no prompt task defined for this concept
    console.log(`Overriding prompt_exercise decision - no shouldHavePromptTask defined for: ${session.currentConcept?.title}`);
    
    // Determine better fallback based on what tools have been used
    if (!session.currentConceptTools.includes('assessment')) {
      // Haven't done assessment yet - go there
      orchestratorDecision.nextAction = 'assessment';
      orchestratorDecision.reasoning = `No prompt task defined. Proceeding to assessment.`;
    } else if (session.lastAssessmentScore && session.lastAssessmentScore < 3) {
      // Assessment done but score was low - consider remediation
      orchestratorDecision.nextAction = 'insert_concept';
      orchestratorDecision.reasoning = `No prompt task defined. Low assessment score suggests remediation needed.`;
      orchestratorDecision.conceptNeeded = {
        reason: "Reinforce understanding based on low assessment score",
        focus: session.knowledgeGaps[0] || "Core concept understanding"
      };
    } else {
      // Assessment done with decent score - safe to complete
      orchestratorDecision.nextAction = 'concept_complete';
      orchestratorDecision.reasoning = `No prompt task defined. Assessment completed successfully.`;
    }
  }
}

// HANDLE SKIP GRADING SIGNAL
if (orchestratorDecision.skipGrading && session.pendingAssessment) {
 
  // UPDATE STATE MACHINE - Track skipped assessment
  session.stateMachine.previousState = session.stateMachine.currentState;
  session.stateMachine.currentState = 'assessment_skipped';
  session.stateMachine.stateHistory.push({
    from: session.stateMachine.previousState,
    to: 'assessment_skipped',
    action: 'skip_assessment_grading',
    timestamp: new Date().toISOString(),
    skipReason: orchestratorDecision.skipReason || 'Based on learner note',
    conceptId: session.currentConcept?.id
  });
  
  // Track that assessment was skipped
  if (!session.assessmentHistory) session.assessmentHistory = [];
  session.assessmentHistory.push({
    concept: session.currentConcept?.title,
    conceptId: session.currentConcept?.id,
    answer: session.pendingAssessment.answer,
    note: session.pendingAssessment.note,
    score: null,
    skipped: true,
    skipReason: orchestratorDecision.skipReason || 'Based on learner note',
    timestamp: new Date().toISOString()
  });
  
  // Clear pending assessment
  session.pendingAssessment = null;
}

// HANDLE SKIP EVALUATION SIGNAL (for prompt exercises)
if (orchestratorDecision.skipEvaluation && session.pendingPromptEvaluation) {
  // UPDATE STATE MACHINE - Track skipped prompt evaluation
  session.stateMachine.previousState = session.stateMachine.currentState;
  session.stateMachine.currentState = 'prompt_evaluation_skipped';
  session.stateMachine.stateHistory.push({
    from: session.stateMachine.previousState,
    to: 'prompt_evaluation_skipped',
    action: 'skip_prompt_evaluation',
    timestamp: new Date().toISOString(),
    skipReason: orchestratorDecision.skipReason || 'Based on learner note',
    conceptId: session.currentConcept?.id
  });
  
  // Clear pending evaluation state
  if (!session.promptHistory) session.promptHistory = [];
  session.promptHistory.push({
    concept: session.currentConcept?.title,
    conceptId: session.currentConcept?.id,
    prompt: session.pendingPromptEvaluation.prompt,
    note: session.pendingPromptEvaluation.note,
    task: session.pendingPromptEvaluation.task,
    score: null,
    skipped: true,
    skipReason: orchestratorDecision.skipReason || 'Based on learner note',
    timestamp: new Date().toISOString()
  });
  
  // Clear pending evaluation
  session.pendingPromptEvaluation = null;
  
  // Also clear the current prompt exercise since we're skipping
  session.currentPromptExercise = null;
}

// HANDLE MARK AS COMPLETE SIGNAL (for skipping concepts)
if (orchestratorDecision.markAsComplete && orchestratorDecision.completionType === 'skipped') {
  // UPDATE STATE MACHINE - Track concept skip
  session.stateMachine.previousState = session.stateMachine.currentState;
  session.stateMachine.currentState = 'concept_skipped';
  session.stateMachine.stateHistory.push({
    from: session.stateMachine.previousState,
    to: 'concept_skipped',
    action: 'skip_concept',
    timestamp: new Date().toISOString(),
    skipReason: orchestratorDecision.skipReason || 'Learner requested skip',
    conceptId: session.currentConcept?.id,
    conceptTitle: session.currentConcept?.title,
    toolsCompleted: session.currentConceptTools
  });
  
  // Track as skipped concept - Only if we have a current concept
  if (session.currentConcept) {
    session.skippedConcepts.push({
      conceptId: session.currentConcept.id,
      conceptTitle: session.currentConcept.title,
      reason: orchestratorDecision.skipReason || 'Learner requested skip',
      toolsCompleted: session.currentConceptTools,
      hadPendingAssessment: !!session.pendingAssessment,
      hadPendingPromptEvaluation: !!session.pendingPromptEvaluation,
      timestamp: new Date().toISOString()
    });
  }
  
  // Clear any pending assessment/evaluation data
  session.pendingAssessment = null;
  session.pendingPromptEvaluation = null;
  session.lastAssessmentScore = null;
  
  // Override action to concept_complete to move forward
  orchestratorDecision.nextAction = 'concept_complete';
}

// EXISTING GAP ATTEMPT LOGIC
// Check if we're trying to insert a concept for a gap we've already attempted multiple times
if (orchestratorDecision.nextAction === 'insert_concept' && session.knowledgeGaps.length > 0) {
  const targetGap = session.knowledgeGaps[0];
  const attempts = session.gapAttempts[targetGap] || 0;
  
  if (attempts >= 2) {
    // Override the orchestrator's decision
    orchestratorDecision.nextAction = 'concept_complete';
    orchestratorDecision.reasoning = `Gap "${targetGap}" has been attempted ${attempts} times. Moving forward with core curriculum.`;
    
    // Move gap to deferred list
    session.knowledgeGaps = session.knowledgeGaps.filter(gap => gap !== targetGap);
    session.deferredGaps.push({
      gap: targetGap,
      attempts: attempts,
      deferredAt: new Date().toISOString()
    });
  }
}

// Store orchestrator decision for reference
session.lastOrchestratorDecision = {
  decision: orchestratorDecision,
  timestamp: new Date().toISOString()
};

// Store exercise focus if provided
if (orchestratorDecision.exerciseFocus) {
  session.currentExerciseFocus = orchestratorDecision.exerciseFocus;
}

// Save updated state back to global
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Pass forward with the orchestrator decision AND current concept
return {
  ...originalData,
  orchestratorDecision,
  sessionState: session,
  nextAction: orchestratorDecision.nextAction,
  currentConcept: session.currentConcept // IMPORTANT: Pass the current concept
};