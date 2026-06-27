import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("data-sources");
let sources = [], runs = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function render() {
  document.getElementById("src-body").innerHTML = sources.map((s) => `
    <tr>
      <td class="font-medium text-white"><i class="fa-solid fa-database text-indigo-400 mr-2"></i>${e(s.name)}</td>
      <td><span class="badge">${e(s.source_type)}</span></td>
      <td><span class="badge badge-${s.is_active ? "active" : "inactive"}">${s.is_active ? "Active" : "Inactive"}</span></td>
      <td>${s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : "—"}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${s.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-success btn-sync" data-id="${s.id}"><i class="fa-solid fa-arrows-rotate"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${s.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => showForm(sources.find((x) => x.id === b.dataset.id)));
  document.querySelectorAll(".btn-sync").forEach((b) => b.onclick = async () => {
    try { await post(`/data-sources/${b.dataset.id}/sync`); toast("Sync triggered", "success"); loadRuns(); }
    catch (e) { toast(e.message, "error"); }
  });
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/data-sources/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function renderRuns() {
  document.getElementById("run-body").innerHTML = runs.map((r) => `
    <tr>
      <td>${sources.find(s => s.id === r.source_id)?.name || r.source_id}</td>
      <td><span class="badge badge-${r.status}">${e(r.status)}</span></td>
      <td>${r.records_processed ?? "—"}</td>
      <td class="text-emerald-400">${r.records_created ? "+" + r.records_created : "—"}</td>
      <td class="text-sky-400">${r.records_updated ? "~" + r.records_updated : "—"}</td>
      <td class="text-red-400">${r.records_failed ? "!" + r.records_failed : "—"}</td>
      <td>${r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
    </tr>
  `).join("");
}

function showForm(src) {
  const isEdit = !!src;
  const existing = document.getElementById("src-modal");
  if (existing) existing.remove();
  createModal("src-modal", isEdit ? "Edit Source" : "Add Source", `
    <div class="form-group"><label>Name</label><input class="input-field" id="f-name" value="${e(src?.name)}" /></div>
    <div class="form-group"><label>Source Type</label>
      <select class="input-field" id="f-type">
        <option value="csv" ${src?.source_type === "csv" ? "selected" : ""}>CSV Upload</option>
        <option value="api" ${src?.source_type === "api" ? "selected" : ""}>External API</option>
        <option value="manual" ${src?.source_type === "manual" ? "selected" : ""}>Manual Entry</option>
      </select>
    </div>
    <div class="form-group"><label>Config (JSON)</label><textarea class="input-field font-mono text-xs" id="f-config" rows="4">${e(src?.config ? JSON.stringify(src.config, null, 2) : "")}</textarea></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('src-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save">${isEdit ? "Update" : "Create"}</button>
    </div>
  `);
  openModal("src-modal");
  document.getElementById("btn-save").onclick = async () => {
    let config;
    try { config = JSON.parse(document.getElementById("f-config").value || "{}"); }
    catch { return toast("Invalid JSON in config", "error"); }
    const data = {
      name: document.getElementById("f-name").value,
      source_type: document.getElementById("f-type").value,
      config,
    };
    if (!data.name) return toast("Name required", "error");
    try {
      if (isEdit) { await patch(`/data-sources/${src.id}`, data); toast("Updated", "success"); }
      else { await post("/data-sources", data); toast("Created", "success"); }
      closeModal("src-modal"); load();
    } catch (e) { toast(e.message, "error"); }
  };
}

async function loadRuns() { try { runs = await get("/sync-runs"); renderRuns(); } catch (e) {} }
async function load() {
  try { sources = await get("/data-sources"); render(); loadRuns(); }
  catch (e) { toast(e.message, "error"); }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
