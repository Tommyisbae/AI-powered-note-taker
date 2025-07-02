// A standard Vercel serverless function.
// The file name `generate-note.js` matches the endpoint `/api/generate-note`.
module.exports = (req, res) => {
  // --- Manual CORS Handling ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- The Actual Function Logic ---
  // We know this is the right file, so we can just send the response.
  res.status(200).json({
    note: "IT WORKED. The issue was file-based routing.",
    question: "Vercel was looking for a file named `generate-note.js`."
  });
};
