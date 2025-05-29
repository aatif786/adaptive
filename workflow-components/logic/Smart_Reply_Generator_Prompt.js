// Node: Smart Reply Generator Prompt
// Node ID: 37d29304-8841-424a-ac9c-9e55c72d0f56

// Smart Reply Generator for 6 Input Handlers
const toolType = $json.responseData?.toolType;
const toolData = $json.responseData?.toolData;
const sessionId = $json.sessionId;

// Get session for context
const session = $getWorkflowStaticData('global').sessions[sessionId];

// Determine which handler sent this based on context
let inputSource = '';
if ($json.needsGrading && toolType === 'assessment') {
  inputSource = 'assessment_handler';
} else if ($json.gradingResult && toolType === 'assessment') {
  inputSource = 'process_grading';
} else if ($json.evaluationResult && toolType === 'prompt_exercise') {
  inputSource = 'process_prompt_evaluation';
} else if ($json.enhancedPromptTask && toolType === 'prompt_exercise') {
  inputSource = 'process_generated_prompt';
} else if (toolType === 'concept_card') {
  inputSource = 'concept_card_handler';
} else if (toolType === 'transition') {
  inputSource = 'complete_concept_handler';
}

// Build context for smart reply generation
let contextPrompt = '';

switch(inputSource) {
  case 'concept_card_handler':
    // Input 1: Concept Card Handler - showing concept for first time
    contextPrompt = `Tool: Concept Card (Initial Display)
Current Concept: ${toolData.title}
Summary: ${toolData.summary}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}
Status: Learner is reading this concept and can add notes

Generate 5 smart reply options for notes they might want to add:
- Question about applying this to their role
- Request for concrete examples
- Express confusion about specific aspect
- Indicate they already know this
- Ask how this relates to previous concepts`;
    break;
  case 'assessment_handler':
    // Input 2: Assessment Handler - just submitted answer, waiting for grading
    contextPrompt = `Tool: Assessment (Answer Submitted, Pre-Grading)
Question: ${toolData.question}
Concept: ${toolData.conceptTitle}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}
Status: Answer submitted, can add a note before grading

Generate 5 smart reply options for notes about their answer:
- Admit uncertainty or guessing
- Challenge the question wording
- Explain their reasoning
- Point out ambiguity in options
- Request hint or clarification`;
    break;
    
  case 'process_grading':
    // Input 3: Process Grading - seeing their score and feedback
    const score = toolData.gradingResult?.score || 0;
    contextPrompt = `Tool: Assessment Results (Post-Grading)
Question: ${toolData.question}
Score: ${score}/5
Feedback: ${toolData.gradingResult?.feedback}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}
Status: Viewing grading results

Generate 5 smart reply options based on score ${score}/5:
${score >= 4 ? 
'- Express satisfaction\n- Ask for advanced application\n- Ready for harder challenges\n- Connect to their work context\n- Move to next concept' : 
score >= 2 ? 
'- Ask for clarification\n- Request another example\n- Partial understanding acknowledgment\n- Disagree with grading\n- Need more practice' : 
'- Express frustration\n- Request detailed explanation\n- Ask for simpler version\n- Need to review concept\n- Want personal help'}`;
    break;
    
  case 'process_prompt_evaluation':
    // Input 4: Process Prompt Evaluation - seeing evaluation results
    const promptScore = toolData.evaluationResult?.score || 0;
    contextPrompt = `Tool: Prompt Exercise Results (Post-Evaluation)
Task: ${toolData.task}
Score: ${promptScore}/5
Feedback: ${toolData.evaluationResult?.feedback}
AI Response: ${toolData.evaluationResult?.simulatedAIResponse ? 'Shown' : 'Not shown'}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}
Status: Viewing prompt evaluation

Generate 5 smart reply options for score ${promptScore}/5:
- ${promptScore >= 4 ? 'Want more advanced prompting' : 'Need better examples'}
- ${promptScore >= 4 ? 'Try industry-specific prompt' : 'Request prompt templates'}
- ${promptScore >= 3 ? 'Understand the feedback' : 'Confused by evaluation'}
- Ask about best practices
- ${promptScore < 3 ? 'Want to retry' : 'Ready to continue'}`;
    break;
    
  case 'process_generated_prompt':
    // Input 5: Process Generated Prompt Exercise - seeing the enhanced exercise
    const difficulty = toolData.difficulty || 'unknown';
    contextPrompt = `Tool: Prompt Exercise (Enhanced Task Display)
Task: ${toolData.task}
Context: ${toolData.context || 'None'}
Hints Available: ${toolData.hints?.length || 0}
Difficulty: ${difficulty}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}
Status: Viewing prompt exercise task

Generate 5 smart reply options for task difficulty "${difficulty}":
- ${difficulty === 'advanced' ? 'This looks challenging' : 'I can handle this'}
- ${toolData.hints?.length ? 'Show me a hint' : 'Need more context'}
- Ask about evaluation criteria
- ${difficulty === 'beginner' ? 'Too easy for me' : 'Request simpler version'}
- Connect to their ${$json.learnerProfile?.role} role`;
    break;
    
  case 'complete_concept_handler':
    // Input 6: Complete Concept - transitioning between concepts
    const completedTitle = toolData.completedConcept || session.currentConcept?.title;
    const wasSkipped = session.skippedConcepts?.some(
      skip => skip.conceptTitle === completedTitle
    );
    const lastScore = session.lastAssessmentScore;
    
    contextPrompt = `Tool: Concept Transition
Just Completed: ${completedTitle}
Completion Type: ${wasSkipped ? 'Skipped' : lastScore >= 4 ? 'Mastered' : lastScore >= 3 ? 'Adequate' : 'Struggled'}
Assessment Score: ${lastScore || 'N/A'}/5
Progress: ${session.completedConcepts?.length || 0} concepts done
Status: Moving to next concept

Generate 5 smart reply options for this transition:
${wasSkipped ? 
'- Why I skipped this\n- Actually, let me try it\n- I already know this well\n- Move to next topic\n- Will this hurt my progress?' :
lastScore < 3 ? 
'- Wait, I need review\n- Still confused about X\n- Can we go slower?\n- Show me similar concept\n- I need a break' :
'- Great, what\'s next?\n- How does this connect?\n- That was helpful\n- Ready for harder stuff\n- Can I reference this later?'}`;
    break;
    
  default:
    // Fallback - should not happen with proper routing
    contextPrompt = `Tool: Unknown Input Source
Current State: ${session.stateMachine?.currentState}
Tool Type: ${toolType}
Learner Role: ${$json.learnerProfile?.role || 'Product Manager'}

Generate 5 general smart reply options for learning.`;
}

