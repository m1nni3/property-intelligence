import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("properties");

let properties = [];

function escape(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function renderTable() {
  const tbody = document.getElementById("props-body");
  tbody.innerHTML = properties.map((p) => `
    <tr>
      <td>
        <div class="avatar-cell">
          <div class="avatar">${escape(p.name.charAt(0).toUpperCase())}</div>
          <div class="avatar-info"><div class="avatar-name">${escape(p.name)}</div><div class="avatar-desc">${escape(p.address?.split(",")[0] || p.address || "No address")}</div></div>
        </div>
      </td>
      <td>${escape(p.address)}</td>
      <td><span class="badge">${escape(p.type)}</span></td>
      <td><span class="badge badge-${p.status}">${escape(p.status)}</span></td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${p.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => editProperty(b.dataset.id));
  tbody.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete this property?")) {
      await del(`/properties/${b.dataset.id}`);
      toast("Property deleted", "success");
      load();
    }
  });
}

function showForm(prop) {
  const isEdit = !!prop;
  const title = isEdit ? "Edit Property" : "Add Property";
  const body = `
    <div class="form-group"><label>Name</label><input class="input-field" id="f-name" value="${escape(prop?.name)}" /></div>
    <div class="form-group"><label>Address</label><input class="input-field" id="f-address" value="${escape(prop?.address)}" /></div>
    <div class="form-group"><label>Type</label>
      <select class="input-field" id="f-type">
        <option value="residential" ${prop?.type === "residential" ? "selected" : ""}>Residential</option>
        <option value="commercial" ${prop?.type === "commercial" ? "selected" : ""}>Commercial</option>
        <option value="industrial" ${prop?.type === "industrial" ? "selected" : ""}>Industrial</option>
        <option value="mixed" ${prop?.type === "mixed" ? "selected" : ""}>Mixed Use</option>
      </select>
    </div>
    <div class="form-group"><label>Status</label>
      <select class="input-field" id="f-status">
        <option value="active" ${prop?.status === "active" ? "selected" : ""}>Active</option>
        <option value="inactive" ${prop?.status === "inactive" ? "selected" : ""}>Inactive</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('prop-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save-prop">${isEdit ? "Update" : "Create"}</button>
    </div>
  `;

  const existing = document.getElementById("prop-modal");
  if (existing) existing.remove();

  createModal("prop-modal", title, body);
  openModal("prop-modal");

  document.getElementById("btn-save-prop").onclick = async () => {
    const data = {
      name: document.getElementById("f-name").value,
      address: document.getElementById("f-address").value,
      type: document.getElementById("f-type").value,
      status: document.getElementById("f-status").value,
    };
    if (!data.name) return toast("Name is required", "error");
    try {
      if (isEdit) { await patch(`/properties/${prop.id}`, data); toast("Property updated", "success"); }
      else { await post("/properties", data); toast("Property created", "success"); }
      closeModal("prop-modal");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };
}

function editProperty(id) {
  const prop = properties.find((p) => p.id === id);
  if (prop) showForm(prop);
}

async function load() {
  try {
    properties = await get("/properties");
    renderTable();
  } catch (e) {
    toast(e.message, "error");
  }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
