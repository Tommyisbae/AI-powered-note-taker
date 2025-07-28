chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_notes') {
    const { notes, title } = request;

    // Map to just the note content, ensuring we don't send extra data
    const notesForSummary = notes.map(note => note.note);

    fetch('https://ai-powered-note-taker.vercel.app/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesForSummary, title: title }),
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error('Failed to format notes: ' + text) });
      }
      return response.text();
    })
    .then(formattedNotes => {
      const blob = new Blob([formattedNotes], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: `${title.replace(/[^a-z0-9]/gi, '_')}_notes.md`
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Smart PDF Notetaker',
            message: 'Failed to save your formatted notes.'
          });
        } else {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Smart PDF Notetaker',
            message: 'Your formatted notes have been downloaded!'
          });
        }
      });
    })
    .catch(error => {
      console.error('Error formatting notes:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Smart PDF Notetaker',
        message: 'An error occurred while formatting your notes.'
      });
    });

    // Indicate that the response will be sent asynchronously.
    return true;
  }
});
