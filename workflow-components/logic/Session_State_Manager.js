// Node: Session State Manager
// Node ID: f28a9d2b-47a6-4d55-bc6b-ef776f4464c9

// CLEAN Session State Manager - ONLY manages state storage
// No business logic, no routing, no decisions

const sessionId = $json.sessionId || 'default-session';
const action = $json.action || 'start';
const learnerInput = $json.learnerInput || {};

// Initialize global state store if needed
let globalState = $getWorkflowStaticData('global');
if (!globalState.sessions) {
  globalState.sessions = {};
}

// Initialize new session ONLY if it doesn't exist or action is 'start'
if (!globalState.sessions[sessionId] || action === 'start') {
  // Get actual concept IDs from course data
  const conceptIds = $json.coreConcepts ? $json.coreConcepts.map(c => c.id) : [];
  
  globalState.sessions[sessionId] = {
    // Learning state
    currentConceptIndex: 0,
    completedConcepts: [],
    remainingCoreConcepts: conceptIds,
    insertedConcepts: [],
    interactionHistory: [],
    currentConcept: null,
    lastToolUsed: null,
    currentConceptTools: [],
    lastAssessmentScore: null,
    knowledgeGaps: [],
    knowledgeStrengths: [],
    knowledgeEvolution: [],
    assessmentHistory: [],
    gapAttempts: {},
    deferredGaps: [],
    gapConceptHistory: {},
    pendingAssessment: null,
    recentQuestions: [],
    
    // State Machine (isolated in global)
    stateMachine: {
      currentState: 'uninitialized',
      previousState: null,
      stateHistory: [],
      lastTransition: null
    },
    
    // Metadata
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

// That's it! Just pass through the request data
// Other nodes will read state directly and make decisions
return {
  sessionId,
  action,
  learnerInput,
  courseTopic: $json.courseTopic,
  learnerProfile: $json.learnerProfile,
  coreConcepts: $json.coreConcepts,
  userName: $json.userName
};