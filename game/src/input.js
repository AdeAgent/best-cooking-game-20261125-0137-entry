// Wok Rush — mouse and keyboard. Every action has both: click a bin or press
// its number, click the wok or press Space to stir, click a ticket to serve.
// Hit regions are computed from the same layout the renderer draws, so a
// click never lands somewhere the eye did not expect.
import { INGREDIENTS, LAYOUT, CANVAS_W, CANVAS_H } from './config.js';
import { waitingCustomers } from './customers.js';

// Where the clickable things are, in canvas pixels.
export function hitRegions(state) {
  const regions = [];
  const bins = LAYOUT.bins;
  const binW = bins.w / INGREDIENTS.length;
  INGREDIENTS.forEach((ing, i) => {
    regions.push({
      kind: 'bin', id: ing.id, label: ing.name,
      x: bins.x + i * binW + 4, y: bins.y + 6, w: binW - 8, h: bins.h - 12,
    });
  });
  regions.push({ kind: 'wok', x: LAYOUT.wok.cx - LAYOUT.wok.r, y: LAYOUT.wok.cy - LAYOUT.wok.r, w: LAYOUT.wok.r * 2, h: LAYOUT.wok.r * 2 });
  regions.push({ kind: 'plate', x: LAYOUT.plate.cx - LAYOUT.plate.r, y: LAYOUT.plate.cy - LAYOUT.plate.r, w: LAYOUT.plate.r * 2, h: LAYOUT.plate.r * 2 });
  // The drawn PLATE (P) button under the plate station.
  regions.push({ kind: 'plate', x: LAYOUT.plate.cx - 62, y: LAYOUT.plate.cy + LAYOUT.plate.r + 58, w: 124, h: 38 });
  regions.push({ kind: 'trash', ...LAYOUT.trash });
  // Tickets, top to bottom in the order board.
  const waiting = waitingCustomers(state);
  waiting.forEach((c, i) => {
    regions.push({
      kind: 'ticket', id: c.id, label: c.name,
      x: LAYOUT.board.x + 6, y: LAYOUT.board.y + 8 + i * 132, w: LAYOUT.board.w - 12, h: 122,
    });
  });
  // Bottom-bar buttons.
  regions.push({ kind: 'mute', x: CANVAS_W - 190, y: CANVAS_H - 66, w: 84, h: 44 });
  regions.push({ kind: 'help', x: CANVAS_W - 96, y: CANVAS_H - 66, w: 84, h: 44 });
  return regions;
}

export function regionAt(state, x, y) {
  // Tickets and bins sit above the wok/plate, so check them first.
  const regions = hitRegions(state);
  const order = ['ticket', 'bin', 'trash', 'plate', 'wok', 'mute', 'help'];
  for (const kind of order) {
    const r = regions.find((g) => g.kind === kind && x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h);
    if (r) return r;
  }
  return null;
}

// Translate a DOM pointer event into canvas pixels (the canvas is scaled by CSS).
export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
  };
}

// Keyboard: numbers pick ingredients, Space stirs, P plates, S serves the
// top ticket, T dumps the wok, Esc pauses, M mutes, H shows help, R restarts.
export function keyAction(event) {
  const k = event.key;
  if (k >= '1' && k <= '8') {
    const ing = INGREDIENTS[Number(k) - 1];
    return ing ? { type: 'add', id: ing.id } : null;
  }
  switch (k) {
    case ' ': return { type: 'stir' };
    case 'p': case 'P': return { type: 'plate' };
    case 's': case 'S': return { type: 'serveTop' };
    case 't': case 'T': return { type: 'dump' };
    case 'Escape': return { type: 'pause' };
    case 'm': case 'M': return { type: 'mute' };
    case 'h': case 'H': return { type: 'help' };
    case 'r': case 'R': return { type: 'restart' };
    case 'Enter': return { type: 'confirm' };
    default: return null;
  }
}
