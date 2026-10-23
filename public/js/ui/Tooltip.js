/** One shared tooltip, Cookie Clicker style. Elements opt in with a data-tip attribute. */
export class Tooltip {
  constructor() {
    this.el = document.getElementById('tooltip');
    this.target = null;
    this.render = null;
  }

  /** Shows a tooltip for any [data-tip] inside `container`, filled with `render(element)`. */
  attach(container, render) {
    const show = (event) => {
      const target = event.target.closest('[data-tip]');
      if (target && container.contains(target)) this.#show(target, render);
    };
    container.addEventListener('mouseover', show);
    container.addEventListener('focusin', show);
    container.addEventListener('mouseout', (event) => {
      if (!this.target?.contains(event.relatedTarget)) this.hide();
    });
    container.addEventListener('focusout', () => this.hide());
  }

  /** Re-renders the open tooltip so prices and rates stay live. */
  refresh() {
    if (!this.target) return;
    if (!this.target.isConnected) return this.hide();
    this.el.innerHTML = this.render(this.target);
    this.#position();
  }

  hide() {
    this.target = null;
    this.el.hidden = true;
  }

  #show(target, render) {
    if (target === this.target) return;
    this.target = target;
    this.render = render;
    this.el.innerHTML = render(target);
    this.el.hidden = false;
    this.#position();
  }

  /** To the left of the element when there's room (the store is on the right), otherwise below it. */
  #position() {
    const box = this.target.getBoundingClientRect();
    const tip = this.el.getBoundingClientRect();
    const roomLeft = box.left - tip.width - 12 >= 8;
    const left = roomLeft ? box.left - tip.width - 12 : Math.min(box.left, innerWidth - tip.width - 8);
    const top = roomLeft ? box.top + box.height / 2 - tip.height / 2 : box.bottom + 8;
    this.el.style.left = `${Math.max(8, left)}px`;
    this.el.style.top = `${Math.max(8, Math.min(top, innerHeight - tip.height - 8))}px`;
  }
}