// Add session context to all prompts
const additionalContext = `

Additional Context:
- Knowledge Gaps: ${session.knowledgeGaps?.join(', ') || 'None identified'}
- Knowledge Strengths: ${session.knowledgeStrengths?.join(', ') || 'None identified'}
- Recent Questions: ${session.recentQuestions?.slice(-2).join('; ') || 'None'}
- Learning Progress: ${session.completedConcepts?.length || 0} concepts completed
- Current State: ${session.stateMachine?.currentState}
- Last Tool Used: ${session.lastToolUsed}`;

const messages = [
  {
    role: "system",
    content: "You are an adaptive learning assistant generating smart reply options for learners. Create short, natural responses that a learner might click instead of typing. Each reply should be under 10 words and feel conversational. Make them contextually relevant and emotionally appropriate to the learner's current situation."
  },
  {
    role: "user",
    content: `${contextPrompt}${additionalContext}

Return a JSON object with exactly this structure:
{
  "replies": ["Reply 1", "Reply 2", "Reply 3", "Reply 4", "Reply 5"]
}

Make replies:
1. Contextually relevant to the specific handler and state
2. Natural and conversational (how real learners talk)
3. Actionable and specific
4. Varied in intent (questions, confirmations, concerns, requests)
5. Emotionally appropriate (encouraging for struggles, challenging for high performers)
6. Under 10 words each`
  }
];

return {
  messages,
  model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 300,
  response_format: { type: "json_object" },
  // Pass through ALL the original data
  originalData: $json
};