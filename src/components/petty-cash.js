import { formatRand } from "../lib/utils";

const calcVAT = (amount, inclusive) => {
  return inclusive ? amount * 15 / 115 : amount * 0.15;
};

export function renderPettyCash() {
  const container = document.createElement("div");
  container.className = "flex flex-col flex-1 min-h-0";
  container.innerHTML = `
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="font-heading text-xl font-bold text-pomp-navy">Petty Cash</h2>
        <p class="text-xs text-gray-400">Track income and expenses</p>
      </div>
    </div>
  `;
  
  const incomeSection = document.createElement("div");
  incomeSection.className = "card mb-4 border-2 border-green-500/30";
  incomeSection.role = "region";
  incomeSection.ariaLabel = "New income form";
  incomeSection.innerHTML = `
    <h4 class="font-semibold text-sm text-green-600 mb-3">New Income</h4>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <input placeholder="Date" type="date" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
      <input placeholder="Description" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
      <input type="number" step="0.01" placeholder="Amount" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
      <input placeholder="Category" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
      <input placeholder="Notes" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
    </div>
    <div class="flex gap-2 mt-3">
      <button class="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700">Save</button>
      <button class="text-sm text-gray-500">Cancel</button>
    </div>
  `;
  
  container.appendChild(incomeSection);
  return container;
}
