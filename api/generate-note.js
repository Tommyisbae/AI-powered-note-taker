require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      const { highlightedText, pageNumber, currentTopic, pdfId, surroundingText } = req.body;

      if (!highlightedText || !pageNumber || !pdfId) {
        return res.status(400).send('Missing required fields: highlightedText, pageNumber, or pdfId.');
      }

      const topic = currentTopic || 'General';
      const prompt = JSON.stringify({
        context: {
          persona: "You are an expert academic note-taker.",
          goal: "Your primary function is to transform a user's raw highlight into a comprehensive, standalone note that is perfect for studying. The user's highlight is just a pointer to an important concept on the page, not the final note itself."
        },
        task_definition: {
          steps: [
            {
              step: 1,
              action: "Identify Core Concept",
              details: "Read the 'userHighlight' from the input_data to understand the user's point of interest."
            },
            {
              step: 2,
              action: "Gather Context",
              details: "Scan the 'fullTextFromPage' to find definitions, explanations, or related ideas that give the highlight its full meaning. For example, if the user highlights a term, find its definition. If they highlight an effect, find the cause."
            },
            {
              step: 3,
              action: "Synthesize Note",
              details: "Combine the core concept with the essential context. The final note must be self-contained, 2-3 sentences long, and understandable without the original document. **Crucially, do not just rephrase the highlight.** Integrate information from the surrounding text to make it a complete thought."
            },
            {
              step: 4,
              action: "Create Recall Question",
              details: "Based on your synthesized note, formulate a question that tests a student's understanding of the complete concept."
            }
          ]
        },
        input_data: {
          overallTopic: topic,
          userHighlight: highlightedText,
          fullTextFromPage: surroundingText || "No surrounding text provided."
        },
        output_specification: {
          format: "Respond with a single, valid JSON object.",
          schema: {
            type: "object",
            properties: {
              note: {
                type: "string",
                description: "The synthesized, self-contained note."
              },
              question: {
                type: "string",
                description: "The active recall question based on the note."
              }
            },
            required: ["note", "question"]
          }
        }
      });

      const result = await model.generateContent(prompt);
      // The new SDK simplifies the response structure.
      const cleanedText = result.response.text().replace(/```json\n?|\n?```/g, '');
      const parsedResponse = JSON.parse(cleanedText);

      const noteData = {
        pdfId,
        pageNumber,
        highlightedText,
        note: parsedResponse.note,
        question: parsedResponse.question,
        timestamp: new Date().toISOString()
      };

      res.status(201).send(noteData);

    } catch (error) {
      console.error('Error generating note:', error);
      res.status(500).send('Error generating note.');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
