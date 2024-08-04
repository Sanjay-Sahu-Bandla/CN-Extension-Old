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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const clientId = "329445730941-sm31dtumbmfrfs0f03iqv4gd2bcajhh5";
  if (request.type === "authenticate") {
    chrome.identity.launchWebAuthFlow(
      {
        url: `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}.apps.googleusercontent.com&response_type=token&redirect_uri=https://${chrome.runtime.id}.chromiumapp.org/callback&scope=https://www.googleapis.com/auth/userinfo.email`,
        interactive: true,
      },
      function (redirect_url) {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError });
        } else {
          const token = redirect_url.match(/[#&]access_token=([^&]*)/)[1];

          fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
            headers: {
              Authorization: "Bearer " + token,
            },
          })
            .then((response) => response.json())
            .then((userInfo) => {
              fetch("http://localhost:3000/api/user/login", {
                headers: {
                  "content-type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  id: userInfo.id,
                  email: userInfo.email,
                  firstName: userInfo.name.split(" ")?.[0],
                  lastName: userInfo.name.split(" ")?.[1],
                  photoUrl: userInfo.picture,
                }),
              })
                .then((response) => response.json())
                .then((res) => {
                  chrome.storage.local.set(
                    {
                      isAuthenticated: true,
                      token: token,
                      user: userInfo,
                      accessToken: res.data.accessToken,
                    },
                    () => {
                      sendResponse({ token: token, user: userInfo });
                    }
                  );
                })
                .catch((error) => {
                  sendResponse({ error: error.toString() });
                });
            })
            .catch((error) => {
              sendResponse({ error: error.toString() });
            });
        }
      }
    );
    return true; // Will respond asynchronously.
  }
});
