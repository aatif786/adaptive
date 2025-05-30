// Node: Process Prompt Evaluation
// Node ID: 26b5b049-d975-45a7-b455-4305170199de

// This node processes the AI's evaluation of the user's prompt

const evaluationResult = JSON.parse($json.choices[0].message.content);

// After OpenAI call, we need to get data from global session - not from previous nodes
// First, we need to find the sessionId from the global sessions
const globalState = $getWorkflowStaticData('global');
const sessionEntries = Object.entries(globalState.sessions || {});

if (sessionEntries.length === 0) {
  throw new Error('No active sessions found in global state');
}

// Find the session with pending prompt evaluation
let sessionId = null;
let session = null;

for (const [id, sessionData] of sessionEntries) {
  if (sessionData.pendingPromptEvaluation) {
    sessionId = id;
    session = sessionData;
    break;
  }
}

if (!sessionId || !session) {
  throw new Error('No session with pending prompt evaluation found');
}

// Check if we're in criteria-based refinement mode
const isRefining = session.promptRefinementState?.isRefining || false;

// Check if we're in criteria-based refinement mode
if (isRefining && session.promptRefinementState) {
  const refinementState = session.promptRefinementState;
  let currentCriteria = refinementState.criteriaStatus[refinementState.currentCriteriaIndex];
  
  // Update current criteria status
  currentCriteria.attempts++;
  currentCriteria.met = evaluationResult.criteriaMet;
  currentCriteria.feedback = evaluationResult.feedback;
  currentCriteria.example = evaluationResult.example || "";
  
  // Add a score for UI display (1 if not met, 5 if met)
  evaluationResult.score = evaluationResult.criteriaMet ? 5 : 1;
  
  // Store the prompt in history
  refinementState.promptHistory.push(session.pendingPromptEvaluation.prompt);
  refinementState.currentPrompt = session.pendingPromptEvaluation.prompt;
  
  // Determine next action
  let nextAction = null;
  let routeTo = null;
  
  if (evaluationResult.criteriaMet) {
    // Current criteria met - process any additional criteria that were also evaluated
    if (evaluationResult.additionalCriteriaMet && evaluationResult.additionalCriteriaMet.length > 0) {
      evaluationResult.additionalCriteriaMet.forEach(additionalResult => {
        const criteriaIndex = refinementState.criteriaStatus.findIndex(c => c.name === additionalResult.name);
        if (criteriaIndex !== -1 && additionalResult.met) {
          refinementState.criteriaStatus[criteriaIndex].met = true;
          refinementState.criteriaStatus[criteriaIndex].attempts = 1;
          refinementState.criteriaStatus[criteriaIndex].feedback = "Met through refinement";
        }
      });
    }
    
    // Now check if there are any remaining unmet criteria
    const remainingUnmetCriteria = refinementState.criteriaStatus.filter(c => !c.met);
    
    if (remainingUnmetCriteria.length > 0) {
      // Find the first unmet criteria
      refinementState.currentCriteriaIndex = refinementState.criteriaStatus.findIndex(c => !c.met);
      // Update currentCriteria to point to the next unmet criteria
      currentCriteria = refinementState.criteriaStatus[refinementState.currentCriteriaIndex];
      nextAction = 'prompt_exercise'; // Show prompt exercise again for next criteria
      routeTo = 'prompt_exercise';
    } else {
      // All criteria met!
      refinementState.isRefining = false;
      
      // Update state machine for completion
      session.stateMachine.previousState = session.stateMachine.currentState;
      session.stateMachine.currentState = 'refinement_complete';
      session.stateMachine.stateHistory.push({
        from: session.stateMachine.previousState,
        to: 'refinement_complete',
        action: 'refinement_success',
        timestamp: new Date().toISOString(),
        conceptId: session.currentConcept?.id,
        conceptTitle: session.currentConcept?.title,
        criteriaMetCount: refinementState.criteriaStatus.filter(c => c.met).length
      });
      
      nextAction = 'refinement_complete';
      routeTo = 'smart_reply_generator'; // Go to smart reply generator, not separate handler
    }
  } else {
    // Criteria not met - loop back to prompt exercise
    nextAction = 'prompt_exercise';
    routeTo = 'prompt_exercise';
  }
  
  // Clear pending evaluation
  session.pendingPromptEvaluation = null;
  
  // Save updated state
  $getWorkflowStaticData('global').sessions[sessionId] = session;
  
  // Create response for refinement mode (built from session data)
  const refinementResponseData = {
    sessionId,
    toolType: nextAction === 'refinement_complete' ? 'refinement_success' : 'prompt_exercise',
    conceptProgress: {
      current: session.completedConcepts.length + 1,
      total: session.remainingCoreConcepts.length + 
             session.completedConcepts.length + 
             session.insertedConcepts.length
    },
    toolData: {
      task: session.currentPromptExercise?.task || session.pendingPromptEvaluation?.task,
      context: session.currentPromptExercise?.context,
      hints: session.currentPromptExercise?.hints || [],
      conceptTitle: session.currentConcept?.title,
      evaluationResult: evaluationResult,
      isRefining: nextAction !== 'refinement_complete',
      currentCriteria: nextAction === 'refinement_complete' ? refinementState.criteriaStatus : currentCriteria,
      previousPrompt: refinementState.currentPrompt,
      previousFeedback: nextAction === 'refinement_complete' ? "" : evaluationResult.feedback,
      example: nextAction === 'refinement_complete' ? "" : evaluationResult.example,
      criteriaProgress: {
        total: refinementState.criteriaStatus.length,
        met: refinementState.criteriaStatus.filter(c => c.met).length
      },
      allCriteriaMet: nextAction === 'refinement_complete'
    },
    waitingForInput: nextAction !== 'refinement_complete',
    nextAction: nextAction,
    routeTo: routeTo
  };
  
  return {
    evaluationResult,
    responseData: refinementResponseData,
    sessionId,
    routeTo: routeTo
  };
} else {
  // Original evaluation mode (non-refinement)
  
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

  // Create updated response data with evaluation results (built from session data)
  const updatedResponseData = {
    sessionId,
    toolType: 'prompt_exercise',
    conceptProgress: {
      current: session.completedConcepts.length + 1,
      total: session.remainingCoreConcepts.length + 
             session.completedConcepts.length + 
             session.insertedConcepts.length
    },
    toolData: {
      task: session.currentPromptExercise?.task || session.pendingPromptEvaluation?.task,
      context: session.currentPromptExercise?.context,
      hints: session.currentPromptExercise?.hints || [],
      conceptTitle: session.currentConcept?.title,
      evaluationResult: evaluationResult
    },
    waitingForInput: false,
    nextAction: 'Click Next to continue to the next concept.'
  };

  // Pass all necessary data forward in the pipeline
  return {
    evaluationResult,
    responseData: updatedResponseData,
    sessionId
  };
}