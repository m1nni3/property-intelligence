import { toast } from "../lib/toast";

export function renderTasks() {
  const container = document.createElement("div");
  container.className = "flex flex-col flex-1 min-h-0 overflow-y-auto";
  container.innerHTML = `
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="font-heading text-xl font-bold text-pomp-navy">Tasks</h2>
        <p class="text-xs text-gray-400">Track what needs to get done</p>
      </div>
    </div>
    <div class="card my-3 border-2 border-pomp-blue/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="inline-block w-5 h-5">+</span>
        <h4 class="font-semibold text-sm text-pomp-navy">New Task</h4>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input placeholder="Task title" class="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-pomp-blue md:col-span-2" />
        <select class="border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-pomp-blue">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input placeholder="Description" class="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-pomp-blue md:col-span-2" />
        <input type="date" class="border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-pomp-blue" />
      </div>
      <div class="flex gap-2">
        <button class="btn-primary text-sm">Add Task</button>
        <button class="btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  `;
  
  const filterDiv = document.createElement("div");
  filterDiv.className = "flex gap-2 mb-3";
  filterDiv.role = "tablist";
  filterDiv.ariaLabel = "Task status filter";
  
  const statuses = ["all", "pending", "in_progress", "done"];
  statuses.forEach(status => {
    const button = document.createElement("button");
    button.role = "tab";
    button.className = "text-xs px-3 py-1.5 rounded-lg capitalize";
    button.textContent = status === "in_progress" ? "In Progress" : status;
    filterDiv.appendChild(button);
  });
  
  container.appendChild(filterDiv);
  
  const tasksList = document.createElement("div");
  tasksList.className = "space-y-1.5";
  tasksList.innerHTML = `
    <div class="text-sm text-gray-400 italic text-center py-8">No tasks yet.</div>
  `;
  
  container.appendChild(tasksList);
  return container;
}
