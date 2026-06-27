import { toast } from "../lib/toast";

export function renderPortals() {
  const container = document.createElement("div");
  container.className = "flex flex-col flex-1 min-h-0";
  container.innerHTML = `
    <div class="flex items-start justify-between shrink-0 mb-4">
      <div>
        <h2 class="page-title">Portals</h2>
        <p class="page-sub">External e-platforms with auto-login</p>
      </div>
      <button class="btn-primary flex items-center gap-1 text-xs">
        <span class="inline-block w-4 h-4">+</span>Add Portal
      </button>
    </div>
  `;
  return container;
}
