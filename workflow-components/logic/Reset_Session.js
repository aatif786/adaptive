// Node: Reset Session
// Node ID: a788c2e3-36bb-421b-8731-08e8ba832ac0

// Reset Session
const sessionId = $json.query?.sessionId || 'default-session';

// Clear session data
const sessionState = $getWorkflowStaticData('global');
if (sessionState.sessions && sessionState.sessions[sessionId]) {
  delete sessionState.sessions[sessionId];
}

return {
  success: true,
  message: `Session ${sessionId} has been reset`,
  sessionId
};