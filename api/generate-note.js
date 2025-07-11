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
      const prompt = `You are an expert academic note-taker. Your primary function is to transform a user's raw highlight into a comprehensive, standalone note that is perfect for studying.\n\n**Provided Information:**\n- **Overall Topic/Chapter:** ${topic}\n- **User's Specific Highlight:** "${highlightedText}"\n${surroundingText ? `- **Full Text from Page:**\n"""\n${surroundingText}\n"""` : ''}\n\n**Your Critical Task:**\nThe user's highlight is just a pointer to an important concept on the page. It is NOT the final note. Your task is to synthesize a high-quality, educational note by doing the following:\n1.  **Identify the Core Concept:** Read the **User's Specific Highlight**.\n2.  **Gather Context:** Scan the **Full Text from Page** to find definitions, explanations, or related ideas that give the highlight its full meaning. For example, if the user highlights a term, find its definition in the surrounding text. If they highlight an effect, find the cause.\n3.  **Synthesize the Note:** Combine the core concept from the highlight with the essential context you gathered. The final note MUST be self-contained and understandable without referring back to the original document. It should be 2-3 sentences long. **Crucially, do not just rephrase the highlight.** Integrate information from the surrounding text to make it a complete thought.\n4.  **Create a Recall Question:** Based on your synthesized note, formulate a question that would test a student's understanding of the complete concept.\n\n**Output Format:**\nRespond with a single, valid JSON object with two keys: "note" and "question".`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```json\n?|\n?```/g, '');
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
