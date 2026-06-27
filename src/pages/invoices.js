import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";
import { toast } from "../components/toast.js";
import { openModal, closeModal, createModal } from "../components/modal.js";

document.getElementById("sidebar").innerHTML = renderSidebar("invoices");
let invoices = [], properties = [], suppliers = [];

function e(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

function render() {
  document.getElementById("inv-body").innerHTML = invoices.map((i) => `
    <tr>
      <td class="font-medium text-white">${e(properties.find(p => p.id === i.property_id)?.name || i.property_id)}</td>
      <td>${e(suppliers.find(s => s.id === i.supplier_id)?.name || "—")}</td>
      <td class="text-emerald-400 font-medium">${i.currency} ${Number(i.amount).toLocaleString()}</td>
      <td>${e(i.due_date || "—")}</td>
      <td><span class="badge badge-${i.status}">${e(i.status)}</span></td>
      <td class="text-right">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${i.id}"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-del" data-id="${i.id}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
  document.querySelectorAll(".btn-edit").forEach((b) => b.onclick = () => showForm(invoices.find((x) => x.id === b.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((b) => b.onclick = async () => {
    if (confirm("Delete?")) { await del(`/invoices/${b.dataset.id}`); toast("Deleted", "success"); load(); }
  });
}

function showForm(inv) {
  const isEdit = !!inv;
  const existing = document.getElementById("inv-modal");
  if (existing) existing.remove();
  createModal("inv-modal", isEdit ? "Edit Invoice" : "Add Invoice", `
    <div class="form-group"><label>Property</label>
      <select class="input-field" id="f-prop">${properties.map(p => `<option value="${p.id}" ${inv?.property_id === p.id ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select>
    </div>
    <div class="form-group"><label>Supplier</label>
      <select class="input-field" id="f-supp">${suppliers.map(s => `<option value="${s.id}" ${inv?.supplier_id === s.id ? "selected" : ""}>${e(s.name)}</option>`).join("")}</select>
    </div>
    <div class="form-group"><label>Amount</label><input class="input-field" id="f-amount" type="number" step="0.01" value="${inv?.amount ?? ""}" /></div>
    <div class="form-group"><label>Currency</label><input class="input-field" id="f-currency" value="${inv?.currency || "ZAR"}" /></div>
    <div class="form-group"><label>Due Date</label><input class="input-field" id="f-due" type="date" value="${inv?.due_date ?? ""}" /></div>
    <div class="form-group"><label>Status</label>
      <select class="input-field" id="f-status">
        ${["pending","paid","overdue","cancelled"].map(s => `<option value="${s}" ${inv?.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Category</label><input class="input-field" id="f-cat" value="${e(inv?.category)}" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('inv-modal')">Cancel</button>
      <button class="btn btn-primary" id="btn-save">${isEdit ? "Update" : "Create"}</button>
    </div>
  `);
  openModal("inv-modal");
  document.getElementById("btn-save").onclick = async () => {
    const data = {
      property_id: document.getElementById("f-prop").value,
      supplier_id: document.getElementById("f-supp").value,
      amount: parseFloat(document.getElementById("f-amount").value),
      currency: document.getElementById("f-currency").value,
      due_date: document.getElementById("f-due").value,
      status: document.getElementById("f-status").value,
      category: document.getElementById("f-cat").value,
    };
    if (!data.property_id || !data.amount) return toast("Property and amount required", "error");
    try {
      if (isEdit) { await patch(`/invoices/${inv.id}`, data); toast("Updated", "success"); }
      else { await post("/invoices", data); toast("Created", "success"); }
      closeModal("inv-modal"); load();
    } catch (e) { toast(e.message, "error"); }
  };
}

async function load() {
  try {
    [invoices, properties, suppliers] = await Promise.all([get("/invoices"), get("/properties"), get("/suppliers")]);
    render();
  } catch (e) { toast(e.message, "error"); }
}

document.getElementById("btn-add").onclick = () => showForm(null);
load();
