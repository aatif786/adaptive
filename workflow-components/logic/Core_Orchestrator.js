// Node: Core Orchestrator
// Node ID: 85da8ca4-5e62-49bf-8073-ca187e12d49a

// Enhanced Core Orchestrator - Handles deterministic flow logic
// This replaces the existing Core Orchestrator node code

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
const currentConcept = session.currentConcept;
const toolsUsed = session.currentConceptTools || [];

// DETERMINISTIC FLOW LOGIC - This is the "happy path"
function determineDefaultNextAction(session, action) {
  const toolsUsed = session.currentConceptTools || [];
  const hasAssessmentScore = session.lastAssessmentScore !== null;
  const assessmentScore = session.lastAssessmentScore || 0;
  
  // Special case: Starting the course
  if (action === 'start' && currentState === 'uninitialized') {
    return {
      action: 'show_welcome',
      reason: 'Starting course'
    };
  }
  
  // Special case: Moving from welcome
  if (action === 'next' && currentState === 'welcome') {
    return {
      action: 'load_first_concept',
      reason: 'Moving from welcome to first concept'
    };
  }
  
  // No current concept - need to load one
  if (!session.currentConcept) {
    if (session.remainingCoreConcepts.length > 0) {
      return {
        action: 'load_next_concept',
        reason: 'No current concept, loading next from queue'
      };
    } else {
      return {
        action: 'course_complete',
        reason: 'No more concepts to learn'
      };
    }
  }
  
  // MAIN FLOW LOGIC - For concepts in progress
  
  // Step 1: Always start with concept_card
  if (!toolsUsed.includes('concept_card')) {
    return {
      action: 'concept_card',
      reason: 'Every concept must start with concept card',
      isRequired: true
    };
  }
  
  // Step 2: After concept_card, do assessment
  if (toolsUsed.includes('concept_card') && !toolsUsed.includes('assessment')) {
    return {
      action: 'assessment',
      reason: 'Assessment follows concept card',
      isRequired: true,
      canSkip: true // But only with explicit learner request
    };
  }
  
  // Step 3: After assessment, decide based on score
  if (toolsUsed.includes('assessment') && hasAssessmentScore) {
    // Check if we should do prompt exercise
    const shouldDoPromptExercise = 
      assessmentScore >= 3 && 
      session.currentConcept?.shouldHavePromptTask && 
      !toolsUsed.includes('prompt_exercise');
    
    if (shouldDoPromptExercise) {
      return {
        action: 'prompt_exercise',
        reason: `Good assessment score (${assessmentScore}/5) and prompt task available`,
        isOptional: true // Adaptive orchestrator can override this
      };
    }
    
    // Low score might need remediation, but let adaptive orchestrator decide
    if (assessmentScore < 3) {
      return {
        action: 'concept_complete',
        reason: `Low score (${assessmentScore}/5) - adaptive orchestrator may insert remedial concept`,
        suggestRemediation: true
      };
    }
    
    // Otherwise, concept is complete
    return {
      action: 'concept_complete',
      reason: 'All required tools completed'
    };
  }
  
  // Step 4: After prompt exercise, complete the concept
  if (toolsUsed.includes('prompt_exercise')) {
    return {
      action: 'concept_complete',
      reason: 'Prompt exercise completed'
    };
  }
  
  // Fallback
  return {
    action: 'concept_complete',
    reason: 'Default fallback action'
  };
}

// Check if course is complete
const allConceptsCompleted = session.remainingCoreConcepts.length === 0;
const noPendingDynamicConcepts = session.insertedConcepts.every(
  conceptId => session.completedConcepts.includes(conceptId)
);
const courseComplete = !currentConcept && allConceptsCompleted && noPendingDynamicConcepts;

console.log(`Core Orchestrator: action=${action}, state=${currentState}, concept=${currentConcept?.title}`);

// Initialize routing variables
let routeTo = null;
let updateState = null;
let defaultNextAction = null;

