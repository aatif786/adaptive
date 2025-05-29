// Node: Process Smart Replies
// Node ID: 74959534-a145-472e-99b2-51199699ffe2

// Process Smart Replies - Add generated replies to response
const smartReplies = JSON.parse($json.choices[0].message.content);

// Get data from the pipeline (from Smart Reply Generator AI Call)
const originalData = $('Smart Reply Generator Prompt').first().json.originalData;

// Add smart replies to the response
const enhancedResponse = {
  ...originalData,
  responseData: {
    ...originalData.responseData,
    toolData: {
      ...originalData.responseData.toolData,
      smartReplies: Array.isArray(smartReplies) ? smartReplies : Object.values(smartReplies)
    }
  }
};

return enhancedResponse;