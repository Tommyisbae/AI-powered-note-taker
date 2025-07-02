# Smart PDF Notetaker

This project is a Chrome extension that allows users to highlight text in PDF files and receive AI-powered notes. It's designed to make studying and research more efficient by providing context-aware summaries and active recall questions.

## Features

*   **Context-Aware Notes:** The extension sends the highlighted text and the surrounding text to a backend server, which uses a generative AI model to create a comprehensive, self-contained note.
*   **Active Recall Questions:** For each note, the AI also generates a question to help with active recall and deeper understanding of the material.
*   **Local Storage:** Notes are saved to the browser's local storage, so they persist between sessions.
*   **Save and Clear Notes:** Users can save their notes to a text file or clear all notes for a specific PDF.

## Architecture

The project is divided into two main components:

1.  **Chrome Extension (Frontend):**
    *   `manifest.json`: Defines the extension's properties and permissions.
    *   `popup.html`, `popup.css`, `popup.js`: The user interface for displaying notes.
    *   `content_script.js`: Injected into the PDF viewer page to handle text highlighting and communication with the backend.

2.  **Backend Server:**
    *   `index.js`: An Express.js server that handles requests from the Chrome extension.
    *   `package.json`: Lists the project's dependencies.
    *   The server uses the Google Generative AI API to generate notes and questions.

## Setup and Usage

To run this project, you'll need to have Node.js and npm installed.

### Backend

1.  **Navigate to the `server` directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the `server` directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:5000`.

### Frontend (Chrome Extension)

1.  **Open Chrome** and navigate to `chrome://extensions`.
2.  **Enable "Developer mode"** in the top right corner.
3.  **Click "Load unpacked"** and select the `extension` directory.
4.  The extension should now be active. You can open a PDF in the browser (e.g., using the PDF.js viewer) and start highlighting text to generate notes.
