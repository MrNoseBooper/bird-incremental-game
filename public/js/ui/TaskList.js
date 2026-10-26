import { iconImg } from '../pixel/icons.js';
import { formatNumber } from '../utils/format.js';
import { toast } from './toast.js';

/** The field task cards above the aviary: progress bars, a swap button, and a note when one is done. */
export class TaskList {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('tasks');
    this.key = null;
    this.el.addEventListener('click', (event) => {
      const swap = event.target.closest('[data-swap]');
      if (swap) game.rerollTask(Number(swap.dataset.swap));
    });
    game.addEventListener('taskdone', ({ detail }) => {
      const feather = detail.feathers ? ` and ${detail.feathers} feather` : '';
      toast(`${iconImg('scroll')} <b>Task done:</b> ${detail.text}! +${formatNumber(detail.seeds)} seeds${feather}`);
    });
  }

  update() {
    const { tasks } = this.game;
    const key = tasks.slots.map((task) => `${task.kind}:${task.target}:${task.start}`).join('|');
    if (key !== this.key) {
      const fresh = this.key !== null;
      this.key = key;
      this.el.innerHTML = tasks.slots.map((task, i) => `
        <div class="task">
          <span class="task-text">${tasks.describe(task)}</span>
          <span class="task-bar"><span></span></span>
          <span class="task-foot"><span class="task-count"></span>
            <button type="button" class="task-swap" data-swap="${i}" aria-label="Swap this task for another">Swap</button></span>
        </div>`).join('');
      if (fresh) this.el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 240, easing: 'steps(3)' });
    }
    tasks.slots.forEach((task, i) => {
      const done = Math.min(task.target, Math.max(0, tasks.progressOf(task, this.game)));
      const card = this.el.children[i];
      card.querySelector('.task-bar > span').style.width = `${(done / task.target) * 100}%`;
      card.querySelector('.task-count').textContent = `${formatNumber(done)} / ${formatNumber(task.target)}`;
    });
  }
}
