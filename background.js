// VoiceBridge Background Service Worker
// Opens the app in a full tab (required for microphone access in Chrome extensions)

chrome.action.onClicked.addListener(() => {
  // Check if a VoiceBridge tab is already open
  chrome.tabs.query({ url: chrome.runtime.getURL('popup.html') }, (tabs) => {
    if (tabs.length > 0) {
      // Focus existing tab
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Open new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html'),
        active: true
      });
    }
  });
});
