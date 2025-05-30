// Node: Generate Evaluate Prompt Excercise Prompt
// Node ID: ecf45b14-bee3-48af-828b-2162c6836451

// This node prepares the prompt for evaluating user's prompt exercise submission

// Prepare Prompt Evaluation Request
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session || !session.pendingPromptEvaluation) {
  throw new Error('No pending prompt evaluation found');
}

// Check if we're in criteria-based refinement mode
const refinementState = session.promptRefinementState;
const isRefining = refinementState?.isRefining && refinementState?.criteriaStatus?.length > 0;

let messages = [];

if (isRefining) {
  // Criteria-based evaluation mode
  const currentCriteria = refinementState.criteriaStatus[refinementState.currentCriteriaIndex];
  const remainingUnmetCriteria = refinementState.criteriaStatus.filter((c, idx) => !c.met && idx > refinementState.currentCriteriaIndex);
  
  messages = [
    {
      role: "system",
      content: "You are an expert at evaluating prompts based on specific criteria. Be encouraging but precise."
    },
    {
      role: "user",
      content: `Task Given to Learner: ${session.pendingPromptEvaluation.task}

Learner's Prompt: ${session.pendingPromptEvaluation.prompt}

Primary Criteria to Evaluate:
Name: ${currentCriteria.name}
Description: ${currentCriteria.description}
Evaluation Hint: ${currentCriteria.evaluationHint}
Previous Attempts: ${currentCriteria.attempts}

${remainingUnmetCriteria.length > 0 ? `
Additional Criteria to Check (only if primary criteria is met):
${remainingUnmetCriteria.map(c => `- ${c.name}: ${c.description}`).join('\n')}
` : ''}

Instructions:
1. First, evaluate if the primary criteria is met
2. If primary criteria is NOT met, return feedback only for that criteria
3. If primary criteria IS met and there are additional criteria, evaluate those as well

Return a JSON object:
{
  "criteriaMet": true/false (for primary criteria),
  "feedback": "Specific feedback about the primary criteria",
  "example": "If primary not met, provide example for primary criteria",
  "encouragement": "Brief encouraging message",
  "additionalCriteriaMet": [
    {
      "name": "criteria name",
      "met": true/false,
      "feedback": "brief feedback if not met"
    }
  ] (only include if primary criteria is met and additional criteria exist)
}`
    }
  ];
} else {
  // Original evaluation mode (all criteria at once)
  messages = [
    {
      role: "system",
      content: "You are an expert at evaluating AI prompts for product management tasks AND tracking knowledge mastery. Analyze both the prompt quality and what it reveals about the learner's understanding."
    },
    {
      role: "user",
      content: `Task: ${session.pendingPromptEvaluation.task}
Learner's Prompt: ${session.pendingPromptEvaluation.prompt}
Learner Background: ${$json.learnerProfile.role} with skills in ${$json.learnerProfile.skills.join(', ')}

Evaluation Criteria:
${JSON.stringify(session.pendingPromptEvaluation.evaluationCriteria || {})}

Current Knowledge State:
- Strengths: ${session.knowledgeStrengths?.join(', ') || 'None'}
- Gaps: ${session.knowledgeGaps?.join(', ') || 'None'}

Evaluate the prompt and return a JSON object with this exact structure:
{
  "score": (0-5 number),
  "feedback": "Constructive feedback on the prompt quality",
  "strengths": ["what they did well"],
  "improvements": ["specific suggestions"],
  "simulatedAIResponse": "What an AI would generate from this prompt",
  "knowledgeUpdate": {
    "masteredConcepts": ["concepts demonstrated mastery of"],
    "identifiedGaps": ["gaps revealed by the prompt"],
    "reasoning": "Brief explanation of knowledge assessment"
  }
}`
    }
  ];
}

// Store refinement mode flag for use in processing
const originalData = {
  sessionId: $json.sessionId,
  action: $json.action,
  learnerInput: $json.learnerInput,
  courseTopic: $json.courseTopic,
  learnerProfile: $json.learnerProfile,
  coreConcepts: $json.coreConcepts,
  userName: $json.userName,
  conceptProgress: {
    current: session.completedConcepts.length + 1,
    total: session.remainingCoreConcepts.length + 
           session.completedConcepts.length + 
           session.insertedConcepts.length
  },
  toolData: {
    task: session.pendingPromptEvaluation?.task || session.currentPromptExercise?.task || session.currentConcept?.promptTask,
    context: session.currentPromptExercise?.context,
    hints: session.currentPromptExercise?.hints || [],
    conceptTitle: session.currentConcept?.title
  },
  waitingForInput: false,
  inputType: 'evaluation',
  message: 'Evaluating your prompt...',
  isRefining: isRefining,
  currentCriteriaIndex: refinementState?.currentCriteriaIndex || 0
};

return {
  messages,
  model: "gpt-4o",
  temperature: 0.3,
  max_tokens: isRefining ? 400 : 600,
  response_format: { type: "json_object" },
  originalData
};