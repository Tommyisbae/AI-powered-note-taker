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
              details: "Read through all the notes (which may be from highlights or custom user input) to identify core themes and topics. Group related notes together logically."
            },
            {
              step: 2,
              action: "Synthesize and Refine Main Body",
              details: "Merge the information from related notes to create a structured explanation of the concepts. Eliminate redundancies and resolve discrepancies. The goal is a logical, easy-to-follow narrative."
            },
            {
              step: 3,
              action: "Handle Out-of-Context Notes",
              details: "During synthesis, if you encounter any notes that are completely unrelated to the main topics or cannot be logically integrated into the main structure, set them aside."
            },
            {
              step: 4,
              action: "Structure and Format",
              details: "Organize the synthesized information into a clear, hierarchical document using Markdown. After the main body, if you have set aside any out-of-context notes, create a final section titled '## Miscellaneous Notes' and list them there as bullet points."
            }
          ]
        },
        input_data: {
          document_title: title,
          notes: notes // This is an array of strings
        },
        output_specification: {
          format: "A single string containing the complete, formatted Markdown document.",
          schema: {
            title: "# Notes on: [document_title]",
            headings: "Use '##' for main topics and '###' for sub-topics.",
            content: "Use bullet points ('*') or numbered lists for clarity.",
            key_terms: "Use bold ('**') to highlight key terms.",
            miscellaneous_section: "If needed, create a final '## Miscellaneous Notes' section for unrelated jottings.",
            style: "The final output should be a clean, readable study guide. Do not include any questions or conversational preamble."
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
