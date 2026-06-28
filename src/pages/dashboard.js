import { renderSidebar } from "../components/sidebar.js";
import { get } from "../api.js";

document.getElementById("sidebar").innerHTML = renderSidebar("index");

const kpis = [
  { id: "kpi-properties", label: "Properties", sub: "Total portfolio", icon: "fa-solid fa-building", gradient: "bg-plum-plate" },
  { id: "kpi-contacts", label: "Contacts", sub: "Directory size", icon: "fa-solid fa-address-book", gradient: "bg-arielle-smile" },
  { id: "kpi-invoices", label: "Invoices", sub: "Total issued", icon: "fa-solid fa-file-invoice-dollar", gradient: "bg-warm-flame" },
  { id: "kpi-maintenance", label: "Open Tasks", sub: "Pending maintenance", icon: "fa-solid fa-wrench", gradient: "bg-grow-early" },
  { id: "kpi-suppliers", label: "Suppliers", sub: "Active vendors", icon: "fa-solid fa-truck", gradient: "bg-happy-itmeo" },
  { id: "kpi-documents", label: "Documents", sub: "Files uploaded", icon: "fa-solid fa-file-lines", gradient: "bg-midnight-bloom" },
  { id: "kpi-sources", label: "Data Sources", sub: "Integrations", icon: "fa-solid fa-database", gradient: "bg-mean-fruit" },
  { id: "kpi-syncs", label: "Sync Runs", sub: "Total syncs", icon: "fa-solid fa-arrows-rotate", gradient: "bg-love-kiss" },
];

document.getElementById("kpi-grid").innerHTML = kpis.map((k, i) => `
  <div class="widget-card ${k.gradient} animate-fade-in" style="animation-delay:${i * 0.05}s">
    <div class="widget-content-wrapper">
      <div class="widget-content-left">
        <div class="widget-heading"><i class="${k.icon} mr-1.5"></i>${k.label}</div>
        <div class="widget-subheading">${k.sub}</div>
      </div>
      <div class="widget-content-right">
        <div class="widget-numbers" id="${k.id}">—</div>
      </div>
    </div>
  </div>
`).join("");

function escape(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function setKpi(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function loadKPIs() {
  const results = await Promise.allSettled([
    get("/properties"),
    get("/contacts"),
    get("/invoices"),
    get("/maintenance"),
    get("/suppliers"),
    get("/documents"),
    get("/data-sources"),
  ]);

  const [propsResult, contactsResult, invoicesResult, maintResult, suppliersResult, docsResult, sourcesResult] = results;

  if (propsResult.status === "fulfilled") {
    setKpi("kpi-properties", propsResult.value.length || propsResult.value.data?.length || 0);
  } else {
    setKpi("kpi-properties", "✕");
    console.error("Failed to load properties:", propsResult.reason);
  }

  if (contactsResult.status === "fulfilled") {
    setKpi("kpi-contacts", contactsResult.value.length || contactsResult.value.data?.length || 0);
  } else {
    setKpi("kpi-contacts", "✕");
  }

  if (invoicesResult.status === "fulfilled") {
    setKpi("kpi-invoices", invoicesResult.value.length || invoicesResult.value.data?.length || 0);
  } else {
    setKpi("kpi-invoices", "✕");
  }

  if (maintResult.status === "fulfilled") {
    const data = maintResult.value.data || maintResult.value;
    const open = Array.isArray(data) ? data.filter((m) => m.status !== "completed").length : 0;
    setKpi("kpi-maintenance", open);
  } else {
    setKpi("kpi-maintenance", "✕");
  }

  if (suppliersResult.status === "fulfilled") {
    setKpi("kpi-suppliers", suppliersResult.value.length || suppliersResult.value.data?.length || 0);
  } else {
    setKpi("kpi-suppliers", "✕");
  }

  if (docsResult.status === "fulfilled") {
    setKpi("kpi-documents", docsResult.value.length || docsResult.value.data?.length || 0);
  } else {
    setKpi("kpi-documents", "✕");
  }

  if (sourcesResult.status === "fulfilled") {
    setKpi("kpi-sources", sourcesResult.value.length || sourcesResult.value.data?.length || 0);
  } else {
    setKpi("kpi-sources", "✕");
  }

  get("/sync-runs").then((runs) => {
    setKpi("kpi-syncs", runs.length || runs.data?.length || 0);
  }).catch(() => {});

  let activity;
  const propsData = propsResult.status === "fulfilled" ? (propsResult.value.data || propsResult.value) : [];
  const invoicesData = invoicesResult.status === "fulfilled" ? (invoicesResult.value.data || invoicesResult.value) : [];
  const maintData = maintResult.status === "fulfilled" ? (maintResult.value.data || maintResult.value) : [];

  const recent = [...propsData.slice(0, 3), ...invoicesData.slice(0, 2), ...maintData.slice(0, 2)]
    .sort(() => Math.random() - 0.5).slice(0, 5);

  if (recent.length === 0) {
    activity = '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-inbox"></i></div><p class="text-sm">No recent activity</p></div>';
  } else {
    activity = recent.map((r) => {
      const name = r.name || r.title || r.description || "Item";
      const type = r.property_id ? "Property" : r.amount ? "Invoice" : "Maintenance";
      const status = r.status || "—";
      return `<div class="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-700/30 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold"><i class="${type === 'Property' ? 'fa-solid fa-building' : type === 'Invoice' ? 'fa-solid fa-file-invoice-dollar' : 'fa-solid fa-wrench'}"></i></div>
          <div><div class="text-sm font-medium text-slate-200">${escape(name)}</div><div class="text-xs text-slate-500 mt-0.5">${type} · ${status}</div></div>
        </div>
      </div>`;
    }).join("");
  }
  document.getElementById("recent-activity").innerHTML = activity;
}

loadKPIs();
