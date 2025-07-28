document.addEventListener('DOMContentLoaded', () => {
  const notesList = document.getElementById('notes-list');
  const pdfTitleElement = document.getElementById('pdf-title');
  const clearButton = document.getElementById('clear-notes');
  const saveButton = document.getElementById('save-notes');
  const statusMessage = document.getElementById('status-message');
  let currentPdfId = null;

  // Get the current PDF's ID from the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'get_pdf_id' }, (response) => {
      if (response && response.pdfId) {
        currentPdfId = response.pdfId;
        pdfTitleElement.textContent = `Notes for: ${currentPdfId}`;
        loadNotes();
      }
    });
  });

  function createNoteElement(note, index) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.index = index;
    li.innerHTML = `
      <button class="delete-note" title="Delete Note">&times;</button>
      <strong>Page ${note.pageNumber}:</strong> ${note.note}
    `;
    return li;
  }

  function loadNotes() {
    if (!currentPdfId) return;

    chrome.storage.local.get({ allNotes: {} }, (result) => {
      const notes = result.allNotes[currentPdfId] || [];
      notesList.innerHTML = '';
      if (notes.length === 0) {
        notesList.innerHTML = '<li class="empty-message">No notes yet. Highlight some text to get started!</li>';
      } else {
        notes.forEach((note, index) => {
          notesList.appendChild(createNoteElement(note, index));
        });
      }
    });
  }

  // Listen for messages from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generation_started') {
      statusMessage.textContent = 'Generating note...';
      statusMessage.style.display = 'block';
    } else if (request.action === 'note_added') {
      statusMessage.style.display = 'none';
      loadNotes();
    } else if (request.action === 'generation_failed') {
      statusMessage.textContent = 'Failed to generate note.';
      statusMessage.style.display = 'block';
    }
  });

  // Event delegation for deleting a single note
  notesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-note')) {
      const noteIndex = parseInt(e.target.closest('.note-item').dataset.index, 10);
      chrome.storage.local.get({ allNotes: {} }, (result) => {
        const allNotes = result.allNotes;
        allNotes[currentPdfId].splice(noteIndex, 1);
        chrome.storage.local.set({ allNotes: allNotes }, loadNotes);
      });
    } else if (e.target.classList.contains('toggle-answer')) {
      const answer = e.target.nextElementSibling;
      const isHidden = answer.style.display === 'none';
      answer.style.display = isHidden ? 'block' : 'none';
      e.target.textContent = isHidden ? 'Hide Answer' : 'Show Answer';
    }
  });

  // Clear all notes for the current PDF
  clearButton.addEventListener('click', () => {
    if (currentPdfId) {
      chrome.storage.local.get({ allNotes: {} }, (result) => {
        const allNotes = result.allNotes;
        delete allNotes[currentPdfId];
        chrome.storage.local.set({ allNotes: allNotes }, loadNotes);
      });
    }
  });

  // Send notes to the background script to be formatted and downloaded
  saveButton.addEventListener('click', () => {
    if (currentPdfId) {
      chrome.storage.local.get({ allNotes: {} }, (result) => {
        const notes = result.allNotes[currentPdfId] || [];
        if (notes.length === 0) {
          statusMessage.textContent = 'No notes to format.';
          statusMessage.style.display = 'block';
          setTimeout(() => { statusMessage.style.display = 'none'; }, 3000);
          return;
        }

        // Send the notes and title to the background script
        chrome.runtime.sendMessage({
          action: 'download_notes',
          notes: notes,
          title: currentPdfId
        });

        statusMessage.textContent = 'Formatting will continue in the background...';
        statusMessage.style.display = 'block';
        setTimeout(() => { window.close(); }, 2000); // Close the popup after a short delay
      });
    }
  });
});
