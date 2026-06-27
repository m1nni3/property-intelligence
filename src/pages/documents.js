import { renderSidebar } from "../components/sidebar.js";
import { get, post, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("documents");
let docs = [], statements = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function render() {
  document.getElementById("doc-body").innerHTML = docs.map((d) => `
    <tr>
      <td class="font-medium text-white"><i class="fa-regular fa-file-lines text-indigo-400 mr-2"></i>${e(d.filename)}</td>
      <td>${e(d.doc_type || "—")}</td>
      <td><span class="badge badge-${d.status}">${e(d.status)}</span></td>
      <td>${d.page_count ? d.page_count + " pages" : "—"}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-view" data-id="${d.id}"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${d.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-view").forEach((b) => b.onclick = () => viewDoc(docs.find((x) => x.id === b.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/documents/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function renderStatements() {
  document.getElementById("stmt-body").innerHTML = statements.map((s) => `
    <tr>
      <td class="font-medium text-white">${e(s.statement_type)}</td>
      <td>${e(s.account_number || "—")}</td>
      <td>${s.period_start || "—"} — ${s.period_end || "—"}</td>
      <td class="text-emerald-400 font-medium">${s.total_due ? "R " + Number(s.total_due).toLocaleString() : "—"}</td>
      <td><span class="badge badge-${s.status}">${e(s.status)}</span></td>
    </tr>
  `).join("");
}

function viewDoc(doc) {
  if (doc.structured_data) {
    createModal("doc-modal", `Document: ${e(doc.filename)}`, `
      <div class="json-preview">${e(JSON.stringify(doc.structured_data, null, 2))}</div>
    `);
    openModal("doc-modal");
  } else {
    toast("No structured data available", "info");
  }
}

document.getElementById("upload-form").onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData();
  const file = document.getElementById("file-input").files[0];
  if (!file) return toast("Select a file", "error");
  fd.append("file", file);
  fd.append("doc_type", document.getElementById("doc-type").value);
  fd.append("property_id", document.getElementById("prop-id").value || "");
  try {
    await post("/documents/upload", fd);
    toast("Uploaded & processing", "success");
    load();
  } catch (err) { toast(err.message, "error"); }
};

async function load() {
  try {
    [docs, statements] = await Promise.all([get("/documents"), get("/statements")]);
    render(); renderStatements();
  } catch (e) { toast(e.message, "error"); }
}

load();
