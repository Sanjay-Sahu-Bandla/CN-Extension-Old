// Adding a note & Highlightig notes
chrome.runtime.onMessage.addListener(async function (request) {
  if (request.type === "addNote") {
    const description = prompt(`Notes for ${request.title}`);
    if (!description) return;

    const { accessToken } = await chrome.storage.local.get(["accessToken"]);
    await fetch(`http://localhost:3000/api/notes/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: request.title,
        content: description,
        website: window.location.origin,
        webpageUrl: request.pageUrl,
        labels: [],
      }),
    }).then((res) => res.json());

    highlightNotes();
    addModals();
  }
});

// Highlight notes on page load
setTimeout(async () => {
  await highlightNotes();
}, 0);

// Toggle hovering modal for the notes
const addModals = () => {
  const notesList = document.querySelectorAll(".highlight-note");
  const notesModal = document.getElementById("notes-modal");
  const notesModalHeader = document.querySelector("#modal-header h3");
  const notesModalContent = document.getElementById("modal-content");

  notesList.forEach((notesItem) => {
    notesItem.addEventListener("mouseover", function (event) {
      notesModal.style.top = this.offsetTop + 40 + "px";
      notesModal.style.left = this.offsetLeft + 40 + "px";
      notesModal.style.position = "absolute";
      notesModalHeader.innerText = event.target.innerText;
      notesModalContent.innerHTML = event.target.dataset.tooltip;
      notesModal.style.display = "block";
    });

    notesItem.addEventListener("mouseout", function () {
      const notesModal = document.getElementById("notes-modal");
      notesModal.style.display = "none";
    });
  });
};

const highlightNotes = async () => {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const notesRes = await fetch("http://localhost:3000/api/notes", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json());
  const notesList = notesRes?.data ?? [];
  const currentUrl = window.location.href;
  const pageNotes =
    notesList && notesList.filter((item) => item.webpageUrl === currentUrl);
  if (!pageNotes || !pageNotes?.length) return;

  const $box = document.querySelector("body");
  let text = $box.innerHTML;

  pageNotes.forEach(() => {
    text = text.replace(
      /(<mark class="highlight-note" data-tooltip="([^"]+)">|<\/mark>)/gim,
      ""
    );
  });

  pageNotes.forEach((noteItem) => {
    const regex = new RegExp(noteItem.title, "gi");
    text = text.replace(
      regex,
      `<mark class="highlight-note" data-tooltip="${noteItem.content}">$&</mark>`
    );
  });
  text +=
    '<div id="notes-modal"><div id="modal-header"><h3></h3><div></div></div><div id="modal-content">Content</div</div>';
  $box.innerHTML = text;
  addModals();
};
