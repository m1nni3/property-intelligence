import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("suppliers");
let suppliers = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function render() {
  document.getElementById("sup-body").innerHTML = suppliers.map((s) => `
    <tr>
      <td>
        <div class="avatar-cell">
          <div class="avatar">${e(s.name.charAt(0).toUpperCase())}</div>
          <div class="avatar-info"><div class="avatar-name">${e(s.name)}</div><div class="avatar-desc">${e(s.service_type || "General")}</div></div>
        </div>
      </td>
      <td>${e(s.service_type || "—")}</td>
      <td>${e(s.phone || "—")}</td>
      <td>${e(s.email || "—")}</td>
      <td><span class="badge badge-${s.is_active ? "active" : "inactive"}">${s.is_active ? "Active" : "Inactive"}</span></td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${s.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${s.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => showForm(suppliers.find((x) => x.id === b.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/suppliers/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function showForm(sup) {
  const isEdit = !!sup;
  const existing = document.getElementById("sup-modal");
  if (existing) existing.remove();
  createModal("sup-modal", isEdit ? "Edit Supplier" : "Add Supplier", `
    <div class="form-group"><label>Name</label><input class="input-field" id="f-name" value="${e(sup?.name)}" /></div>
    <div class="form-group"><label>Service Type</label><input class="input-field" id="f-type" value="${e(sup?.service_type)}" /></div>
    <div class="form-group"><label>Phone</label><input class="input-field" id="f-phone" value="${e(sup?.phone)}" /></div>
    <div class="form-group"><label>Email</label><input class="input-field" id="f-email" value="${e(sup?.email)}" /></div>
    <div class="form-group"><label>Address</label><input class="input-field" id="f-addr" value="${e(sup?.address)}" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('sup-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save">${isEdit ? "Update" : "Create"}</button>
    </div>
  `);
  openModal("sup-modal");
  document.getElementById("btn-save").onclick = async () => {
    const data = {
      name: document.getElementById("f-name").value,
      service_type: document.getElementById("f-type").value,
      phone: document.getElementById("f-phone").value,
      email: document.getElementById("f-email").value,
      address: document.getElementById("f-addr").value,
    };
    if (!data.name) return toast("Name required", "error");
    try {
      if (isEdit) { await patch(`/suppliers/${sup.id}`, data); toast("Updated", "success"); }
      else { await post("/suppliers", data); toast("Created", "success"); }
      closeModal("sup-modal"); load();
    } catch (e) { toast(e.message, "error"); }
  };
}

async function load() {
  try { suppliers = await get("/suppliers"); render(); } catch (e) { toast(e.message, "error"); }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
