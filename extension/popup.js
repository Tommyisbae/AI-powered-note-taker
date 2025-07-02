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

  // Save notes for the current PDF to a text file
  saveButton.addEventListener('click', () => {
    if (currentPdfId) {
      chrome.storage.local.get({ allNotes: {} }, (result) => {
        const notes = result.allNotes[currentPdfId] || [];
        if (notes.length === 0) {
          console.log('No notes to save.');
          return;
        }

        let noteContent = `Notes for: ${currentPdfId}\n\n`;
        notes.forEach(note => {
          noteContent += `Page ${note.pageNumber}: ${note.note}\n\n`;
        });

        console.log('Generated file content:', noteContent);

        const blob = new Blob([noteContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
          url: url,
          filename: `${currentPdfId.replace(/[^a-z0-9]/gi, '_')}_notes.txt`
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Save failed:', chrome.runtime.lastError.message);
          } else {
            console.log('Save successful. Download ID:', downloadId);
          }
        });
      });
    }
  });
});
