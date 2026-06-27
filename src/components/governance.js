export function renderGovernance() {
  const container = document.createElement("div");
  container.className = "flex flex-col flex-1 min-h-0";
  container.innerHTML = `
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="page-title">Governance</h2>
        <p class="page-sub">Trust governance, meetings, and compliance</p>
      </div>
    </div>
    <div class="bg-white rounded-card shadow-card p-8 text-center">
      <div class="w-16 h-16 mx-auto text-gray-300 mb-4 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-400 mb-2">Coming Soon</h3>
      <p class="text-sm text-gray-400">Meeting minutes, resolutions, and compliance tracking will appear here.</p>
    </div>
  `;
  return container;
}
