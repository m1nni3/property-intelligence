export function renderSidebar(currentPage) {
  const sections = [
    {
      heading: "Dashboards",
      links: [
        { href: "index.html", label: "Analytics", icon: "fa-solid fa-chart-pie", page: "index" },
      ],
    },
    {
      heading: "Core Data",
      links: [
        { href: "properties.html", label: "Properties", icon: "fa-solid fa-building", page: "properties" },
        { href: "contacts.html", label: "Contacts", icon: "fa-solid fa-address-book", page: "contacts" },
        { href: "suppliers.html", label: "Suppliers", icon: "fa-solid fa-truck", page: "suppliers" },
      ],
    },
    {
      heading: "Financial",
      links: [
        { href: "invoices.html", label: "Invoices", icon: "fa-solid fa-file-invoice-dollar", page: "invoices" },
      ],
    },
    {
      heading: "Operations",
      links: [
        { href: "maintenance.html", label: "Maintenance", icon: "fa-solid fa-wrench", page: "maintenance" },
        { href: "documents.html", label: "Documents", icon: "fa-solid fa-file-lines", page: "documents" },
      ],
    },
    {
      heading: "Integrations",
      links: [
        { href: "data-sources.html", label: "Data Sources", icon: "fa-solid fa-plug", page: "data-sources" },
      ],
    },
  ];

  function renderNavItems(links, depth = 0) {
    return links.map((l) => {
      const isActive = l.page === currentPage;
      const cls = depth === 0
        ? `sidebar-link ${isActive ? "active" : ""}`
        : `sidebar-link sidebar-link-sub ${isActive ? "active" : ""}`;
      const indent = depth > 0 ? "ml-6" : "";
      return `<a href="/production/${l.href}" class="${cls} ${indent}"><i class="${l.icon} w-5 text-center text-sm"></i>${l.label}</a>`;
    }).join("");
  }

  return `
    <aside class="fixed top-0 left-0 bottom-0 w-60 bg-slate-800/80 border-r border-slate-700/50 backdrop-blur-xl z-50 flex flex-col">
      <div class="px-5 py-5 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">PI</div>
          <div>
            <h2 class="text-base font-bold text-white tracking-tight">Property Intel</h2>
            <span class="text-xs text-slate-500">Management Platform</span>
          </div>
        </div>
      </div>
      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        ${sections.map((s) => `
          <div class="mb-4">
            <div class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">${s.heading}</div>
            <div class="space-y-0.5">${renderNavItems(s.links)}</div>
          </div>
        `).join("")}
      </nav>
      <div class="px-4 py-4 border-t border-slate-700/50">
        <div class="flex items-center gap-3 text-sm text-slate-500">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          System Online
        </div>
      </div>
    </aside>
  `;
}
