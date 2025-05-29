// Node: Core Orchestrator
// Node ID: 85da8ca4-5e62-49bf-8073-ca187e12d49a

// Combined Routing & Core Orchestrator - FIXED
// Handles both routing decisions AND simple deterministic transitions

const sessionId = $json.sessionId;
const action = $json.action;
const learnerInput = $json.learnerInput;

// Read state directly from global
const session = $getWorkflowStaticData('global').sessions[sessionId];
if (!session) {
  throw new Error(`Session ${sessionId} not found`);
}

// Get current state
const currentState = session.stateMachine.currentState;
const lastToolUsed = session.lastToolUsed;
const pendingGrading = currentState === 'assessment_submitted';
const currentConcept = session.currentConcept;

// Check if course is complete
const allConceptsCompleted = session.remainingCoreConcepts.length === 0;
const noPendingDynamicConcepts = session.insertedConcepts.every(
  conceptId => session.completedConcepts.includes(conceptId)
);
const courseComplete = !currentConcept && allConceptsCompleted && noPendingDynamicConcepts;

console.log(`Routing: action=${action}, state=${currentState}, currentConcept=${currentConcept?.title}, remaining=${session.remainingCoreConcepts.length}`);

// Initialize routing variables
let routeTo = null;
let updateState = null;

