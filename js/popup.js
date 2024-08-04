const notesListElement = document.getElementById("notes-list");

function displayNote(note) {
  const noteItem = document.createElement("div");
  noteItem.classList.add("card", "mb-3");

  const cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  const noteTitle = document.createElement("h5");
  noteTitle.classList.add("card-title");
  noteTitle.innerText = note.title;

  const noteDescription = document.createElement("p");
  noteDescription.classList.add("card-text");
  noteDescription.innerHTML = note.content;

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("d-flex", "justify-content-end");

  // Edit button functionality
  const editButton = document.createElement("button");
  editButton.classList.add("btn", "btn-sm", "btn-outline-primary", "me-2");
  editButton.innerHTML = "<i class='fa fa-edit'></i>";
  editButton.addEventListener("click", async () => {
    const newDescription = prompt(note.title, note.content);
    if (!newDescription) {
      return;
    }
    const result = await chrome.storage.local.get(["notesList"]);
    let notesList = result.notesList;
    notesList = notesList.map((item) =>
      item.title === note.title
        ? { ...note, description: newDescription }
        : item
    );
    await chrome.storage.local.set({ notesList });
  });

  // Delete button functionality
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("btn", "btn-sm", "btn-outline-danger");
  deleteButton.innerHTML = "<i class='fa fa-trash'></i>";
  deleteButton.addEventListener("click", async () => {
    const { accessToken } = await chrome.storage.local.get(["accessToken"]);

    const deleteRes = fetch(`http://localhost:3000/api/notes/${note.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json());
    this.showPageNotes();
  });

  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);

  cardBody.appendChild(noteTitle);
  cardBody.appendChild(noteDescription);
  cardBody.appendChild(buttonContainer);

  noteItem.appendChild(cardBody);

  notesListElement.appendChild(noteItem);
}

async function populateNotesList(type = "page") {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const notesRes = await fetch("http://localhost:3000/api/notes", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json());
  let notesList = notesRes?.data ?? [];
  let currentUrl = "";
  notesListElement.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentTab = tabs[0];
    currentUrl = currentTab.url;

    if (notesList.length) {
      if (type === "page") {
        notesList = notesList.filter((item) => item.webpageUrl === currentUrl);
      }
    }

    if (notesList?.length) {
      notesListElement.classList.remove("no-content");
      for (const noteItem of notesList.reverse()) {
        displayNote(noteItem);
      }
    } else {
      notesListElement.classList.add("no-content");
      notesListElement.innerHTML = "No notes added!";
    }
  });
}

chrome.storage.local.onChanged.addListener(populateNotesList);

// Handling header buttons
const pageNotesBtn = document.getElementById("page-notes-btn");
const allNotesBtn = document.getElementById("all-notes-btn");

pageNotesBtn.addEventListener("click", async () => {
  pageNotesBtn.classList.add("active");
  allNotesBtn.classList.remove("active");
  populateNotesList("page");
});

allNotesBtn.addEventListener("click", async () => {
  allNotesBtn.classList.add("active");
  pageNotesBtn.classList.remove("active");
  populateNotesList("all");
});

// Showing notes for the active page
function showPageNotes() {
  allNotesBtn.classList.remove("active");
  pageNotesBtn.classList.add("active");
  populateNotesList("page");
}

showPageNotes();

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["isAuthenticated", "user"], (result) => {
    this.toggleUI(result?.user);
  });
  const loginButton = document.getElementById("login");
  const logoutButton = document.getElementById("logout");

  loginButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "authenticate" }, (response) => {
      if (response.error) {
      } else {
        if (response.user) {
          this.toggleUI(response.user);
        }
      }
    });
  });

  logoutButton.addEventListener("click", () => {
    chrome.storage.local.remove(["isAuthenticated", "token"], () => {
      chrome.storage.local.set(
        { isAuthenticated: false, token: null, user: null, accessToken: null },
        () => {
          this.toggleUI();
        }
      );
    });
  });
});

function toggleUI(userInfo = null) {
  const guestSection = document.getElementById("guest");
  const authSection = document.getElementById("auth");

  if (userInfo) {
    guestSection.style.display = "none";
    authSection.style.display = "block";
    this.showPageNotes();
  } else {
    guestSection.style.display = "block";
    authSection.style.display = "none";
  }
}
