let isPopupOpen = false;

// --- Popup Connection Management ---
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    isPopupOpen = true;
    port.onDisconnect.addListener(() => {
      isPopupOpen = false;
    });
  }
});

// --- Main Event Listener for Text Selection ---
document.addEventListener('mouseup', async (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (selectedText) {
    const pageNumberInput = document.getElementById('pageNumber');
    const pageNumber = pageNumberInput ? parseInt(pageNumberInput.value, 10) : null;
    const pdfId = document.title;

    // --- Get Context from the page ---
    let surroundingText = '';
    if (selection.anchorNode) {
      const pageElement = selection.anchorNode.parentElement.closest('.page');
      if (pageElement) {
        const textLayer = pageElement.querySelector('.textLayer');
        if (textLayer) {
          surroundingText = textLayer.innerText;
        }
      }
    }

    if (pageNumber && pdfId) {
      try {
        if (isPopupOpen) chrome.runtime.sendMessage({ action: 'generation_started' });

        const response = await fetch('http://localhost:5000/generate-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            highlightedText: selectedText,
            pageNumber: pageNumber,
            pdfId: pdfId,
            surroundingText: surroundingText, // Pass the context
          }),
        });

        if (response.ok) {
          const newNote = await response.json();
          chrome.storage.local.get({ allNotes: {} }, (result) => {
            const allNotes = result.allNotes;
            if (!allNotes[pdfId]) allNotes[pdfId] = [];
            allNotes[pdfId].push(newNote);
            chrome.storage.local.set({ allNotes: allNotes }, () => {
              if (isPopupOpen) chrome.runtime.sendMessage({ action: 'note_added', note: newNote });
            });
          });
        } else {
          if (isPopupOpen) chrome.runtime.sendMessage({ action: 'generation_failed' });
        }
      } catch (error) {
        if (isPopupOpen) chrome.runtime.sendMessage({ action: 'generation_failed' });
      }
    }
    // Clear the browser's text selection after processing
    window.getSelection().removeAllRanges();
  }
});

// --- Message listener for popup communication ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_pdf_id') {
    sendResponse({ pdfId: document.title });
  }
});