// Node: Generate Assessment Grading Prompt
// Node ID: 54560bf3-5b60-4b13-bc9a-7a791d4c925e

// Generate Assessment Grading Prompt - FIXED to properly get learner answer
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
  throw new Error(`Session ${sessionId} not found in global state`);
}

// Get the learner's answer from the input
const learnerAnswer = $json.learnerInput?.answer;

if (!learnerAnswer) {
  throw new Error('No learner answer found in the input');
}

const messages = [
  {
    role: "system",
    content: "You are an expert instructional coach who evaluates learner understanding AND tracks their evolving knowledge state. Analyze both the current answer and overall knowledge progression."
  },
  {
    role: "user", 
    content: `Context:
- Course Topic: ${$json.courseTopic}
- Current Concept: ${session.currentConcept.title}
- Question: ${session.currentConcept.assessmentQuestion}
- Correct Answer: ${session.currentConcept.correctAnswer}
- Learner's Answer: ${learnerAnswer}
- Learner Profile: ${$json.learnerProfile.role} at ${$json.learnerProfile.company}

Current Knowledge State:
- Strengths: ${session.knowledgeStrengths?.join(', ') || 'None tracked yet'}
- Gaps: ${session.knowledgeGaps?.join(', ') || 'None tracked yet'}

Assessment Context:
- Is this a dynamic concept?: ${session.currentConcept.isDynamic || false}
- Targeted gaps (if dynamic): ${session.currentConcept.targetedGaps?.join(', ') || 'N/A'}
- Previous score: ${session.lastAssessmentScore || 'N/A'}

Evaluate the answer AND update their knowledge state. Return JSON:
{
  "score": (0-5 number),
  "feedback": "Brief, encouraging feedback",
  "understood": (true or false),
  "knowledgeUpdate": {
    "updatedStrengths": ["Complete list of what learner knows well"],
    "updatedGaps": ["Complete list of significant gaps needing attention"],
    "reasoning": "Brief explanation of knowledge state changes"
  }
}

Grading Rules:
- 5: Perfect understanding
- 4: Good understanding with minor gaps
- 3: Adequate understanding for progression
- 2: Significant gaps but some understanding
- 0-1: Major misunderstanding

Knowledge Rules:
- Add strengths for demonstrated understanding (scores 3+)
- Remove gaps that were successfully addressed
- Only list actionable, specific gaps
- For dynamic concepts addressing gaps, be generous if progress is shown
- Empty gaps array means no significant issues`
  }
];

return {
  messages,
  model: "gpt-4o",
  temperature: 0.3,
  max_tokens: 400,
  response_format: { type: "json_object" },
  // Pass through all necessary data for processing
  originalData: {
    sessionId: $json.sessionId,
    courseTopic: $json.courseTopic,
    learnerAnswer: learnerAnswer,
    learnerProfile: $json.learnerProfile,
    learnerInput: $json.learnerInput
  }
};