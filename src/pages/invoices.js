import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";

document.getElementById("sidebar").innerHTML = renderSidebar("invoices");

let currentPage = 1;
const pageSize = 20;
let allInvoices = [];

async function loadInvoices() {
  try {
    const response = await get(`/invoices?page=${currentPage}&limit=${pageSize}`);
    const { data, pagination } = response;
    allInvoices = data;
    
    document.getElementById("table-body").innerHTML = data
      .map(
        (inv) => `
        <tr class="hover:bg-slate-700/50 transition-colors">
          <td class="px-6 py-4 text-sm text-slate-300">${inv.property_id?.slice(0, 8)}</td>
          <td class="px-6 py-4 text-sm text-slate-400">${inv.amount || 0}</td>
          <td class="px-6 py-4 text-sm">
            <span class="px-2 py-1 rounded text-xs font-semibold ${
              inv.status === "paid"
                ? "bg-green-500/20 text-green-400"
                : inv.status === "overdue"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
            }">
              ${inv.status || "pending"}
            </span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-400">${inv.due_date || "—"}</td>
          <td class="px-6 py-4 text-sm">
            <button onclick="editInvoice('${inv.id}')" class="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
            <button onclick="deleteInvoice('${inv.id}')" class="text-red-400 hover:text-red-300">Delete</button>
          </td>
        </tr>
      `,
      )
      .join("");

    document.getElementById("pagination").innerHTML = `
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-slate-400">
          Page ${pagination.page} of ${pagination.pages} (${pagination.total} total)
        </div>
        <div class="flex gap-2">
          <button onclick="previousPage()" ${currentPage === 1 ? "disabled" : ""} class="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Prev</button>
          <button onclick="nextPage()" ${currentPage >= pagination.pages ? "disabled" : ""} class="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Next</button>
        </div>
      </div>
    `;
  } catch (e) {
    document.getElementById("table-body").innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-400">${e.message}</td></tr>`;
  }
}

function nextPage() {
  currentPage++;
  loadInvoices();
}

function previousPage() {
  if (currentPage > 1) currentPage--;
  loadInvoices();
}

function editInvoice(id) {
  const invoice = allInvoices.find((inv) => inv.id === id);
  if (!invoice) return;
  
  const status = prompt("Status (pending/paid/overdue/cancelled):", invoice.status);
  if (!status) return;
  
  patch(`/invoices/${id}`, { status }).then(() => {
    loadInvoices();
  });
}

function deleteInvoice(id) {
  if (!confirm("Delete this invoice?")) return;
  
  del(`/invoices/${id}`).then(() => {
    loadInvoices();
  });
}

document.getElementById("btn-add").addEventListener("click", () => {
  const property_id = prompt("Property ID:");
  if (!property_id) return;
  
  const amount = prompt("Amount:");
  if (!amount) return;
  
  post("/invoices", { property_id, amount: Number(amount) }).then(() => {
    currentPage = 1;
    loadInvoices();
  });
});

loadInvoices();
