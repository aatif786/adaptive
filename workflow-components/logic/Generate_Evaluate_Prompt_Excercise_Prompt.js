// Node: Generate Evaluate Prompt Excercise Prompt
// Node ID: ecf45b14-bee3-48af-828b-2162c6836451

// This node prepares the prompt for evaluating user's prompt exercise submission

// Prepare Prompt Evaluation Request
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session || !session.pendingPromptEvaluation) {
  throw new Error('No pending prompt evaluation found');
}

const messages = [
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

return {
  messages,
  model: "gpt-4o",
  temperature: 0.3,
  max_tokens: 800,
  response_format: { type: "json_object" },
  // Pass through all data needed for processing
  originalData: {
    sessionId: $json.sessionId,
    courseTopic: $json.courseTopic,
    learnerProfile: $json.learnerProfile,
    pendingPromptEvaluation: session.pendingPromptEvaluation,
    currentConcept: session.currentConcept,
    // IMPORTANT: Construct the responseData here
    responseData: {
      sessionId: $json.sessionId,
      toolType: 'prompt_exercise',
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
      message: 'Evaluating your prompt...'
    }
  }
};