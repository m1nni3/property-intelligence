import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("contacts");
let contacts = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function render() {
  document.getElementById("contacts-body").innerHTML = contacts.map((c) => `
    <tr>
      <td>
        <div class="avatar-cell">
          <div class="avatar">${e(c.name.charAt(0).toUpperCase())}</div>
          <div class="avatar-info"><div class="avatar-name">${e(c.name)}</div><div class="avatar-desc">${e(c.company || "No company")}</div></div>
        </div>
      </td>
      <td>${e(c.phone || "—")}</td>
      <td>${e(c.email || "—")}</td>
      <td>${e(c.company || "—")}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${c.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${c.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => showForm(contacts.find((c) => c.id === b.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/contacts/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function showForm(contact) {
  const isEdit = !!contact;
  const existing = document.getElementById("contact-modal");
  if (existing) existing.remove();
  createModal("contact-modal", isEdit ? "Edit Contact" : "Add Contact", `
    <div class="form-group"><label>Name</label><input class="input-field" id="f-name" value="${e(contact?.name)}" /></div>
    <div class="form-group"><label>Phone</label><input class="input-field" id="f-phone" value="${e(contact?.phone)}" /></div>
    <div class="form-group"><label>Email</label><input class="input-field" id="f-email" value="${e(contact?.email)}" /></div>
    <div class="form-group"><label>Company</label><input class="input-field" id="f-company" value="${e(contact?.company)}" /></div>
    <div class="form-group"><label>Notes</label><textarea class="input-field" id="f-notes">${e(contact?.notes)}</textarea></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('contact-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save">${isEdit ? "Update" : "Create"}</button>
    </div>
  `);
  openModal("contact-modal");
  document.getElementById("btn-save").onclick = async () => {
    const data = {
      name: document.getElementById("f-name").value,
      phone: document.getElementById("f-phone").value,
      email: document.getElementById("f-email").value,
      company: document.getElementById("f-company").value,
      notes: document.getElementById("f-notes").value,
    };
    if (!data.name) return toast("Name required", "error");
    try {
      if (isEdit) { await patch(`/contacts/${contact.id}`, data); toast("Updated", "success"); }
      else { await post("/contacts", data); toast("Created", "success"); }
      closeModal("contact-modal"); load();
    } catch (e) { toast(e.message, "error"); }
  };
}

async function load() {
  try { contacts = await get("/contacts"); render(); } catch (e) { toast(e.message, "error"); }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
