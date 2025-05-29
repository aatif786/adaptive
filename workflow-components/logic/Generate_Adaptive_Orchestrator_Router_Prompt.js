// Node: Generate Adaptive Orchestrator Router Prompt
// Node ID: 09b3fb2e-a46c-4a40-aab2-af9903280fe0

// Adaptive Orchestrator Router Prompt - WITH PROMPT EXERCISE INTELLIGENCE
// Get session directly from global
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
  throw new Error(`Session ${sessionId} not found in global state`);
}

const messages = [
  {
    role: "system",
    content: "You are an adaptive learning orchestrator. Analyze the current learning state and decide the next best action for the learner. When learner notes are provided, carefully analyze them to determine if the learner needs clarification, wants to skip, is ready to progress, or would benefit from additional content. You can also decide whether to grade a pending assessment or skip grading based on the learner's needs. You can also decide whether to evaluate a pending prompt exercise evaluation or skip prompt exercise evaluation based on learner's needs."
  },
  {
    role: "user", 
    content: `Current State Machine:
- Current State: ${session.stateMachine.currentState}
- Previous State: ${session.stateMachine.previousState || 'None'}
- Pending Grading: ${session.stateMachine.currentState === 'assessment_submitted'}
${session.stateMachine.currentState === 'welcome' && session.currentConcept ? '- Note: This is the first concept after welcome' : ''}

Current Learning State:
- Course Topic: ${$json.courseTopic}
- Current Concept: ${session.currentConcept?.title || 'None'}
- Concept Summary: ${session.currentConcept?.summary || 'N/A'}
- Tools Already Used: ${session.currentConceptTools.join(', ') || 'None'}
- Last Assessment Score: ${session.lastAssessmentScore || 'N/A'}/5
- Knowledge Gaps: ${session.knowledgeGaps?.join(', ') || 'None'}
- Gap Attempts: ${JSON.stringify(session.gapAttempts || {})}
- Recent Questions: ${session.recentQuestions?.join('; ') || 'None'}
- Completed Concepts: ${session.completedConcepts.length}
- Remaining Core Concepts: ${session.remainingCoreConcepts.length}

PROMPT EXERCISE DECISION RULES:
${!session.currentConceptTools.includes('prompt_exercise') ? `
- Current concept title: "${session.currentConcept?.title}"
- Has prompt task defined: ${session.currentConcept?.shouldHavePromptTask ? 'Yes' : 'No'}

Should we use prompt_exercise tool? Consider:
1. Is the concept about prompting, prompt engineering, or AI interaction?
   - Look for keywords: "prompt", "AI", "GPT", "LLM", "query", "instruction"
   - Check if title contains: "${session.currentConcept?.title}"
   
2. Has the learner already shown good understanding?
   - Last assessment score: ${session.lastAssessmentScore || 'N/A'}
   - If score >= 4 AND concept relates to prompting → prompt_exercise
   
3. Is practical application important for this concept?
   - If the concept teaches a skill that requires practice → consider prompt_exercise
   
4. Tool progression logic:
   - If only concept_card used → usually go to assessment
   - If assessment score is high AND concept is prompt-related → prompt_exercise
   - If assessment score is low → consider insert_concept instead
` : 'Prompt exercise already used for this concept'}

${$json.learnerInput?.note ? `
IMPORTANT - LEARNER NOTE ANALYSIS REQUIRED:
The learner just submitted this note/question with their input:
"${$json.learnerInput.note}"

Current Concept Being Studied: ${session.currentConcept?.title}
Concept Summary: ${session.currentConcept?.summary || 'N/A'}

Analyze this note carefully to determine:
1. Is the learner confused or asking for clarification? 
   - Look for: question marks, words like "confused", "don't understand", "unclear", "help"
   - If yes → strongly consider insert_concept to address the confusion

2. Is the learner showing understanding and ready to move on?
   - Look for: "I get it", "makes sense", "understood", "ready"
   - If yes → proceed to assessment

3. Is the learner making connections or showing deeper thinking?
   - Look for: relating to their role/experience, asking advanced questions, making analogies
   - If yes AND prior assessment scores are high → consider prompt_exercise

4. Does the note reveal specific knowledge gaps?
   - Look for: misconceptions, incorrect assumptions, missing foundational knowledge
   - If yes → insert_concept with specific focus on the gap

5. Is the learner asking for examples or application to their role?
   - Look for: "example", "how does this apply", "in practice", "for ${$json.learnerProfile?.role}"
   - If yes → insert_concept with practical examples
` : ''}

${session.pendingAssessment ? `
PENDING ASSESSMENT:
- Answer submitted: "${session.pendingAssessment.answer}"
- Note submitted: "${session.pendingAssessment.note}"
- Question was: "${session.pendingAssessment.question}"

You must decide whether to:
1. Grade the assessment (nextAction: "grade_assessment")
2. Skip grading and move to something else based on the note content
` : ''}

${session.pendingPromptEvaluation ? `
PENDING PROMPT EVALUATION:
- Prompt submitted: "${session.pendingPromptEvaluation.prompt}"
- Note submitted: "${session.pendingPromptEvaluation.note || 'None'}"
- Task was: "${session.pendingPromptEvaluation.task}"

You must decide whether to:
1. Evaluate the prompt (nextAction: "evaluate_prompt")
2. Skip evaluation and do something else based on the note content

Decision Rules for Prompt Exercise with Notes:
1. If learner shows confusion or asks for help with prompting:
   - Set skipEvaluation: true
   - Set nextAction: "insert_concept" with focus on prompt engineering
2. If learner wants to skip or says they understand:
   - Set skipEvaluation: true
   - Set nextAction: "concept_complete"
3. If learner asks for feedback despite note:
   - Set nextAction: "evaluate_prompt" (they want the evaluation)
4. Otherwise, proceed with evaluation:
   - Set nextAction: "evaluate_prompt"
` : ''}

Decision Rules:
1. Always start new concepts with concept_card
2. After concept_card, if concept is prompt-related (title contains "prompt", "AI", "engineering") AND no assessment yet → consider prompt_exercise before assessment
3. If learner explicitly asks to skip (e.g., "skip this", "I know this", "move on"):
   - Set skipGrading: true (if assessment pending)
   - Set skipEvaluation: true (if prompt evaluation pending)
   - Set markAsComplete: true with completionType: "skipped"
   - Set nextAction: "concept_complete"
4. If learner shows severe confusion and has pending assessment/prompt:
   - Set skipGrading/skipEvaluation: true (evaluation won't help)
   - Set nextAction: "insert_concept" to address confusion
5. Normal progression for NON-prompt concepts:
   - concept_card → assessment → (if score low: insert_concept, if high: concept_complete)
6. Normal progression for PROMPT-RELATED concepts:
   - concept_card → assessment → (if score >= 3: prompt_exercise) → concept_complete

${$json.learnerInput?.note ? 'IMPORTANT: The learner note should heavily influence your decision. Prioritize addressing their specific question or concern.' : ''}

Return JSON:
{
  "nextAction": "grade_assessment|evaluate_prompt|concept_card|assessment|prompt_exercise|concept_complete|insert_concept",
  "reasoning": "Brief explanation of decision",
  "skipGrading": true|false (only if assessment is pending),
  "skipEvaluation": true|false (only if prompt evaluation is pending),
  "markAsComplete": true|false (if learner wants to skip),
  "completionType": "normal|skipped" (if markAsComplete is true),
  "skipReason": "reason for skipping if applicable",
  "exerciseFocus": "specific focus for prompt exercise if choosing that tool",
  "conceptNeeded": {
    "reason": "specific gap to address if action is insert_concept",
    "focus": "topic area for new concept if inserting"
  },
  "noteAnalysis": {
    "understanding": "low|medium|high",
    "needsClarification": true|false,
    "wantsToSkip": true|false,
    "specificRequest": "what they are asking for if clear",
    "sentiment": "confused|curious|confident|frustrated|dismissive"
  }
}`
  }
];

return {
  messages,
  model: "gpt-4o",
  temperature: 0.3,
  max_tokens: 500,
  response_format: { type: "json_object" },
  // Pass through original data WITHOUT sessionState
  originalData: {
    sessionId: $json.sessionId,
    action: $json.action,
    learnerInput: $json.learnerInput,
    courseTopic: $json.courseTopic,
    learnerProfile: $json.learnerProfile,
    coreConcepts: $json.coreConcepts,
    userName: $json.userName,
    currentConcept: session.currentConcept, // Include current concept for reference
    stateMachine: {
      currentState: session.stateMachine.currentState // Only pass minimal state info
    }
  }
};