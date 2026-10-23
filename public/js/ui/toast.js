/** Shows a short message in the corner. The container is a live region, so screen readers hear it too. */
export function toast(html, ms = 5000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), ms);
}
