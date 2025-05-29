// Node: Welcome Message Handler
// Node ID: 4cbaf678-cbcb-40c0-9b63-23718d42cbb4

// Fix for Welcome Message Handler
// Location: "Welcome Message" node

const sessionId = $json.sessionId;
const courseTopic = $json.courseTopic;

// Get session from global
const session = $getWorkflowStaticData('global').sessions[sessionId];

// UPDATE STATE MACHINE
session.stateMachine.previousState = session.stateMachine.currentState;
session.stateMachine.currentState = 'welcome';
session.stateMachine.stateHistory.push({
  from: session.stateMachine.previousState,
  to: 'welcome',
  action: 'show_welcome',
  timestamp: new Date().toISOString()
});

// Save updated state
$getWorkflowStaticData('global').sessions[sessionId] = session;

const responseData = {
  sessionId,
  toolType: 'welcome',
  toolData: {
    title: `Welcome to: ${courseTopic}`,
    message: 'This adaptive course will guide you through 10 core concepts with personalized instruction based on your progress.',
    instructions: 'Click Next to begin with the first concept.'
  },
  waitingForInput: false,
  nextAction: 'start_course'
};

return {
  ...($json),
  responseData
};