// ROUTING LOGIC - Determine routing
if (courseComplete) {
  routeTo = 'show_completion';
  updateState = 'course_complete';
}
// Start of course
else if (action === 'start' && currentState === 'uninitialized') {
  routeTo = 'show_welcome';
  updateState = 'welcome';
}
// Moving from welcome to first concept
else if (action === 'next' && currentState === 'welcome') {
  // Get the first concept and set it as current
  let nextConcept = null;
  if (session.remainingCoreConcepts.length > 0) {
    const nextId = session.remainingCoreConcepts[0];
    nextConcept = $json.coreConcepts.find(c => c.id === nextId);
    
    if (nextConcept) {
      // IMPORTANT: Remove from remaining WHEN WE START IT
      session.remainingCoreConcepts = session.remainingCoreConcepts.filter(id => id !== nextId);
      
      // Mark it as core concept
      nextConcept.isCore = true;
      
      // Set as current
      session.currentConcept = nextConcept;
      session.currentConceptTools = [];
      session.lastAssessmentScore = null;
      
      // Route to Adaptive Orchestrator
      routeTo = 'adaptive_orchestrator';
    }
  }
}
// After concept completion, get next concept
else if (action === 'next' && currentState === 'concept_completing') {
  // First check for any inserted dynamic concepts that haven't been completed
  const pendingDynamicConcepts = session.insertedConcepts.filter(
    id => !session.completedConcepts.includes(id)
  );
  
  let nextConcept = null;
  
  if (pendingDynamicConcepts.length > 0) {
    // We have a dynamic concept to show
    // For now, just create a placeholder - in real implementation, 
    // you'd retrieve the stored dynamic concept
    const dynamicId = pendingDynamicConcepts[0];
    console.log(`Loading dynamic concept: ${dynamicId}`);
    
    // Remove from insertedConcepts since we're starting it
    session.insertedConcepts = session.insertedConcepts.filter(id => id !== dynamicId);
    
    // In a real implementation, you'd load the dynamic concept from storage
    // For now, we'll skip to the next core concept
    // TODO: Implement dynamic concept storage and retrieval
  }
  
  // Get next core concept if no dynamic concepts pending
  if (!nextConcept && session.remainingCoreConcepts.length > 0) {
    const nextId = session.remainingCoreConcepts[0];
    nextConcept = $json.coreConcepts.find(c => c.id === nextId);
    
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
      
      routeTo = 'adaptive_orchestrator';
      updateState = 'concept_started';
    }
  } else if (!nextConcept) {
    // No more concepts - course complete
    routeTo = 'show_completion';
    updateState = 'course_complete';
  }
}
// CRITICAL FIX: Handle when Adaptive Orchestrator decides to show concept_card
// but there's no current concept (happens after concept_completing state)
else if (action === 'next' && !currentConcept && session.remainingCoreConcepts.length > 0) {
  // Load the next concept
  const nextId = session.remainingCoreConcepts[0];
  const nextConcept = $json.coreConcepts.find(c => c.id === nextId);
  
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
    
    // Route back to Adaptive Orchestrator to decide on the tool
    routeTo = 'adaptive_orchestrator';
    updateState = 'concept_started';
  }
}
// Assessment submission
else if (action === 'submit_response' && lastToolUsed === 'assessment' && learnerInput?.answer) {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'assessment',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  // If there's a note, let Adaptive Orchestrator decide whether to grade
  if (learnerInput?.note) {
    session.pendingAssessment = {
      answer: learnerInput.answer,
      note: learnerInput.note,
      question: session.currentConcept?.assessmentQuestion
    };
    routeTo = 'adaptive_orchestrator';
    updateState = 'assessment_with_note_pending';
  } else {
    // No note - proceed with normal grading
    routeTo = 'grade_assessment';
    updateState = 'assessment_submitted';
  }
}
// Concept card note submission
else if (action === 'submit_response' && lastToolUsed === 'concept_card') {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'concept_card',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  if (learnerInput?.note) {
    session.recentQuestions.push(learnerInput.note);
    if (session.recentQuestions.length > 5) {
      session.recentQuestions.shift();
    }
  }
  
  routeTo = 'adaptive_orchestrator';
  updateState = 'concept_note_submitted';
}
// Prompt exercise submission WITHOUT note - direct to evaluation
else if (action === 'submit_response' && lastToolUsed === 'prompt_exercise' && learnerInput?.prompt && !learnerInput?.note) {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'prompt_exercise',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  // Store prompt for evaluation
  session.pendingPromptEvaluation = {
    prompt: learnerInput.prompt,
    task: session.currentPromptExercise?.generatedTask || session.currentConcept?.promptTask,
    evaluationCriteria: session.currentPromptExercise?.evaluationCriteria
  };
  
  routeTo = 'evaluate_prompt';
  updateState = 'prompt_submitted';
}
// Prompt exercise submission WITH note - let Adaptive Orchestrator decide
else if (action === 'submit_response' && lastToolUsed === 'prompt_exercise' && learnerInput?.prompt && learnerInput?.note) {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'prompt_exercise',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  // Store prompt for potential evaluation
  session.pendingPromptEvaluation = {
    prompt: learnerInput.prompt,
    note: learnerInput.note,
    task: session.currentPromptExercise?.generatedTask || session.currentConcept?.promptTask,
    evaluationCriteria: session.currentPromptExercise?.evaluationCriteria
  };
  
  // Let Adaptive Orchestrator decide based on the note
  routeTo = 'adaptive_orchestrator';
  updateState = 'prompt_with_note_submitted';
}
// Post-grading decision needed
else if (session.stateMachine.currentState === 'assessment_graded') {
  // Assessment was just graded, decide next action
  routeTo = 'adaptive_orchestrator';
}
// General next action after completing a concept
else if (action === 'next' && currentState === 'concept_completing') {
  // This is handled above in the specific case
  console.log('Concept completing state - should have been handled above');
}
// General next action
else if (action === 'next' && currentConcept) {
  routeTo = 'adaptive_orchestrator';
}

// Update state machine if needed
if (updateState) {
  session.stateMachine.previousState = currentState;
  session.stateMachine.currentState = updateState;
  session.stateMachine.stateHistory.push({
    from: currentState,
    to: updateState,
    action: action,
    timestamp: new Date().toISOString(),
    orchestrator: 'core'
  });
}

// Save back to global
$getWorkflowStaticData('global').sessions[sessionId] = session;

// Pass through current concept if it exists
const outputData = {
  sessionId,
  action,
  learnerInput,
  courseTopic: $json.courseTopic,
  learnerProfile: $json.learnerProfile,
  coreConcepts: $json.coreConcepts,
  userName: $json.userName,
  routeTo: routeTo,
  courseComplete: courseComplete
};

// IMPORTANT: Include currentConcept if we have one
if (session.currentConcept) {
  outputData.currentConcept = session.currentConcept;
}

// Include session state for debugging
outputData.sessionState = {
  remainingCoreConcepts: session.remainingCoreConcepts,
  completedConcepts: session.completedConcepts,
  currentConceptId: session.currentConcept?.id,
  stateMachine: session.stateMachine
};

// SINGLE RETURN FORMAT
return outputData;