function showNotesPopup(info, tab) {
  const selectionText = info.selectionText;
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      const result = await chrome.tabs.sendMessage(tabs[0].id, {
        type: "addNote",
        title: selectionText,
        pageUrl: info.pageUrl,
      });
    }
  );
}

// Handling context menu selection
chrome.contextMenus.onClicked.addListener(showNotesPopup);

// Adding context menu
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    contexts: ["selection"],
    title: "Add Note",
    id: "0",
  });
});
