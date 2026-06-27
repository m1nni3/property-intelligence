import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("maintenance");
let items = [], properties = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function priorityBadge(p) {
  if (p === "emergency") return "badge-danger";
  if (p === "high") return "badge-warning";
  if (p === "medium") return "badge-pending";
  return "badge-active";
}

function render() {
  document.getElementById("maint-body").innerHTML = items.map((m) => `
    <tr>
      <td class="font-medium text-white">${e(properties.find(p => p.id === m.property_id)?.name || m.property_id)}</td>
      <td class="font-medium text-white">${e(m.title)}</td>
      <td><span class="badge badge-${m.status}">${e(m.status)}</span></td>
      <td><span class="badge ${priorityBadge(m.priority)}">${e(m.priority)}</span></td>
      <td>${m.cost_estimate ? "R " + Number(m.cost_estimate).toLocaleString() : "—"}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${m.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${m.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => showForm(items.find((x) => x.id === b.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/maintenance/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function showForm(item) {
  const isEdit = !!item;
  const existing = document.getElementById("maint-modal");
  if (existing) existing.remove();
  createModal("maint-modal", isEdit ? "Edit Task" : "Add Task", `
    <div class="form-group"><label>Property</label>
      <select class="input-field" id="f-prop">${properties.map(p => `<option value="${p.id}" ${item?.property_id === p.id ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select>
    </div>
    <div class="form-group"><label>Title</label><input class="input-field" id="f-title" value="${e(item?.title)}" /></div>
    <div class="form-group"><label>Description</label><textarea class="input-field" id="f-desc">${e(item?.description)}</textarea></div>
    <div class="form-group"><label>Status</label>
      <select class="input-field" id="f-status">${["open","in_progress","completed","cancelled"].map(s => `<option value="${s}" ${item?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
    </div>
    <div class="form-group"><label>Priority</label>
      <select class="input-field" id="f-priority">${["low","medium","high","emergency"].map(s => `<option value="${s}" ${item?.priority === s ? "selected" : ""}>${s}</option>`).join("")}</select>
    </div>
    <div class="form-group"><label>Cost Estimate</label><input class="input-field" id="f-cost" type="number" step="0.01" value="${item?.cost_estimate ?? ""}" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('maint-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save">${isEdit ? "Update" : "Create"}</button>
    </div>
  `);
  openModal("maint-modal");
  document.getElementById("btn-save").onclick = async () => {
    const data = {
      property_id: document.getElementById("f-prop").value,
      title: document.getElementById("f-title").value,
      description: document.getElementById("f-desc").value,
      status: document.getElementById("f-status").value,
      priority: document.getElementById("f-priority").value,
      cost_estimate: parseFloat(document.getElementById("f-cost").value) || null,
    };
    if (!data.property_id || !data.title) return toast("Property and title required", "error");
    try {
      if (isEdit) { await patch(`/maintenance/${item.id}`, data); toast("Updated", "success"); }
      else { await post("/maintenance", data); toast("Created", "success"); }
      closeModal("maint-modal"); load();
    } catch (e) { toast(e.message, "error"); }
  };
}

async function load() {
  try { [items, properties] = await Promise.all([get("/maintenance"), get("/properties")]); render(); }
  catch (e) { toast(e.message, "error"); }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
