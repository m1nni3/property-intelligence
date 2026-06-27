export function renderDebrief() {
  const container = document.createElement("div");
  container.className = "flex flex-col flex-1 min-h-0";
  container.innerHTML = `
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="font-heading text-xl font-bold text-pomp-navy">Debrief</h2>
        <p class="text-xs text-gray-400">Trustee debriefs &amp; reports</p>
      </div>
    </div>
  `;
  return container;
}
