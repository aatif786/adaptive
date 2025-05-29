// Node: Generate Prompt Exercise Prompt
// Node ID: 595ebb3c-f347-46f2-8d5d-25dfeee6526b

// Generate Prompt Exercise - Creates targeted prompt exercises
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
  throw new Error(`Session ${sessionId} not found in global state`);
}

const messages = [
  {
    role: "system",
    content: "You are an expert instructional designer creating prompt engineering exercises for product managers. Create exercises that test practical application of AI concepts in product management contexts."
  },
  {
    role: "user", 
    content: `Context:
- Course Topic: ${$json.courseTopic}
- Current Concept: ${session.currentConcept?.title || 'Unknown'}
- Concept Summary: ${session.currentConcept?.summary || 'N/A'}
- Learner Profile: ${$json.learnerProfile.role} at ${$json.learnerProfile.company}
- Learner Skills: ${$json.learnerProfile.skills.join(', ')}

Knowledge State:
- Strengths: ${session.knowledgeStrengths?.join(', ') || 'None tracked yet'}
- Gaps: ${session.knowledgeGaps?.join(', ') || 'None tracked yet'}
- Recent Assessment Score: ${session.lastAssessmentScore || 'N/A'}/5

Previous Interactions:
- Tools Used This Concept: ${session.currentConceptTools.join(', ')}
- Recent Questions: ${session.recentQuestions?.slice(-2).join('; ') || 'None'}

${session.orchestratorDecision?.exerciseFocus ? 
  `Special Focus: Create an exercise that specifically addresses: "${session.orchestratorDecision.exerciseFocus}"` : 
  'Create a prompt exercise that reinforces the current concept.'}

Generate a prompt exercise that:
1. Is directly relevant to "${session.currentConcept?.title}"
2. Tests practical application in their role as ${$json.learnerProfile.role}
3. Addresses any identified knowledge gaps
4. Builds on their existing strengths
5. Is appropriately challenging based on their assessment score

Return JSON:
{
  "task": "Clear, specific task description",
  "context": "Brief scenario or context for the task",
  "expectedOutcomes": ["What a good prompt should achieve"],
  "hints": ["2-3 helpful hints without giving away the answer"],
  "evaluationCriteria": {
    "must_include": ["Key elements that must be in the prompt"],
    "should_consider": ["Important considerations"],
    "avoid": ["Common mistakes to avoid"]
  },
  "difficulty": "beginner|intermediate|advanced",
  "targetedSkills": ["specific skills being tested"]
}`
  }
];

return {
  messages,
  model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 800,
  response_format: { type: "json_object" },
  originalData: $json
};