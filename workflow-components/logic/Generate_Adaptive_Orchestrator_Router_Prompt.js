// Node: Generate Adaptive Orchestrator Router Prompt
// Node ID: 09b3fb2e-a46c-4a40-aab2-af9903280fe0

// Simplified Generate Adaptive Orchestrator Router Prompt
// This focuses on learner notes and pedagogical overrides

// Get session from the input JSON
const sessionId = $json.sessionId;
const session = $getWorkflowStaticData('global').sessions[sessionId];

if (!session) {
  throw new Error(`Session ${sessionId} not found in global state`);
}

const messages = [
  {
    role: "system",
    content: `You are an adaptive learning orchestrator that adds INTELLIGENCE to the learning flow. The Core Orchestrator has already determined the DEFAULT next action based on standard progression rules. Your job is to:

1. PRIORITIZE learner notes and questions - this is where you add the most value
2. Override the default ONLY when there's a strong pedagogical reason
3. Insert remedial concepts when knowledge gaps are detected
4. Skip content when learners demonstrate mastery or explicitly request it

You are the "human touch" that makes the system adaptive and responsive to individual needs.`
  },
  {
    role: "user", 
    content: `📋 DEFAULT NEXT ACTION (from Core Orchestrator):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action: "${$json.defaultNextAction?.action}"
Reason: "${$json.defaultNextAction?.reason}"
${$json.defaultNextAction?.isRequired ? '⚠️ This is a REQUIRED step in the flow' : ''}
${$json.defaultNextAction?.isOptional ? 'ℹ️ This is optional and can be skipped' : ''}
${$json.defaultNextAction?.suggestRemediation ? '💡 Low score - consider remediation' : ''}

📊 CURRENT CONTEXT:
━━━━━━━━━━━━━━━
- Current Concept: ${session.currentConcept?.title || 'None'}
- Tools Completed: [${$json.orchestratorContext.currentProgress.toolsCompleted.join(', ')}]
- Assessment Score: ${$json.orchestratorContext.currentProgress.assessmentScore || 'Not assessed yet'}
- Knowledge Gaps: ${$json.orchestratorContext.learnerContext.knowledgeGaps?.join(', ') || 'None identified'}
- Knowledge Strengths: ${$json.orchestratorContext.learnerContext.knowledgeStrengths?.join(', ') || 'None identified'}

${$json.orchestratorContext.learnerContext.hasNote ? `
🎯 LEARNER NOTE (HIGHEST PRIORITY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${$json.orchestratorContext.learnerContext.noteContent}"

ANALYZE THIS NOTE FOR:
1. 🤔 Confusion/Questions → Consider insert_concept to clarify
2. 🎓 Mastery signals ("I know this", "too easy") → Consider skipping
3. 🔄 Requests ("show example", "more practice") → Address directly
4. 😕 Frustration → Slow down, provide support
5. 💡 Connections to their role → Enhance with examples
6. ⏭️ Skip requests → Honor them (set markAsComplete: true)

Recent questions from learner: ${$json.orchestratorContext.learnerContext.recentQuestions?.join('; ') || 'None'}
` : ''}

🤖 YOUR DECISION FRAMEWORK:
━━━━━━━━━━━━━━━━━━━━━━━

WHEN TO OVERRIDE THE DEFAULT:
1. ✅ Learner note indicates confusion → insert_concept
2. ✅ Learner demonstrates mastery → skip to concept_complete  
3. ✅ Knowledge gaps + low score → insert_concept for remediation
4. ✅ Explicit skip request → concept_complete with skip flags
5. ✅ Request for examples/practice → insert_concept with specific focus

WHEN TO KEEP THE DEFAULT:
1. ✅ No learner note AND standard progression makes sense
2. ✅ Default is a required step (like assessment after concept_card)
3. ✅ Learner is progressing normally without issues

${session.pendingAssessment ? `
📝 PENDING ASSESSMENT DECISION:
- Answer: "${session.pendingAssessment.answer}"
- Note: "${session.pendingAssessment.note}"
- Default would be: grade_assessment

Should we grade this or skip based on the note?
` : ''}

${session.pendingPromptEvaluation ? `
💡 PENDING PROMPT EVALUATION:
- Prompt: "${session.pendingPromptEvaluation.prompt}"
- Note: "${session.pendingPromptEvaluation.note || 'None'}"
- Default would be: evaluate_prompt

Should we evaluate this or skip based on the note?
` : ''}

REMEMBER: You add value by being responsive to the learner's individual needs. The default action is just a suggestion - override it when the learner would benefit from a different path.

Return JSON with EXACTLY this format:
{
  "nextAction": "grade_assessment|evaluate_prompt|concept_card|assessment|prompt_exercise|concept_complete|insert_concept",
  "reasoning": "Brief explanation of decision (mention if following default or overriding)",
  "followingDefault": true|false,
  "overrideReason": "Only if followingDefault is false, explain the pedagogical reason",
  
  // ONLY include these if applicable:
  "skipGrading": true|false, // Only if assessment is pending and should be skipped
  "skipEvaluation": true|false, // Only if prompt evaluation is pending and should be skipped
  "markAsComplete": true|false, // Only if learner wants to skip the concept
  "completionType": "normal|skipped", // Only if markAsComplete is true
  "skipReason": "reason for skipping", // Only if skipping something
  
  // Only if nextAction is "prompt_exercise":
  "exerciseFocus": "specific focus for the prompt exercise",
  
  // Only if nextAction is "insert_concept":
  "conceptNeeded": {
    "reason": "specific gap or confusion to address",
    "focus": "topic area for the new concept"
  },
  
  // Always include note analysis if there was a learner note:
  "noteAnalysis": {
    "understanding": "low|medium|high",
    "needsClarification": true|false,
    "wantsToSkip": true|false,
    "specificRequest": "what they're asking for if clear",
    "sentiment": "confused|curious|confident|frustrated|dismissive"
  }
}

EXAMPLES:

1. Following default (no issues):
{
  "nextAction": "assessment",
  "reasoning": "Following default progression - assessment comes after concept card",
  "followingDefault": true
}

2. Overriding due to confusion:
{
  "nextAction": "insert_concept",
  "reasoning": "Overriding default (assessment) because learner expressed confusion about AI tool categories",
  "followingDefault": false,
  "overrideReason": "Learner needs clarification before assessment would be meaningful",
  "conceptNeeded": {
    "reason": "Learner confused about difference between chat-based vs integrated AI tools",
    "focus": "AI tool categories and use cases"
  },
  "noteAnalysis": {
    "understanding": "low",
    "needsClarification": true,
    "wantsToSkip": false,
    "specificRequest": "wants examples of different AI tool types",
    "sentiment": "confused"
  }
}

3. Honoring skip request:
{
  "nextAction": "concept_complete",
  "reasoning": "Learner indicates they already know this material well",
  "followingDefault": false,
  "overrideReason": "Learner demonstrates existing mastery",
  "markAsComplete": true,
  "completionType": "skipped",
  "skipReason": "Learner already familiar with concept",
  "noteAnalysis": {
    "understanding": "high",
    "needsClarification": false,
    "wantsToSkip": true,
    "specificRequest": "skip to next topic",
    "sentiment": "confident"
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
  // Pass through original data
  originalData: {
    sessionId: $json.sessionId,
    action: $json.action,
    learnerInput: $json.learnerInput,
    courseTopic: $json.courseTopic,
    learnerProfile: $json.learnerProfile,
    coreConcepts: $json.coreConcepts,
    userName: $json.userName,
    currentConcept: session.currentConcept,
    defaultNextAction: $json.defaultNextAction,
    orchestratorContext: $json.orchestratorContext,
    stateMachine: {
      currentState: session.stateMachine.currentState
    }
  }
};