// ROUTING LOGIC - Handle special cases and state transitions
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
      // Remove from remaining WHEN WE START IT
      session.remainingCoreConcepts = session.remainingCoreConcepts.filter(id => id !== nextId);
      
      // Mark it as core concept
      nextConcept.isCore = true;
      
      // Set as current
      session.currentConcept = nextConcept;
      session.currentConceptTools = [];
      session.lastAssessmentScore = null;
      
      // Determine default next action for this new concept
      defaultNextAction = determineDefaultNextAction(session, action);
      
      // Route to Adaptive Orchestrator with suggestion
      routeTo = 'adaptive_orchestrator';
    }
  }
}
// Handle submission of assessment answer
else if (action === 'submit_response' && lastToolUsed === 'assessment' && learnerInput?.answer) {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'assessment',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  // Always go through adaptive orchestrator if there's a note
  if (learnerInput?.note) {
    session.pendingAssessment = {
      answer: learnerInput.answer,
      note: learnerInput.note,
      question: session.currentConcept?.assessmentQuestion
    };
    
    // Get default action (which would be to grade)
    defaultNextAction = {
      action: 'grade_assessment',
      reason: 'Assessment submitted, default is to grade',
      hasLearnerNote: true
    };
    
    routeTo = 'adaptive_orchestrator';
    updateState = 'assessment_with_note_pending';
  } else {
    // No note - proceed with normal grading
    routeTo = 'grade_assessment';
    updateState = 'assessment_submitted';
  }
}
// NEW: Handle submission of prompt exercise
else if (action === 'submit_response' && lastToolUsed === 'prompt_exercise' && learnerInput?.prompt) {
  // Record the interaction
  session.interactionHistory.push({
    concept: session.currentConcept?.title,
    tool: 'prompt_exercise',
    input: learnerInput,
    timestamp: new Date().toISOString()
  });
  
  // Store pending evaluation data
  session.pendingPromptEvaluation = {
    prompt: learnerInput.prompt,
    note: learnerInput.note,
    task: session.currentPromptExercise?.task || session.currentConcept?.promptTask,
    evaluationCriteria: session.currentPromptExercise?.evaluationCriteria
  };
  
  // Always go through adaptive orchestrator if there's a note
  if (learnerInput?.note) {
    // Get default action (which would be to evaluate)
    defaultNextAction = {
      action: 'evaluate_prompt',
      reason: 'Prompt exercise submitted, default is to evaluate',
      hasLearnerNote: true
    };
    
    routeTo = 'adaptive_orchestrator';
    updateState = 'prompt_with_note_pending';
  } else {
    // No note - proceed with normal evaluation
    routeTo = 'evaluate_prompt';
    updateState = 'prompt_submitted';
  }
}
// All other cases - determine default and let adaptive orchestrator decide
else {
  // Calculate the default next action based on current state
  defaultNextAction = determineDefaultNextAction(session, action);
  
  // Special handling for specific actions
  if (action === 'submit_response') {
    // Record interactions
    session.interactionHistory.push({
      concept: session.currentConcept?.title,
      tool: lastToolUsed,
      input: learnerInput,
      timestamp: new Date().toISOString()
    });
    
    // Track questions/notes
    if (learnerInput?.note) {
      session.recentQuestions.push(learnerInput.note);
      if (session.recentQuestions.length > 5) {
        session.recentQuestions.shift();
      }
    }
  }
  
  // Always route through adaptive orchestrator for intelligent decisions
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

// Build comprehensive context for adaptive orchestrator
const orchestratorContext = {
  defaultNextAction: defaultNextAction,
  currentProgress: {
    toolsCompleted: session.currentConceptTools,
    hasAssessment: session.currentConceptTools.includes('assessment'),
    assessmentScore: session.lastAssessmentScore,
    hasPromptExercise: session.currentConceptTools.includes('prompt_exercise')
  },
  learnerContext: {
    hasNote: !!learnerInput?.note,
    noteContent: learnerInput?.note,
    recentQuestions: session.recentQuestions,
    knowledgeGaps: session.knowledgeGaps,
    knowledgeStrengths: session.knowledgeStrengths
  },
  conceptContext: {
    currentConcept: session.currentConcept,
    isCore: session.currentConcept?.isCore,
    isDynamic: session.currentConcept?.isDynamic,
    targetedGaps: session.currentConcept?.targetedGaps
  }
};

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
  courseComplete: courseComplete,
  // IMPORTANT: Pass the default next action and context
  defaultNextAction: defaultNextAction,
  orchestratorContext: orchestratorContext
};

// Include current concept if we have one
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

return outputData;