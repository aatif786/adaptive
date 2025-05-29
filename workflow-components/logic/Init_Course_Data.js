// Node: Init Course Data
// Node ID: f9cfaed0-e502-45ff-bc3a-97e4063b74bc

// Extract webhook data from the first item in the array
const webhookData = $input.first().json.body;

// Add course data
return {
  sessionId: webhookData.sessionId,
  userName: webhookData.userName,
  action: webhookData.action,
  learnerInput: webhookData.learnerInput,
  courseTopic: "How to Become an AI Native Product Manager",
  learnerProfile: {
    role: "Product Manager",
    company: "TechCorp",
    skills: ["Agile", "User Research", "Basic Python"]
  },
  "coreConcepts": [
    {
      "id": 1,
      "title": "Prompt Engineering Essentials",
      "summary": "Prompt engineering is the skill of writing clear, structured inputs that guide AI tools to produce high-quality, relevant outputs. It’s not just about asking a question—it’s about communicating with precision, providing context, and defining the role, tone, or format you want. This module helps project managers master this foundational skill so they can make AI tools like ChatGPT work for them across a range of tasks. Good prompting starts by defining the outcome: Are you asking for a summary, a message, a task list, or a risk forecast? Then, you refine the input by adding necessary context—what project, what audience, what constraints. Including tone, format (like bullet points or CSV), and role (e.g., 'you are a project coordinator') helps tailor results. This level of clarity minimizes ambiguity and reduces the need for follow-up corrections. Learners will also explore techniques like using delimiters for structured inputs, applying personas, and iterating based on AI outputs. The goal is to reduce guesswork and enable precise, repeatable results—whether drafting communications, outlining plans, or analyzing decisions. Prompting is a superpower for modern PMs: it lets you turn AI into a strategic assistant. This skill transforms vague requests into clear, actionable outputs that can immediately feed into your project tools and workflows.",
      "expertTips": [
        "Use personas to shift tone and tailor responses.",
        "Split complex tasks into subtasks to avoid token limit issues and improve output quality.",
        "Use triple quotes or backticks to clearly delimit long context or code."
      ],
      "assessmentQuestion": "What is the most important technique to apply when writing a prompt to ChatGPT for best results?",
      "correctAnswer": "Include detailed instructions and context for the task",
      "shouldHavePromptTask": true
    },
        {
      "id": 2,
      "title": "Project Management AI Foundations",
      "summary": "To unlock AI’s full potential as a project manager, you need to understand where and how it integrates into the project lifecycle. AI tools are particularly strong at augmenting core PM activities such as scheduling, forecasting, risk identification, stakeholder communication, and report generation. This module introduces foundational AI use cases across project stages and helps learners map tools to workflows. For example, task decomposition and milestone creation can be accelerated by tools like ChatGPT when paired with a strong prompt. Risk modeling can benefit from AI simulations that explore different 'what-if' scenarios. Communication updates and meeting summaries can be generated more efficiently, freeing PMs to focus on strategy. Learners will gain clarity on the difference between automation (repetitive task execution) and augmentation (strategic insight generation), and how AI supports each. AI foundations also include an understanding of tool categories—chat-based assistants, integrated copilots in platforms like Microsoft Teams or Notion, and no-code AI builders. Once you understand where these tools fit, you can begin evaluating your own workflows for inefficiencies and AI opportunities. This knowledge also helps PMs articulate the ROI of AI to stakeholders—making it easier to champion new tools within the organization.",
      "expertTips": [
        "Ask ChatGPT to ask you questions when you're missing context.",
        "Enable custom instructions for faster, context-aware prompt responses across recurring tasks."
      ],
      "assessmentQuestion": "Which of the following is the best example of using AI to augment project management activities?",
      "correctAnswer": "Using ChatGPT to identify risks in a draft project plan and summarize key concerns",
      "shouldHavePromptTask": true
    },
    {
      "id": 3,
      "title": "Smarter Planning with AI",
      "summary": "AI excels at turning goals into structured plans—when guided correctly. In this module, learners will explore how to use AI to generate project roadmaps, create task hierarchies, define dependencies, and sequence milestones. Planning with AI begins by inputting a clear objective or deliverable and adding constraints like deadlines, resources, or blockers. The AI can then propose a draft plan, which the project manager reviews and refines. The real power lies in iteration—adjusting prompts to tweak scope, task order, or effort level. AI also supports reverse planning, where you start from a fixed deadline and ask it to work backwards. Project managers will also learn how to test and validate AI-generated plans: Does the dependency order make sense? Are key milestones too dense or too sparse? Is effort distribution realistic? Learners will practice identifying flaws and giving corrective instructions, reinforcing that AI is a collaborator, not a replacement. The module encourages hands-on testing with tools like ChatGPT or Copilot embedded in planning tools. Learners who complete this module will be able to use AI to jumpstart planning sessions, unblock ambiguity, and refine their timelines with greater speed and clarity.",
      "expertTips": [],
      "assessmentQuestion": "When reviewing an AI-generated project plan, what is a good follow-up action?",
      "correctAnswer": "Check for inaccurate task dependencies and revise the prompt to fix the logic",
      "shouldHavePromptTask": true
    }
  ]
};