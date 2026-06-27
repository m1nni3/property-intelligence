export function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

export function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

export function createModal(id, title, content) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = "modal-overlay hidden";
  el.id = id;
  el.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="text-lg font-semibold text-white">${title}</h3>
        <button class="btn btn-icon btn-ghost rounded-xl text-xl leading-none" data-close="${id}">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
    </div>
  `;
  el.querySelector(`[data-close="${id}"]`).onclick = () => closeModal(id);
  el.onclick = (e) => { if (e.target === el) closeModal(id); };
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") { closeModal(id); document.removeEventListener("keydown", handler); }
  });
  document.body.appendChild(el);
  return el;
}
