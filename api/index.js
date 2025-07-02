// A standard Vercel serverless function, without Express.
module.exports = (req, res) => {
  // --- Manual CORS Handling ---
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- Handle OPTIONS preflight request ---
  if (req.method === 'OPTIONS') {
    // Preflight request is successful, send 204 No Content
    return res.status(204).end();
  }

  // --- Manual Routing ---
  // We expect a POST request to the '/generate-note' endpoint.
  // Vercel routes `/api/generate-note` to this file, and the path becomes `/generate-note`.
  if (req.method === 'POST' && req.url === '/generate-note') {
    // For now, just return the test JSON object.
    res.status(200).json({
      note: "Success! The serverless function was reached.",
      question: "This confirms the issue was with the Express wrapper."
    });
    return;
  }
  
  // --- Default Response for any other request ---
  res.status(404).send('Not Found');
};
