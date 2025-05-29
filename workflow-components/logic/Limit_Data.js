// Node: Limit Data
// Node ID: ddb6f37f-de10-4755-bcb2-322171d87022

// Node: Limit Data
// Node ID: ddb6f37f-de10-4755-bcb2-322171d87022

// Extract Response Data
const responseData = $json.responseData;

if (!responseData) {
  throw new Error('No responseData found in input');
}

// Check if debug mode is enabled (passed from frontend request)
const debugMode = $json.debugMode || $json.learnerInput?.debugMode || false;

if (debugMode) {
  // Get the session ID from the data
  const sessionId = $json.sessionId || responseData.sessionId;
  
  // Access the global state directly
  const globalState = $getWorkflowStaticData('global');
  const session = globalState.sessions?.[sessionId];
  
  // Return full data structure including debug information and global state
  return {
    ...responseData,
    debug: {
      // Session-level debug data
      sessionId: sessionId,
      currentSession: session ? {
        stateMachine: session.stateMachine,
        currentConceptIndex: session.currentConceptIndex,
        completedConcepts: session.completedConcepts,
        remainingCoreConcepts: session.remainingCoreConcepts,
        insertedConcepts: session.insertedConcepts,
        currentConcept: session.currentConcept,
        currentConceptTools: session.currentConceptTools,
        lastToolUsed: session.lastToolUsed,
        lastAssessmentScore: session.lastAssessmentScore,
        knowledgeGaps: session.knowledgeGaps,
        knowledgeStrengths: session.knowledgeStrengths,
        knowledgeEvolution: session.knowledgeEvolution,
        assessmentHistory: session.assessmentHistory,
        interactionHistory: session.interactionHistory,
        recentQuestions: session.recentQuestions,
        orchestratorOverrides: session.orchestratorOverrides,
        learnerNoteHistory: session.learnerNoteHistory,
        gapAttempts: session.gapAttempts,
        deferredGaps: session.deferredGaps,
        skippedConcepts: session.skippedConcepts,
        completionMetadata: session.completionMetadata,
        promptExerciseShowCount: session.promptExerciseShowCount,
        createdAt: session.createdAt,
        lastUpdated: session.lastUpdated
      } : null,
      
      // Data from the current pipeline
      lastAction: $json.action,
      learnerInput: $json.learnerInput,
      learnerProfile: $json.learnerProfile,
      gradingResult: $json.gradingResult,
      evaluationResult: $json.evaluationResult,
      orchestratorDecision: $json.orchestratorDecision,
      defaultNextAction: $json.defaultNextAction,
      decisionTracking: $json.decisionTracking,
      
      // Raw pipeline data
      rawPipelineData: $json
    }
  };
}

// Normal mode - return only responseData
return responseData;