import { Game } from './core/Game.js';
import { SaveManager } from './core/SaveManager.js';
import { iconUrl } from './pixel/icons.js';
import { Aviary } from './ui/Aviary.js';
import { Hud } from './ui/Hud.js';
import { Menu } from './ui/Menu.js';
import { NewsTicker } from './ui/NewsTicker.js';
import { Scene } from './ui/Scene.js';
import { Shop } from './ui/Shop.js';
import { toast } from './ui/toast.js';
import { formatNumber } from './utils/format.js';

const PANEL_REFRESH_MS = 100;
const AUTOSAVE_MS = 15_000;

async function start() {
  const response = await fetch('/api/content');
  if (!response.ok) throw new Error(`Content request failed with ${response.status}`);
  const content = await response.json();
  const game = new Game(content);

  const saves = new SaveManager('kingfisher-cove-save');
  const saved = saves.load();
  if (saved) {
    game.load(saved);
    const foraged = game.catchUp((Date.now() - saved.savedAt) / 1000);
    if (foraged >= 1) toast(`Welcome back! Your flock foraged ${formatNumber(foraged)} seeds while you were away.`);
  }

  for (const img of document.querySelectorAll('img[data-icon]')) img.src = iconUrl(img.dataset.icon);
  const hud = new Hud(game);
  const scene = new Scene(game);
  const aviary = new Aviary(game);
  const ticker = new NewsTicker(game, content.news);
  const panels = [scene, aviary, new Shop(game), new Menu(game, {
    onReset() {
      if (!confirm('Release every bird and start the cove from scratch? This cannot be undone.')) return;
      saves.wipe();
      location.reload();
    },
  })];

  // The pixel scenes and counters run every frame; DOM-heavy panels refresh a few times a second.
  let lastFrame = performance.now();
  let lastPanels = -Infinity;
  const frame = (now) => {
    // rAF's timestamp can precede the performance.now() read above, so the first dt can dip below zero.
    const dt = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
    lastFrame = now;
    game.tick();
    hud.update();
    if (now - lastPanels >= PANEL_REFRESH_MS) {
      lastPanels = now;
      for (const panel of panels) panel.update();
      ticker.update(now);
    }
    scene.animate(now, dt);
    aviary.animate(now, dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  // Hidden tabs get no animation frames; keep the cove ticking so visits and saves stay current.
  setInterval(() => {
    if (document.hidden) game.tick();
  }, 1000);

  setInterval(() => saves.save(game), AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saves.save(game);
  });
  window.addEventListener('pagehide', () => saves.save(game));

  document.getElementById('loading').remove();
}

start().catch((error) => {
  console.error(error);
  document.getElementById('loading').textContent = 'Could not reach the cove’s server. Is it running? Refresh to try again.';
});
