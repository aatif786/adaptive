# Adaptive Instructor Workflow Map

## Main Flow Structure

```
[Main Webhook] --> [Session State Manager] --> [Init Course Data]
                                                     |
                                                     v
                                            [Core Orchestrator]
                                                     |
                    +--------------------------------+--------------------------------+
                    |                                |                                |
                    v                                v                                v
            [Route by Tool Type]          [Adaptive Orchestrator]           [Direct Actions]
                    |                                |                                |
        +-----------+-----------+                    |                    +-----------+-----------+
        |           |           |                    |                    |           |           |
        v           v           v                    v                    v           v           v
  [Welcome]   [Concept]   [Assessment]     [Complex Decisions]    [Start]    [Complete]   [Next]
              [Card]       [Prompt Ex]                           [Concept]

```

## Key Components

### 1. **Entry Points**
- `Main Webhook` - Receives all requests from frontend
- `Manual Trigger` - For testing individual components

### 2. **State Management**
- `Session State Manager` - Central state storage/retrieval
- `Init Course Data` - Loads course content and concepts

### 3. **Orchestration Layer**
- `Core Orchestrator` - Handles simple routing and state transitions
- `Adaptive Orchestrator Router` - Makes AI-driven decisions for complex cases
- `Process Adaptive Orchestrator Decision` - Executes AI decisions

### 4. **Tool Handlers** (Main learning components)
- `Welcome Message Handler` - Initial greeting
- `Concept Card Handler` - Displays learning concepts
- `Assessment Handler` - Manages Q&A assessments
- `Prompt Exercise Handler` - AI prompt practice

### 5. **Grading & Evaluation**
- `Generate Assessment Grading Prompt` - Prepares grading request
- `Process Grading` - Analyzes answers and identifies gaps
- `Generate Evaluate Prompt Exercise Prompt` - Prepares prompt evaluation
- `Process Prompt Evaluation` - Evaluates prompt quality

### 6. **Adaptive Features**
- `Generate New Concept Prompt` - Creates dynamic concepts for gaps
- `Insert Concept Handler` - Adds new concepts to queue
- `Smart Reply Generator` - Generates contextual quick responses

### 7. **Transitions**
- `Complete Concept Handler` - Marks concepts complete
- `Course Completion` - Final summary and statistics

## Data Flow

1. **Request arrives** at webhook with:
   - sessionId
   - action (start, next, submit_response)
   - learnerInput

2. **State is loaded** from Session State Manager

3. **Core Orchestrator decides**:
   - Simple action? → Direct handler
   - Complex decision? → Adaptive Orchestrator
   - Tool display? → Appropriate tool handler

4. **Tool handlers**:
   - Prepare display data
   - Wait for input if needed
   - Process responses
   - Update state

5. **Response flows back** through:
   - Smart Reply Generator (adds quick responses)
   - Response formatting
   - Webhook response

## Key Decision Points

1. **After Concept Card**: 
   - Note/question? → Analyze for gaps
   - Continue? → Next tool (usually assessment)

2. **After Assessment**:
   - Score < 3? → Consider remediation
   - Gaps identified? → Queue dynamic concept
   - Otherwise → Continue to next

3. **After Prompt Exercise**:
   - Low score? → Provide detailed feedback
   - Success? → Move to next concept

4. **Concept Completion**:
   - More concepts? → Continue
   - All done? → Course completion

## State Variables

- `currentConcept` - Active concept object
- `currentTool` - Active tool (concept_card, assessment, etc.)
- `conceptQueue` - Ordered list of remaining concepts
- `completedConcepts` - History of completed work
- `knowledgeGaps` - Identified learning gaps
- `waitingForInput` - Boolean for input state
- `inputType` - Expected input (answer, prompt, note)