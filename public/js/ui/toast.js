const MAX_NOTES = 3; // the game is busy now; older notes make way rather than piling up

/** Shows a short message along the bottom. The container is a live region, so screen readers hear it too. */
export function toast(html, ms = 5000) {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  container.append(el);
  while (container.children.length > MAX_NOTES) container.firstElementChild.remove();
  setTimeout(() => el.remove(), ms);
}
