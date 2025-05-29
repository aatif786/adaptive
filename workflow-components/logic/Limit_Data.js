// Node: Limit Data
// Node ID: ddb6f37f-de10-4755-bcb2-322171d87022

// Extract Response Data
const responseData = $json.responseData;

if (!responseData) {
  throw new Error('No responseData found in input');
}

return responseData;