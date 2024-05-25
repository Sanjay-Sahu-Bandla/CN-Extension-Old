// Adding a note & Highlightig notes
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "addNote") {
    const description = prompt(`Notes for ${request.title}`);
    if (!description) return;

    chrome.storage.local.get(["notesList"]).then(({ notesList }) => {
      const newNote = {
        title: request.title,
        description,
        pageUrl: request.pageUrl,
      };
      notesList = notesList ? [...notesList, newNote] : [newNote];
      chrome.storage.local.set({ notesList }).then(() => {
        highlightNotes();
        addModals();
      });
    });
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
  const result = await chrome.storage.local.get(["notesList"]);
  const notesList = result.notesList;
  const currentUrl = window.location.href;
  const pageNotes = notesList.filter((item) => item.pageUrl === currentUrl);
  if (!pageNotes) return;

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
      `<mark class="highlight-note" data-tooltip="${noteItem.description}">$&</mark>`
    );
  });
  text +=
    '<div id="notes-modal"><div id="modal-header"><h3></h3><div></div></div><div id="modal-content">Content</div</div>';
  $box.innerHTML = text;
  addModals();
};
