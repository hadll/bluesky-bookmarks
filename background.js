chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_DATA') {
      fetch(request.url, {
        method: 'GET',
        headers: request.headers
      })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
    }
  });
  