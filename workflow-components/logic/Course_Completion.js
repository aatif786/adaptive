// Node: Course Completion
// Node ID: aa6fd26e-4342-4ee8-a8bd-caac1935ac77

// Course Completion Handler
const sessionId = $json.sessionId;
const session = $json.sessionState;

// Calculate final statistics
const totalConcepts = session.completedConcepts.length;
const coreConceptsCompleted = session.completedConcepts.filter(id => 
  typeof id === 'number'
).length;
const dynamicConceptsCompleted = totalConcepts - coreConceptsCompleted;
const skippedConcepts = session.skippedConcepts?.length || 0;

// Prepare completion response
const responseData = {
  sessionId,
  toolType: 'course_complete',
  courseComplete: true,
  toolData: {
    title: 'Congratulations! Course Complete',
    summary: `You've successfully completed all ${totalConcepts} concepts in the course.`,
    statistics: {
  coreConceptsCompleted,
  dynamicConceptsAdded: dynamicConceptsCompleted,
  conceptsSkipped: skippedConcepts,
  totalInteractions: session.interactionHistory.length,
  completionBreakdown: {
    mastered: Object.values(session.completionMetadata || {})
      .filter(m => m.completionType === 'mastered').length,
    adequate: Object.values(session.completionMetadata || {})
      .filter(m => m.completionType === 'adequate').length,
    struggled: Object.values(session.completionMetadata || {})
      .filter(m => m.completionType === 'struggled').length,
    skipped: skippedConcepts
  }
},
    message: 'Great job completing the AI Native Product Manager course!'
  },
  waitingForInput: false
};

return {
  responseData
};