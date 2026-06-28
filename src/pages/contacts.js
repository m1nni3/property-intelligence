import { renderSidebar } from "../components/sidebar.js";
import { get, post, patch, del } from "../api.js";

document.getElementById("sidebar").innerHTML = renderSidebar("contacts");

let currentPage = 1;
const pageSize = 20;
let allContacts = [];

async function loadContacts() {
  try {
    const response = await get(`/contacts?page=${currentPage}&limit=${pageSize}`);
    const { data, pagination } = response;
    allContacts = data;
    
    document.getElementById("table-body").innerHTML = data
      .map(
        (c) => `
        <tr class="hover:bg-slate-700/50 transition-colors">
          <td class="px-6 py-4 text-sm text-slate-300">${c.name}</td>
          <td class="px-6 py-4 text-sm text-slate-400">${c.email || "—"}</td>
          <td class="px-6 py-4 text-sm text-slate-400">${c.phone || "—"}</td>
          <td class="px-6 py-4 text-sm text-slate-400">${c.company || "—"}</td>
          <td class="px-6 py-4 text-sm">
            <button onclick="editContact('${c.id}')" class="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
            <button onclick="deleteContact('${c.id}')" class="text-red-400 hover:text-red-300">Delete</button>
          </td>
        </tr>
      `,
      )
      .join("");

    // Pagination controls
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
  loadContacts();
}

function previousPage() {
  if (currentPage > 1) currentPage--;
  loadContacts();
}

function editContact(id) {
  const contact = allContacts.find((c) => c.id === id);
  if (!contact) return;
  
  const name = prompt("Name:", contact.name);
  if (!name) return;
  
  patch(`/contacts/${id}`, { name }).then(() => {
    loadContacts();
  });
}

function deleteContact(id) {
  if (!confirm("Delete this contact?")) return;
  
  del(`/contacts/${id}`).then(() => {
    loadContacts();
  });
}

document.getElementById("btn-add").addEventListener("click", () => {
  const name = prompt("Contact name:");
  if (!name) return;
  
  const email = prompt("Email (optional):", "");
  const phone = prompt("Phone (optional):", "");
  const company = prompt("Company (optional):", "");
  
  post("/contacts", { name, ...(email && { email }), ...(phone && { phone }), ...(company && { company }) }).then(() => {
    currentPage = 1;
    loadContacts();
  });
});

loadContacts();
