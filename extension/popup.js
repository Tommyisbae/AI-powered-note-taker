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

  // Save notes for the current PDF to a text file
  saveButton.addEventListener('click', async () => {
    if (currentPdfId) {
      // Show some loading state
      statusMessage.textContent = 'Formatting notes...';
      statusMessage.style.display = 'block';
      saveButton.disabled = true;

      chrome.storage.local.get({ allNotes: {} }, async (result) => {
        const notes = result.allNotes[currentPdfId] || [];
        if (notes.length === 0) {
          statusMessage.textContent = 'No notes to format.';
          setTimeout(() => { statusMessage.style.display = 'none'; }, 3000);
          saveButton.disabled = false;
          return;
        }

        try {
          const response = await fetch('https://ai-powered-note-taker.vercel.app/api/generate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: notes, title: currentPdfId }), // send notes and title
          });

          if (response.ok) {
            const formattedNotes = await response.text();
            const blob = new Blob([formattedNotes], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
              url: url,
              filename: `${currentPdfId.replace(/[^a-z0-9]/gi, '_')}_notes.md`
            }, (downloadId) => {
              if (chrome.runtime.lastError) {
                console.error('Save failed:', chrome.runtime.lastError.message);
                statusMessage.textContent = 'Save failed.';
              } else {
                statusMessage.textContent = 'Download complete!';
              }
            });
          } else {
            const errorText = await response.text();
            console.error('Failed to format notes:', errorText);
            statusMessage.textContent = 'Failed to format notes.';
          }
        } catch (error) {
          console.error('Error formatting notes:', error);
          statusMessage.textContent = 'Error formatting notes.';
        } finally {
          saveButton.disabled = false;
          // maybe hide status message after a delay if it's not a success message
          setTimeout(() => {
            if (statusMessage.textContent !== 'Generating note...') { // don't hide if another process is running
                statusMessage.style.display = 'none';
            }
          }, 5000);
        }
      });
    }
  });
});
