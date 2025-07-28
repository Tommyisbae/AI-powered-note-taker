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

      const prompt = JSON.stringify({
        persona: "You are an expert academic note-synthesizer. Your primary function is to transform a collection of raw, individual notes from a PDF into a single, coherent, and well-structured study guide.",
        task_definition: {
          objective: "Synthesize the provided list of notes into a high-quality study guide formatted in Markdown.",
          steps: [
            {
              step: 1,
              action: "Analyze and Group",
              details: "Read through all the notes to identify core themes, topics, and sub-topics. Group related notes together logically."
            },
            {
              step: 2,
              action: "Synthesize and Refine",
              details: "Merge the information from related notes. It is critical to eliminate redundant information and resolve any minor discrepancies. The goal is to create a narrative or a structured explanation of the concepts, not just a list of the original notes. Ensure the flow of information is logical and easy to follow."
            },
            {
              step: 3,
              action: "Structure and Format",
              details: "Organize the synthesized information into a clear, hierarchical document using Markdown."
            }
          ]
        },
        input_data: {
          document_title: title,
          notes: notes // This will now be an array of strings
        },
        output_specification: {
          format: "A single string containing the complete, formatted Markdown document.",
          schema: {
            title: "# Notes on: [document_title]",
            headings: "Use '##' for main topics and '###' for sub-topics.",
            content: "Use bullet points ('*') or numbered lists for clarity.",
            key_terms: "Use bold ('**') to highlight key terms.",
            style: "The final output should be a clean, readable, and useful study guide, like a well-organized set of jottings perfect for revision. Do not include any questions or conversational preamble."
          }
        }
      });

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
