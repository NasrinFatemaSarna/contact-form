const API = "http://localhost:3000/contacts";

const tbody = document.getElementById("contactTbody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const filterSelect = document.getElementById("filterSelect");

// Bootstrap modals
const showModalEl = document.getElementById("showModal");
const editModalEl = document.getElementById("editModal");
const showModal = showModalEl ? new bootstrap.Modal(showModalEl) : null;
const editModal = editModalEl ? new bootstrap.Modal(editModalEl) : null;

let allContacts = [];
let viewContacts = [];
let selectedContact = null;

function setEmptyState(isEmpty) {
  if (!emptyState) return;
  emptyState.classList.toggle("d-none", !isEmpty);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRow(contact, index) {
  return `
    <tr>
      <th scope="row">${index + 1}</th>
      <td>${escapeHtml(contact.fname)}</td>
      <td>${escapeHtml(contact.lname)}</td>
      <td>${escapeHtml(contact.email)}</td>
      <td>${escapeHtml(contact.phone)}</td>
      <td>
        <button class="btn btn-sm btn-outline-success me-1 js-show" data-id="${contact.id}" title="Show">
          <i class="fa fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-primary me-1 js-edit" data-id="${contact.id}" title="Edit">
          <i class="fa fa-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger js-delete" data-id="${contact.id}" title="Delete">
          <i class="fa fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

function renderTable(list) {
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = "";
    setEmptyState(true);
    return;
  }

  setEmptyState(false);
  tbody.innerHTML = list.map((c, i) => renderRow(c, i)).join("");
}

async function fetchContacts() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to load contacts");
  const data = await res.json();

  allContacts = Array.isArray(data) ? data : [];
  viewContacts = [...allContacts];

  applyFilter();
  renderTable(viewContacts);
}

function matchesSearch(contact, q) {
  const hay = [contact.fname, contact.lname, contact.email, contact.phone]
    .join(" ")
    .toLowerCase();

  return hay.includes(q.toLowerCase());
}

function applySearch() {
  const q = (searchInput?.value || "").trim();

  if (!q) {
    viewContacts = [...allContacts];
  } else {
    viewContacts = allContacts.filter((c) => matchesSearch(c, q));
  }

  applyFilter();
  renderTable(viewContacts);
}

function applyFilter() {
  const mode = filterSelect?.value || "default";

  if (mode === "fname") {
    viewContacts.sort((a, b) => (a.fname || "").localeCompare(b.fname || ""));
  } else if (mode === "lname") {
    viewContacts.sort((a, b) => (a.lname || "").localeCompare(b.lname || ""));
  } else if (mode === "oldest") {
    // Oldest to first (createdAt ASC). If createdAt missing, fallback id
    viewContacts.sort((a, b) => {
      const ta = Date.parse(a.createdAt || "") || 0;
      const tb = Date.parse(b.createdAt || "") || 0;
      if (ta !== tb) return ta - tb;
      return (a.id || 0) - (b.id || 0);
    });
  } else {
    viewContacts.sort((a, b) => (a.id || 0) - (b.id || 0));
  }
}

function findById(id) {
  return allContacts.find((c) => String(c.id) === String(id));
}

/* ---------- SHOW MODAL ---------- */
function openShowModal(contact) {
  selectedContact = contact;

  const body = document.getElementById("showModalBody");
  if (body) {
    body.innerHTML = `
      <div class="mb-2"><strong>First Name:</strong> ${escapeHtml(contact.fname)}</div>
      <div class="mb-2"><strong>Last Name:</strong> ${escapeHtml(contact.lname)}</div>
      <div class="mb-2"><strong>Email:</strong> ${escapeHtml(contact.email)}</div>
      <div class="mb-2"><strong>Phone:</strong> ${escapeHtml(contact.phone)}</div>
    `;
  }

  const editBtn = document.getElementById("showModalEditBtn");
  if (editBtn) {
    editBtn.onclick = () => {
      showModal?.hide();
      // modal transition smooth
      setTimeout(() => openEditModal(selectedContact), 200);
    };
  }

  showModal?.show();
}

/* ---------- EDIT MODAL ---------- */
function openEditModal(contact) {
  selectedContact = contact;

  document.getElementById("editId").value = contact.id;
  document.getElementById("editFname").value = contact.fname || "";
  document.getElementById("editLname").value = contact.lname || "";
  document.getElementById("editEmail").value = contact.email || "";
  document.getElementById("editPhone").value = contact.phone || "";

  editModal?.show();
}

/* ---------- API: UPDATE / DELETE ---------- */
async function updateContact(payload) {
  const res = await fetch(`${API}/${payload.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

async function deleteContact(id) {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}

/* ---------- EVENTS ---------- */
function bindEvents() {
  searchBtn?.addEventListener("click", applySearch);

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applySearch();
  });

  filterSelect?.addEventListener("change", () => {
    applySearch();
  });

  // Table action buttons
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const contact = findById(id);
    if (!contact) return;

    if (btn.classList.contains("js-show")) openShowModal(contact);
    if (btn.classList.contains("js-edit")) openEditModal(contact);

    if (btn.classList.contains("js-delete")) {
      const ok = confirm("Are you sure you want to delete this contact?");
      if (!ok) return;

      try {
        await deleteContact(id);
        await fetchContacts();
        applySearch();
      } catch (err) {
        alert(err.message || "Delete failed");
      }
    }
  });

  // Edit submit
  const editForm = document.getElementById("editForm");
  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = Number(document.getElementById("editId").value);

    const payload = {
      id,
      fname: document.getElementById("editFname").value.trim(),
      lname: document.getElementById("editLname").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      phone: document.getElementById("editPhone").value.trim(),
    };

    try {
      await updateContact(payload);
      editModal?.hide();
      await fetchContacts();
      applySearch();
    } catch (err) {
      alert(err.message || "Update failed");
    }
  });
}

(async function init() {
  try {
    bindEvents();
    await fetchContacts();
    renderTable(viewContacts);
  } catch (err) {
    console.error(err);
    renderTable([]);
  }
})();
