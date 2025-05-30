// Node: Process Prompt Evaluation
// Node ID: 26b5b049-d975-45a7-b455-4305170199de

// This node processes the AI's evaluation of the user's prompt

const evaluationResult = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Generate Prompt Exercise Evaluation AI Call)
const originalData = $('Generate Evaluate Prompt Excercise Prompt').first().json.originalData;
const sessionId = originalData.sessionId;
const responseData = originalData.responseData;
const isRefining = originalData.isRefining;

// Get session from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Check if we're in criteria-based refinement mode
if (isRefining && session.promptRefinementState) {
  const refinementState = session.promptRefinementState;
  const currentCriteria = refinementState.criteriaStatus[refinementState.currentCriteriaIndex];
  
  // Update current criteria status
  currentCriteria.attempts++;
  currentCriteria.met = evaluationResult.criteriaMet;
  currentCriteria.feedback = evaluationResult.feedback;
  currentCriteria.example = evaluationResult.example || "";
  
  // Store the prompt in history
  refinementState.promptHistory.push(session.pendingPromptEvaluation.prompt);
  refinementState.currentPrompt = session.pendingPromptEvaluation.prompt;
  
  // Determine next action
  let nextAction = null;
  let routeTo = null;
  
  if (evaluationResult.criteriaMet) {
    // Current criteria met - check if there are more
    const unmetCriteria = refinementState.criteriaStatus.filter((c, idx) => !c.met && idx > refinementState.currentCriteriaIndex);
    
    if (unmetCriteria.length > 0) {
      // Move to next unmet criteria
      refinementState.currentCriteriaIndex = refinementState.criteriaStatus.findIndex((c, idx) => !c.met && idx > refinementState.currentCriteriaIndex);
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
  
  // Create response for refinement mode
  const refinementResponseData = {
    ...responseData,
    toolType: nextAction === 'refinement_complete' ? 'refinement_success' : 'prompt_exercise',
    toolData: {
      ...responseData.toolData,
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
      allCriteriaMet: nextAction === 'refinement_complete',
      conceptTitle: session.currentConcept?.title
    },
    waitingForInput: nextAction !== 'refinement_complete',
    nextAction: nextAction,
    routeTo: routeTo
  };
  
  return {
    ...originalData,
    evaluationResult,
    responseData: refinementResponseData,
    sessionId,
    routeTo: routeTo,
    learnerProfile: originalData.learnerProfile
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
}