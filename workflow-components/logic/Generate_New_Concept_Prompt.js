// Node: Generate New Concept Prompt
// Node ID: be6c4756-8d39-4edd-a4d1-ac8a09a1d37b

// Generate Concept Prompt - Prepares prompt for creating new adaptive concepts
const messages = [
  {
    role: "system",
    content: "Generate a new mini-concept to address a specific learning gap. The concept MUST directly target the identified gap, and the assessment question MUST verify the learner understands the gap area. Focus on building a bridge from their current understanding to the correct concept."
  },
  {
    role: "user", 
    content: `Context:
- Main Topic: ${$json.courseTopic}
- Current Concept: ${$json.currentConcept.title}
- Knowledge Gap: ${$json.orchestratorDecision.conceptNeeded.reason}
- Specific Gap to Address: ${$json.sessionState.knowledgeGaps?.[0] || $json.orchestratorDecision.conceptNeeded.focus}
- Learner Profile: ${$json.learnerProfile.role} at ${$json.learnerProfile.company}

The learner scored ${$json.sessionState.lastAssessmentScore}/5 and showed confusion about: "${$json.sessionState.knowledgeGaps?.[0] || 'the core concept'}"

Create a focused concept that DIRECTLY addresses this specific gap: "${$json.orchestratorDecision.conceptNeeded.reason}"

The assessment question MUST test whether the learner understands: ${$json.sessionState.knowledgeGaps?.[0] || $json.orchestratorDecision.conceptNeeded.focus}

Return JSON:
{
  "title": "Clear, specific title",
  "summary": "500 word overview",
  "expertTips": ["2-3 practical tips"],
  "assessmentQuestion": "Targeted question to verify understanding",
  "correctAnswer": "Brief correct answer"
}`
  }
];

return {
  messages,
  model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 1000,
  response_format: { type: "json_object" },
  // Pass through ALL the original data
  originalData: $json
};