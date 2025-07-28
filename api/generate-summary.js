require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // Using a more powerful model for synthesis

module.exports = async (req, res) => {
  // --- Manual CORS Handling ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Main Logic ---
  if (req.method === 'POST') {
    try {
      const { notes, title } = req.body;

      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return res.status(400).send('Missing or invalid `notes` array.');
      }

      const prompt = `
You are an expert academic note-synthesizer. Your task is to take a collection of individual notes, which were generated from highlights in a PDF document, and transform them into a single, coherent, and well-structured study guide.

**Input:**
You will receive a JSON object containing a 'title' for the document and a 'notes' array. Each object in the array contains a 'note' (a self-contained piece of information) and a 'question' (an active recall prompt for that note).

**Task:**
1.  **Analyze and Group:** Read through all the notes to identify core themes, topics, and sub-topics. Group related notes together.
2.  **Synthesize and Refine:** Merge the information from related notes. Eliminate redundant information and resolve any minor discrepancies. Ensure the flow of information is logical. Do not just list the notes. Create a narrative or a structured explanation of the concepts.
3.  **Structure and Format:** Organize the synthesized information into a clear, hierarchical document using Markdown.
    *   Use the provided 'title' to create a main title for the document (e.g., '# Notes on: [title]').
    *   Use headings ('##') and subheadings ('###') to structure the content by topic.
    *   Use bullet points ('*') or numbered lists to present information clearly.
    *   Use bold ('**') for key terms.
4.  **Integrate Active Recall:** Weave the provided questions into the notes, or create new, more comprehensive questions that encourage active recall of the synthesized topics. Place them strategically within the document to test understanding.
5.  **Output:** Produce a single Markdown string that is a high-quality, readable, and useful study guide. It should feel like a well-organized set of jottings perfect for revision.

**Input Data:**
Title: ${title}
Notes: ${JSON.stringify(notes, null, 2)}

**Output Specification:**
A single string containing the formatted Markdown notes. Start directly with the Markdown, no preamble.
`;

      const result = await model.generateContent(prompt);
      const formattedNotes = result.response.text();

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.status(200).send(formattedNotes);

    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).send('Error generating summary.');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
