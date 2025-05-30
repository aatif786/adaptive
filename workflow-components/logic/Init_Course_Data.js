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
      "title": "Crafting High-Impact Prompts for Project Plans",
      "summary": "### Scenario\nYou're leading the **launch of an internal employee portal** for a 300-person company. The portal will include HR documents, IT support links, and company announcements. You're working with HR, IT, and Comms teams, and need a **6-week project plan** from an AI assistant.\n\nBut: \n- You have **no extra hiring capacity**\n- The **timeline is fixed**\n- Stakeholders expect a **risk-mitigated, role-assigned plan**\n- The final output must be **clear, presentable, and executive-ready**\n\n### Why Strong Prompting Matters\nAI-generated project plans are only as good as your prompt. If your prompt is vague, you’ll get:\n- Generic tasks\n- No task ownership\n- No risk planning\n- No clear structure\n\nGreat prompts make your AI assistant feel like a seasoned project manager. They reflect real-world constraints, multiple teams, and presentable output formats.\n\n### Techniques You’ll Practice\n| Technique               | What It Looks Like in This Task                           |\n|------------------------|------------------------------------------------------------|\n| **Context Framing**     | \"You are a professional internal project planner...\"       |\n| **Constraint Injection**| \"No new hires; timeline is fixed\"                          |\n| **Decomposition**       | Include HR, IT, and Comms tasks                            |\n| **Structural Instruction**| \"Return the output as a markdown table with columns...\" |\n| **Prompt Iteration**    | Improve prompt until risks, owners, and milestones appear  |",
      "expertTips": [
        "A strong prompt often reads like a well-written project brief—clear, complete, and outcome-driven.",
        "If you can imagine delegating the task to a real teammate, your prompt is probably detailed enough for AI.",
        "Don't just ask what you want—explain how it should be structured and what it should account for.",
        "Use role context (e.g., “You are a professional project planner…”) to shape the AI’s tone and thinking."
      ],
      "assessmentQuestion": "If you want ChatGPT to return a project plan in a table, what should you include in your prompt?",
      "correctAnswer": "Ask it to format the output as a table.",
      "shouldGeneratePromptTask": false,
      "prompt": {
        "task": "### 🧠 Prompt Task:\n\nYou are leading the launch of a new internal employee portal for your 300-person company.  \nThe portal will serve as a central hub for:\n\n- HR policies  \n- IT support links  \n- Company announcements  \n- Employee resource groups  \n\nYou have been asked to:\n\nPrompt an AI assistant to generate a full **6-week project plan** for launching this portal, including:\n\n- Tasks  \n- Owners  \n- Milestones  \n- Risks","context": "You will be working with a cross-functional team from **HR, IT, and Communications**.  \nYou **cannot hire additional help**. The **deadline is fixed**, and executive stakeholders expect a **smooth, polished rollout**.\n\n*You’ll create and refine your prompt until the output is something you’d confidently present to leadership.*",
        "conceptTitle": "Prompt Mastery Scenario: Plan the Launch of a New Internal Employee Portal"
      },
      "promptCriteria": [
        {
          "name": "Context Framing",
          "description": "The prompt frames the AI's role or identity clearly (e.g., 'You are a professional internal project planner').",
          "evaluationHint": "Look for a role or persona assigned to the AI in the prompt."
        },
        {
          "name": "Constraint Injection",
          "description": "The prompt includes real-world constraints (e.g., 'No new hires', 'Timeline is fixed').",
          "evaluationHint": "Look for references to limits on time, resources, scope, or staffing."
        },
        {
          "name": "Decomposition",
          "description": "The prompt specifies the different functions or teams involved (e.g., HR, IT, Comms).",
          "evaluationHint": "Check whether the learner included all relevant stakeholders or workstreams."
        },
        {
          "name": "Structural Instruction",
          "description": "The prompt specifies the desired output format (e.g., 'Return as a markdown table with columns: Week, Task, Owner').",
          "evaluationHint": "Does the prompt explicitly define how the output should be formatted?"
        }
      ]
    },
    {
      "id": 2,
      "title": "Prompt Engineering Essentials",
      "summary": "Prompt engineering is the skill of writing clear, structured inputs that guide AI tools to produce high-quality, relevant outputs. It’s not just about asking a question—it’s about communicating with precision, providing context, and defining the role, tone, or format you want. This module helps project managers master this foundational skill so they can make AI tools like ChatGPT work for them across a range of tasks. Good prompting starts by defining the outcome: Are you asking for a summary, a message, a task list, or a risk forecast? Then, you refine the input by adding necessary context—what project, what audience, what constraints. Including tone, format (like bullet points or CSV), and role (e.g., 'you are a project coordinator') helps tailor results. This level of clarity minimizes ambiguity and reduces the need for follow-up corrections. Learners will also explore techniques like using delimiters for structured inputs, applying personas, and iterating based on AI outputs. The goal is to reduce guesswork and enable precise, repeatable results—whether drafting communications, outlining plans, or analyzing decisions. Prompting is a superpower for modern PMs: it lets you turn AI into a strategic assistant. This skill transforms vague requests into clear, actionable outputs that can immediately feed into your project tools and workflows.",
      "expertTips": [
        "Use personas to shift tone and tailor responses.",
        "Split complex tasks into subtasks to avoid token limit issues and improve output quality.",
        "Use triple quotes or backticks to clearly delimit long context or code."
      ],
      "assessmentQuestion": "What is the most important technique to apply when writing a prompt to ChatGPT for best results?",
      "correctAnswer": "Include detailed instructions and context for the task",
      "shouldGeneratePromptTask": true,
    },
  ]
};