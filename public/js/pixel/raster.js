import { rgb, shade } from './color.js';

/** A small grid of colours that shapes are painted into, then outlined, shaded and turned into a canvas. */
export class PixelGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(null);
  }

  /** Hand-drawn art: one string per row, one character per pixel, looked up in `palette` ('.' is empty). */
  static fromRows(rows, palette, padding = 0) {
    const grid = new PixelGrid(rows[0].length + padding * 2, rows.length + padding * 2);
    rows.forEach((row, y) => [...row].forEach((char, x) => grid.set(x + padding, y + padding, palette[char] ?? null)));
    return grid;
  }

  get(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height ? this.cells[y * this.width + x] : null;
  }

  set(x, y, color) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) this.cells[y * this.width + x] = color;
  }

  /** Paints every cell whose centre is `inside`; with `within`, only cells painted in that grid. */
  fill(inside, color, within = null) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if ((!within || within.get(x, y)) && inside(x + 0.5, y + 0.5)) this.cells[y * this.width + x] = color;
      }
    }
  }

  ellipse(cx, cy, rx, ry, color, { angle = 0, within = null } = {}) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.fill((x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      return ((dx * cos + dy * sin) / rx) ** 2 + ((dy * cos - dx * sin) / ry) ** 2 <= 1;
    }, color, within);
  }

  polygon(points, color, { within = null } = {}) {
    this.fill((x, y) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, color, within);
  }

  /** A 1px line between two cells (Bresenham). */
  line(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) return;
      const e2 = 2 * error;
      if (e2 >= dy) { error += dy; x0 += sx; }
      if (e2 <= dx) { error += dx; y0 += sy; }
    }
  }

  /** Rings everything painted so far with a 1px outline. */
  outline(color) {
    const painted = this.cells.slice();
    const at = (x, y) => x >= 0 && y >= 0 && x < this.width && y < this.height && painted[y * this.width + x];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) this.set(x, y, color);
      }
    }
  }

  /** Top-lit shading: cells with open space above get lighter, cells with open space below get darker. */
  shade(outlineColor, amount = 0.16) {
    const before = this.cells.slice();
    const open = (x, y) => {
      const cell = y >= 0 && y < this.height ? before[y * this.width + x] : null;
      return !cell || cell === outlineColor;
    };
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = before[y * this.width + x];
        if (!cell || cell === outlineColor) continue;
        if (open(x, y - 1)) this.cells[y * this.width + x] = shade(cell, amount);
        else if (open(x, y + 1)) this.cells[y * this.width + x] = shade(cell, -amount * 1.3);
      }
    }
  }

  /** A copy trimmed to the painted area plus `margin` empty cells on every side. */
  crop(margin = 0) {
    let [left, top, right, bottom] = [this.width, this.height, -1, -1];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.get(x, y)) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    const out = new PixelGrid(Math.max(0, right - left + 1) + margin * 2, Math.max(0, bottom - top + 1) + margin * 2);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) out.set(x - left + margin, y - top + margin, this.get(x, y));
    }
    return out;
  }

  /** RGBA bytes for an ImageData, optionally mirrored left-to-right. */
  rgba(flip = false) {
    const data = new Uint8ClampedArray(this.width * this.height * 4);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.cells[y * this.width + (flip ? this.width - 1 - x : x)];
        if (color) data.set([...rgb(color), 255], (y * this.width + x) * 4);
      }
    }
    return data;
  }

  toCanvas(flip = false) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.getContext('2d').putImageData(new ImageData(this.rgba(flip), this.width, this.height), 0, 0);
    return canvas;
  }
}
