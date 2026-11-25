// Wok Rush — everything the eye sees, drawn on one canvas. All art is vector
// shapes painted here at run time: no image files, no fonts beyond the system
// sans, no network. The layout keeps the whole game on one screen: order
// board left, wok and plate centre, rush meter right, timer always on top.
import {
  CANVAS_W, CANVAS_H, PALETTE, LAYOUT, INGREDIENTS, ING_BY_ID,
  DISH_BY_ID, SHIFTS, MASH, BURN_AT_HEAT,
} from './config.js';
import { waitingCustomers } from './customers.js';
import { wokProgress, wokStatus, matchDish } from './recipes.js';
import { wokEmpty } from './wok.js';

const P = PALETTE;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- food icons: small vector drawings, one per ingredient ---

export function drawIngredientIcon(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.lineCap = 'round';
  switch (id) {
    case 'noodle': {
      ctx.strokeStyle = '#f2c14e';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, (i - 1) * s * 0.16, s * 0.3, Math.PI * 0.15, Math.PI * 0.95);
        ctx.stroke();
      }
      ctx.strokeStyle = '#c98f2a';
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.28); ctx.lineTo(s * 0.34, -s * 0.28); ctx.stroke();
      break;
    }
    case 'rice': {
      ctx.fillStyle = '#f7ead0';
      for (const [dx, dy, r] of [[-0.22, 0.12, 0.2], [0, -0.05, 0.24], [0.22, 0.14, 0.18], [-0.05, 0.2, 0.16], [0.18, -0.16, 0.14]]) {
        ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#cbb98d'; ctx.beginPath(); ctx.ellipse(0, s * 0.28, s * 0.34, s * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'chicken': {
      ctx.fillStyle = '#e8a04c';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.3, s * 0.26, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f7ead0'; ctx.lineWidth = s * 0.09;
      ctx.beginPath(); ctx.moveTo(s * 0.16, s * 0.12); ctx.lineTo(s * 0.34, s * 0.3); ctx.stroke();
      ctx.fillStyle = '#f7ead0';
      ctx.beginPath(); ctx.arc(s * 0.36, s * 0.32, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.28, s * 0.38, s * 0.07, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'shrimp': {
      ctx.strokeStyle = '#ff8a7a'; ctx.lineWidth = s * 0.16;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.26, Math.PI * 0.2, Math.PI * 1.5); ctx.stroke();
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.26, Math.PI * 0.4, Math.PI * 1.2); ctx.stroke();
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.18); ctx.lineTo(s * 0.38, -s * 0.3); ctx.lineTo(s * 0.34, -s * 0.08); ctx.closePath(); ctx.fill();
      break;
    }
    case 'greens': {
      ctx.fillStyle = '#58b368';
      for (const [dx, dy, rot] of [[-0.16, 0.05, -0.5], [0.14, 0.02, 0.5], [0, -0.18, 0]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(rot);
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.14, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#3c8a4a'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.lineTo(0, -s * 0.05); ctx.stroke();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.36, s * 0.3, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(s * 0.04, -s * 0.02, s * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5b942';
      ctx.beginPath(); ctx.arc(s * 0.04, -s * 0.02, s * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'chili': {
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = s * 0.13;
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.1); ctx.quadraticCurveTo(0, s * 0.34, s * 0.3, -s * 0.14); ctx.stroke();
      ctx.strokeStyle = '#58b368'; ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.14); ctx.lineTo(s * 0.38, -s * 0.3); ctx.stroke();
      break;
    }
    case 'soy': {
      ctx.fillStyle = '#7a4a21';
      rr(ctx, -s * 0.14, -s * 0.28, s * 0.28, s * 0.56, s * 0.08); ctx.fill();
      ctx.fillStyle = '#a9713f';
      rr(ctx, -s * 0.1, -s * 0.38, s * 0.2, s * 0.14, s * 0.04); ctx.fill();
      ctx.fillStyle = '#f7ead0';
      ctx.font = `bold ${Math.round(s * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SOY', 0, s * 0.14);
      break;
    }
    default: break;
  }
  ctx.restore();
}

// A finished dish on a plate: the plate plus one icon per recipe ingredient.
export function drawDishIcon(ctx, dishId, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = P.plate;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.plateRim; ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.stroke();
  const dish = dishId === MASH.id ? MASH : DISH_BY_ID[dishId];
  const ids = dishId === MASH.id ? ['noodle', 'egg', 'chili'] : dish.recipe;
  const n = ids.length;
  ids.forEach((id, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    drawIngredientIcon(ctx, id, Math.cos(ang) * s * 0.2, Math.sin(ang) * s * 0.2, s * 0.34);
  });
  ctx.restore();
}

// --- customer faces: simple, original, readable at ticket size ---

function drawFace(ctx, face, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#f2c69b';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = r * 0.09;
  ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  switch (face) {
    case 'nurse':
      ctx.fillStyle = '#e8f2f7';
      ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.35); ctx.lineTo(r * 0.8, -r * 0.35); ctx.lineTo(r * 0.5, -r * 0.95); ctx.lineTo(-r * 0.5, -r * 0.95); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(-r * 0.12, -r * 0.85, r * 0.24, r * 0.24);
      break;
    case 'elder':
      ctx.fillStyle = '#e8e2d4';
      ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.75, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c9c2b2';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.55, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.55, r * 0.16, 0, Math.PI * 2); ctx.fill();
      break;
    case 'kid':
      ctx.fillStyle = '#e4572e';
      ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f5b942';
      ctx.beginPath(); ctx.arc(0, -r * 1.05, r * 0.22, 0, Math.PI * 2); ctx.fill();
      break;
    case 'driver':
      ctx.fillStyle = '#3a5a8c';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.95, r * 0.5, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3a5a8c'; ctx.fillRect(-r * 0.95, -r * 0.62, r * 1.9, r * 0.18);
      break;
    case 'student':
      ctx.fillStyle = '#5a3a28';
      ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.85, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
      break;
    case 'grandpa':
      ctx.fillStyle = '#d8cfae';
      ctx.beginPath(); ctx.arc(0, r * 0.35, r * 0.55, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#8a5a33';
      ctx.beginPath(); ctx.arc(0, -r * 0.45, r * 0.8, Math.PI, 0); ctx.fill();
      break;
    case 'tourist':
      ctx.fillStyle = '#f5b942';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 1.0, r * 0.35, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(-r * 1.0, -r * 0.68, r * 2.0, r * 0.16);
      break;
    case 'chef':
      ctx.fillStyle = '#f4f1e8';
      ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.72, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(-r * 0.5, -r * 0.5, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.5, r * 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    default: break;
  }
  ctx.restore();
}

// --- background: night sky, string lights, awning, wooden counter ---

function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, P.skyDeep);
  g.addColorStop(0.45, P.sky);
  g.addColorStop(1, '#241a3d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 173) % CANVAS_W;
    const y = ((i * 97) % 120) + 8;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.globalAlpha = tw * 0.7;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // String lights.
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 88;
    const y = 66 + Math.sin(i * 1.3) * 6 + Math.sin(t + i) * 1.5;
    ctx.fillStyle = i % 3 === 0 ? '#ffd94d' : i % 3 === 1 ? '#ff8a7a' : '#8fd0ff';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,217,77,0.12)';
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(CANVAS_W / 2, 84, CANVAS_W, 60); ctx.stroke();
  // Awning stripes across the top.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? P.awning : P.awningStripe;
    ctx.fillRect(i * 80, 0, 80, 26);
  }
  ctx.fillStyle = P.awningDark;
  ctx.fillRect(0, 26, CANVAS_W, 6);
  // Floor: warm boards at the bottom.
  ctx.fillStyle = '#241608';
  ctx.fillRect(0, CANVAS_H - 78, CANVAS_W, 78);
  ctx.fillStyle = '#2e1d0c';
  for (let x = 0; x < CANVAS_W; x += 96) ctx.fillRect(x, CANVAS_H - 78, 2, 78);
}

// --- top bar: title, shift, timer, coins, hearts ---

function drawTopBar(ctx, state) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = 'rgba(10,6,26,0.55)';
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  text(ctx, 'WOK RUSH', 24, 40, 26, P.gold);
  text(ctx, 'Night Market Kitchen', 196, 38, 14, '#cbb98d', 'normal');
  const shift = SHIFTS[state.shiftIndex];
  text(ctx, shift.label, 470, 39, 17, '#f7ead0', 'bold', 'center');
  // The shift timer: big, and red when the rush is on.
  const urgent = state.shiftTimeLeft <= 30;
  const timerColor = urgent ? '#ff6b4a' : '#f7ead0';
  ctx.fillStyle = urgent ? 'rgba(228,87,46,0.25)' : 'rgba(255,255,255,0.08)';
  rr(ctx, 560, 8, 130, 42, 10); ctx.fill();
  text(ctx, fmtTime(state.shiftTimeLeft), 625, 40, 24, timerColor, 'bold', 'center');
  // Coin icon + count.
  ctx.fillStyle = P.gold;
  ctx.beginPath(); ctx.arc(728, 31, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a10';
  text(ctx, 'C', 728, 35, 12, '#8a5a10', 'bold', 'center');
  text(ctx, `${state.coins}`, 744, 39, 20, P.gold, 'bold');
  text(ctx, `Score ${state.score}`, 850, 39, 16, '#cbb98d');
  // Hearts.
  for (let i = 0; i < 3; i++) {
    const x = 1000 + i * 30;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = i < state.hearts ? '#ff6b6b' : 'rgba(255,255,255,0.2)';
    ctx.fillText('♥', x, 40);
  }
  text(ctx, `Served ${state.servedCount}`, 1120, 39, 15, '#cbb98d');
}

// --- order board ---

function drawBoard(ctx, state, t) {
  const b = LAYOUT.board;
  ctx.fillStyle = 'rgba(20,12,8,0.5)';
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  ctx.strokeStyle = P.woodLight; ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 30, 17, P.gold);
  text(ctx, `${waitingCustomers(state).length} waiting`, b.x + b.w - 16, b.y + 30, 13, '#cbb98d', 'normal', 'right');
  const waiting = waitingCustomers(state);
  if (waiting.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 120, 15, '#cbb98d', 'normal', 'center');
    text(ctx, 'the night is young.', b.x + b.w / 2, b.y + 144, 15, '#cbb98d', 'normal', 'center');
  }
  waiting.forEach((c, i) => {
    const y = b.y + 44 + i * 132;
    const x = b.x + 8;
    const w = b.w - 16;
    const h = 122;
    const bob = Math.sin(t * 2 + c.bobPhase) * 2;
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = c.fresh > 0 ? '#fff6dd' : P.paper;
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = P.paperDark; ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10); ctx.stroke();
    drawFace(ctx, c.face, x + 34, y + 36, 26);
    text(ctx, c.name, x + 68, y + 26, 16, P.ink);
    const dish = DISH_BY_ID[c.dishId];
    text(ctx, dish.name, x + 68, y + 48, 14, P.inkSoft, 'normal');
    // Recipe dots: what the ticket needs.
    dish.recipe.forEach((id, j) => {
      const ix = x + 78 + j * 26;
      const iy = y + 72;
      ctx.fillStyle = ING_BY_ID[id].color;
      ctx.beginPath(); ctx.arc(ix, iy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, iy, 9, 0, Math.PI * 2); ctx.stroke();
      drawIngredientIcon(ctx, id, ix, iy, 13);
    });
    text(ctx, `"${c.line}"`, x + 14, y + 100, 11.5, '#8a6f4d', 'normal italic');
    // Patience bar: green to red as the wait drags on.
    const frac = Math.max(0, c.patience / c.patienceMax);
    const barW = w - 28;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rr(ctx, x + 14, y + h - 18, barW, 9, 4.5); ctx.fill();
    const pColor = frac > 0.5 ? P.green : frac > 0.25 ? P.gold : P.red;
    ctx.fillStyle = pColor;
    if (frac > 0) { rr(ctx, x + 14, y + h - 18, barW * frac, 9, 4.5); ctx.fill(); }
    if (frac <= 0.25) {
      ctx.fillStyle = P.red;
      text(ctx, 'HURRY!', x + w - 14, y + h - 24, 12, P.red, 'bold', 'right');
    }
    ctx.restore();
  });
}

// --- kitchen: counter, wok, plate, bins, trash ---

function drawKitchen(ctx, state, t) {
  const k = LAYOUT.kitchen;
  // Counter slab.
  ctx.fillStyle = P.counter;
  rr(ctx, k.x, k.y + 300, k.w, 130, 12); ctx.fill();
  ctx.fillStyle = P.counterTop;
  rr(ctx, k.x, k.y + 300, k.w, 18, 9); ctx.fill();
  ctx.fillStyle = P.woodDark;
  ctx.fillRect(k.x + 8, k.y + 318, 10, 112);
  ctx.fillRect(k.x + k.w - 18, k.y + 318, 10, 112);

  drawWok(ctx, state, t);
  drawPlateStation(ctx, state, t);
  drawBins(ctx, state);

  // Wok status line, above the wok where nothing else lives.
  const status = wokStatus(state.wok.contents);
  const toneColor = status.tone === 'ready' ? P.green : status.tone === 'bad' ? P.red : status.tone === 'mash' ? P.gold : '#cbb98d';
  text(ctx, status.label, LAYOUT.wok.cx, 196, 16, toneColor, 'bold', 'center');
}

function drawWok(ctx, state, t) {
  const { cx, cy, r } = LAYOUT.wok;
  const wok = state.wok;
  // Wok body.
  const toss = wok.stirAnim * 10;
  ctx.save();
  ctx.translate(0, -toss);
  ctx.fillStyle = '#1c1a22';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2e2a38';
  ctx.beginPath(); ctx.arc(cx, cy, r - 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#555066'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.stroke();
  // Handles.
  ctx.strokeStyle = '#555066'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r - 2, cy - 8); ctx.lineTo(cx - r - 26, cy - 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r + 2, cy - 8); ctx.lineTo(cx + r + 26, cy - 20); ctx.stroke();
  // Flames licking the wok's bottom edge, drawn over the body so they read.
  // An empty, cold wok keeps only a pilot light.
  const flameH = (wokEmpty(wok) && wok.heat < 5 ? 8 : 24 + wok.heat * 0.5) + Math.sin(t * 9) * 4;
  const flameColor = wok.heat >= BURN_AT_HEAT ? P.flameHot : P.flame;
  for (let i = 0; i < 5; i++) {
    const fx = cx - 44 + i * 22 + Math.sin(t * 7 + i * 1.7) * 3;
    const fh = flameH * (0.7 + 0.3 * Math.sin(t * 11 + i * 2.3));
    ctx.fillStyle = i % 2 ? flameColor : P.gold;
    ctx.beginPath();
    ctx.moveTo(fx - 9, cy + r + 16);
    ctx.quadraticCurveTo(fx, cy + r + 16 - fh, fx + 9, cy + r + 16);
    ctx.closePath(); ctx.fill();
  }
  // Food pieces inside, each shaded by how cooked it is.
  const ids = Object.keys(wok.contents);
  ids.forEach((id, i) => {
    const piece = wok.contents[id];
    const ang = (i / Math.max(1, ids.length)) * Math.PI * 2 + 0.6;
    const px = cx + Math.cos(ang) * r * 0.42;
    const py = cy + Math.sin(ang) * r * 0.36;
    const s = 62;
    if (piece.burnt) {
      ctx.fillStyle = 'rgba(20,12,8,0.9)';
      ctx.beginPath(); ctx.arc(px, py, s * 0.42, 0, Math.PI * 2); ctx.fill();
      // A little flame over the charred piece.
      ctx.fillStyle = P.flameHot;
      ctx.beginPath();
      ctx.moveTo(px, py - 16);
      ctx.quadraticCurveTo(px + 10, py + 2, px + 5, py + 10);
      ctx.quadraticCurveTo(px, py + 14, px - 5, py + 10);
      ctx.quadraticCurveTo(px - 10, py + 2, px, py - 16);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.55 + 0.45 * piece.cooked;
      drawIngredientIcon(ctx, id, px, py, s);
      ctx.globalAlpha = 1;
      // Cook ring around each piece.
      ctx.strokeStyle = piece.cooked >= 0.9 ? P.green : P.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, s * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * piece.cooked);
      ctx.stroke();
    }
  });
  // Heat gauge: a ring around the wok.
  const heatFrac = wok.heat / 100;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, r + 12, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = wok.heat >= BURN_AT_HEAT ? P.red : heatFrac > 0.55 ? P.gold : P.green;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * heatFrac);
  ctx.stroke();
  // Burn flash.
  if (wok.burnFlash > 0) {
    ctx.fillStyle = `rgba(228,87,46,${wok.burnFlash * 0.25})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (wok.heat >= BURN_AT_HEAT) {
    text(ctx, 'TOO HOT — STIR!', cx, cy - r - 14, 15, P.red, 'bold', 'center');
  }
}

function drawPlateStation(ctx, state, t) {
  const { cx, cy, r } = LAYOUT.plate;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.plate;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.plateRim; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, Math.PI * 2); ctx.stroke();
  if (state.plate) {
    const bob = Math.sin(t * 3) * 2;
    ctx.save(); ctx.translate(0, bob);
    drawDishIcon(ctx, state.plate.dish.id, cx, cy, r * 1.5);
    ctx.restore();
    text(ctx, state.plate.dish.name, cx, cy + r + 26, 15, P.gold, 'bold', 'center');
    text(ctx, 'Click a ticket to serve!', cx, cy + r + 46, 12.5, '#cbb98d', 'normal', 'center');
  } else {
    text(ctx, 'PLATE', cx, cy - 6, 18, '#b8a67e', 'bold', 'center');
    const progress = wokProgress(state.wok.contents);
    if (progress > 0) {
      text(ctx, `${Math.round(progress * 100)}% cooked`, cx, cy + 18, 13, '#b8a67e', 'normal', 'center');
    } else {
      text(ctx, 'Press P to plate', cx, cy + 18, 13, '#b8a67e', 'normal', 'center');
    }
  }
  // Plate button: big and obvious when a dish is ready.
  const ready = state.plate === null && Object.keys(state.wok.contents).length > 0
    && matchDish(state.wok.contents) !== null
    && Object.values(state.wok.contents).every((c) => !c.burnt && c.cooked >= 0.9);
  ctx.fillStyle = ready ? P.green : 'rgba(255,255,255,0.12)';
  rr(ctx, cx - 62, cy + r + 58, 124, 38, 10); ctx.fill();
  text(ctx, 'PLATE (P)', cx, cy + r + 83, 14, ready ? '#0e2a12' : '#cbb98d', 'bold', 'center');
}

function drawBins(ctx, state) {
  const bins = LAYOUT.bins;
  const binW = bins.w / INGREDIENTS.length;
  text(ctx, 'INGREDIENTS — click or press 1–8', bins.x + bins.w / 2, bins.y - 8, 13, '#cbb98d', 'bold', 'center');
  INGREDIENTS.forEach((ing, i) => {
    const x = bins.x + i * binW + 4;
    const y = bins.y + 6;
    const w = binW - 8;
    const h = bins.h - 12;
    const inWok = !!state.wok.contents[ing.id];
    ctx.fillStyle = inWok ? 'rgba(88,179,104,0.25)' : 'rgba(255,255,255,0.07)';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = inWok ? P.green : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10); ctx.stroke();
    drawIngredientIcon(ctx, ing.id, x + w / 2, y + h / 2 - 12, 44);
    text(ctx, ing.name, x + w / 2, y + h - 26, 12, '#f7ead0', 'bold', 'center');
    text(ctx, ing.key, x + w - 12, y + 18, 12, '#cbb98d', 'bold', 'right');
    if (inWok) text(ctx, '✓ in wok', x + w / 2, y + h - 10, 10.5, P.green, 'bold', 'center');
  });
}

// The trash lives in the side panel now: a wide button, never on top of the
// plate. Clicking it (or T) dumps a burnt wok.
function drawTrash(ctx, state) {
  const tr = LAYOUT.trash;
  const hasFood = Object.keys(state.wok.contents).length > 0;
  ctx.fillStyle = hasFood ? 'rgba(228,87,46,0.3)' : 'rgba(255,255,255,0.08)';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 10); ctx.fill();
  ctx.strokeStyle = hasFood ? P.red : 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 10); ctx.stroke();
  // A small can icon.
  ctx.fillStyle = '#9aa0ad';
  ctx.fillRect(tr.x + 16, tr.y + 8, 22, 4);
  ctx.strokeStyle = '#9aa0ad'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(tr.x + 20, tr.y + 15); ctx.lineTo(tr.x + 20, tr.y + 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tr.x + 27, tr.y + 15); ctx.lineTo(tr.x + 27, tr.y + 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tr.x + 34, tr.y + 15); ctx.lineTo(tr.x + 34, tr.y + 32); ctx.stroke();
  text(ctx, 'DUMP WOK  (T)', tr.x + 52, tr.y + 27, 14, hasFood ? '#ffb3a0' : '#cbb98d', 'bold');
}

// --- side panel: combo, rush, message ---

function drawSide(ctx, state, t) {
  const s = LAYOUT.side;
  ctx.fillStyle = 'rgba(20,12,8,0.5)';
  rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.fill();
  ctx.strokeStyle = P.woodLight; ctx.lineWidth = 2;
  rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.stroke();
  text(ctx, 'THE RUSH', s.x + 16, s.y + 30, 17, P.gold);
  // Combo flame.
  const combo = state.combo;
  const flameScale = combo > 0 ? 1 + Math.min(combo, 8) * 0.06 : 1;
  ctx.save();
  ctx.translate(s.x + 46, s.y + 92);
  ctx.scale(flameScale, flameScale);
  ctx.fillStyle = combo >= 3 ? P.flameHot : combo > 0 ? P.flame : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.quadraticCurveTo(18, -4, 12, 12);
  ctx.quadraticCurveTo(6, 22, 0, 22);
  ctx.quadraticCurveTo(-6, 22, -12, 12);
  ctx.quadraticCurveTo(-18, -4, 0, -26);
  ctx.fill();
  ctx.restore();
  text(ctx, combo > 0 ? `COMBO ×${combo}` : 'No combo yet', s.x + 84, s.y + 84, 20, combo > 0 ? P.gold : '#cbb98d');
  text(ctx, combo > 0 ? 'Serve fast to keep it burning!' : 'Serve within 9s of the last dish.', s.x + 84, s.y + 106, 12, '#cbb98d', 'normal');
  text(ctx, `Best combo ×${state.bestCombo}`, s.x + 16, s.y + 140, 13, '#cbb98d', 'normal');
  // Menu for this shift.
  text(ctx, "TONIGHT'S MENU", s.x + 16, s.y + 176, 14, P.gold);
  const shift = SHIFTS[state.shiftIndex];
  // Tighter rows when all five dishes are on the menu.
  const step = shift.dishes.length > 4 ? 42 : 52;
  const iconS = shift.dishes.length > 4 ? 34 : 40;
  shift.dishes.forEach((dishId, i) => {
    const dish = DISH_BY_ID[dishId];
    const y = s.y + 196 + i * step;
    drawDishIcon(ctx, dishId, s.x + 34, y + 14, iconS);
    text(ctx, dish.name, s.x + 62, y + 12, 14, '#f7ead0');
    text(ctx, `${dish.recipe.map((id) => ING_BY_ID[id].name).join(' + ')}  ·  ${dish.price} coins`, s.x + 62, y + 32, 11.5, '#cbb98d', 'normal');
  });
  // Message line.
  const msgAge = state.elapsed - state.messageAt;
  if (state.message && msgAge < 6) {
    ctx.globalAlpha = Math.min(1, 6 - msgAge);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, s.x + 12, s.y + 406, s.w - 24, 58, 10); ctx.fill();
    const words = wrapText(state.message, 34);
    words.forEach((line, i) => text(ctx, line, s.x + 22, s.y + 430 + i * 18, 13, '#f7ead0', 'normal'));
    ctx.globalAlpha = 1;
  }
  text(ctx, 'Tip: stir often —', s.x + 16, s.y + 482, 12, '#8a6f4d', 'normal');
  text(ctx, 'a cool wok never burns.', s.x + 16, s.y + 500, 12, '#8a6f4d', 'normal');
  drawTrash(ctx, state);
}

function wrapText(s, maxLen) {
  const words = s.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen && line) { lines.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

// --- bottom bar: keys, mute, help ---

function drawBottomBar(ctx, state) {
  const b = LAYOUT.bottomBar;
  ctx.fillStyle = 'rgba(10,6,26,0.55)';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, '1–8 add ingredient   •   SPACE stir   •   P plate   •   Click a ticket to serve   •   T dump   •   ESC pause', 20, CANVAS_H - 30, 14, '#cbb98d', 'normal');
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, CANVAS_W - 190, CANVAS_H - 66, 84, 44, 10); ctx.fill();
  text(ctx, state.muted ? 'Sound OFF' : 'Sound ON', CANVAS_W - 148, CANVAS_H - 38, 13, '#f7ead0', 'bold', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, CANVAS_W - 96, CANVAS_H - 66, 84, 44, 10); ctx.fill();
  text(ctx, '? Help (H)', CANVAS_W - 54, CANVAS_H - 38, 13, '#f7ead0', 'bold', 'center');
}

// --- coin popups ---

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    // Popups rise above the plate, clear of the dish itself.
    const y = LAYOUT.plate.cy - 118 - (1.4 - p.life) * 50;
    ctx.globalAlpha = Math.min(1, p.life);
    text(ctx, p.text, LAYOUT.plate.cx, y, 30, p.kind === 'perfect' ? '#ffd94d' : P.gold, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

// --- screens ---

function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(10,6,26,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const bob = Math.sin(t * 1.5) * 4;
  ctx.save();
  ctx.translate(0, bob);
  drawDishIcon(ctx, 'night-feast', CANVAS_W / 2, 150, 150);
  ctx.restore();
  text(ctx, 'WOK RUSH', CANVAS_W / 2, 250, 64, P.gold, 'bold', 'center');
  text(ctx, '— Night Market Kitchen —', CANVAS_W / 2, 286, 20, '#f7ead0', 'normal', 'center');
  text(ctx, 'Fire is a resource. Stir to feed the flame, toss the right', CANVAS_W / 2, 330, 17, '#cbb98d', 'normal', 'center');
  text(ctx, 'ingredients in rhythm, and serve every regular before their', CANVAS_W / 2, 354, 17, '#cbb98d', 'normal', 'center');
  text(ctx, 'patience runs out. Three shifts. One wok. No mercy.', CANVAS_W / 2, 378, 17, '#cbb98d', 'normal', 'center');
  text(ctx, 'HOW TO PLAY', CANVAS_W / 2, 424, 15, P.gold, 'bold', 'center');
  const lines = [
    '1–8 or click — toss an ingredient into the wok',
    'SPACE or click the wok — stir, cool the fire, keep food from burning',
    'P — plate the dish when every ingredient is cooked through',
    'Click a ticket — serve the matching dish before patience runs out',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 452 + i * 24, 15, '#f7ead0', 'normal', 'center'));
  const pulse = 0.7 + 0.3 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Click or press ENTER to open the stall', CANVAS_W / 2, 580, 20, '#ffd94d', 'bold', 'center');
  ctx.globalAlpha = 1;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10,6,26,0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', CANVAS_W / 2, 320, 48, P.gold, 'bold', 'center');
  text(ctx, 'ESC to keep cooking   •   R to restart the night', CANVAS_W / 2, 360, 16, '#f7ead0', 'normal', 'center');
}

function drawHelp(ctx) {
  ctx.fillStyle = 'rgba(10,6,26,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'HOW TO PLAY', CANVAS_W / 2, 130, 34, P.gold, 'bold', 'center');
  const lines = [
    'Orders arrive on the board — each ticket names a dish and its ingredients.',
    'Toss ingredients into the wok (click a bin or press 1–8).',
    'Food cooks while the fire is up. Watch the heat ring: at the red line it burns.',
    'Stir (SPACE or click the wok) to cool the fire and toss the food.',
    'When a dish matches a recipe and everything is cooked, press P to plate it.',
    'Click the matching ticket to serve. Fast serves earn tips and build combos.',
    'A wrong pile plates as Mystery Mash — cheap, but any customer will take it.',
    'Burnt food must be dumped (T or the trash can) before you can cook again.',
    'A customer who waits too long storms off and costs a heart. Three hearts, three shifts.',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 180 + i * 34, 16, '#f7ead0', 'normal', 'center'));
  text(ctx, 'H or click anywhere to close', CANVAS_W / 2, 560, 15, '#cbb98d', 'normal', 'center');
}

function drawShiftDone(ctx, state) {
  ctx.fillStyle = 'rgba(10,6,26,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const s = state.shiftSummary;
  text(ctx, `${s.label} — DONE!`, CANVAS_W / 2, 200, 44, P.gold, 'bold', 'center');
  const rows = [
    [`Dishes served`, `${s.served}`],
    [`Perfect serves`, `${s.perfect}`],
    [`Customers lost`, `${s.lost}`],
    [`Heart bonus`, `+${s.bonus} coins`],
    [`Coins so far`, `${s.coins} coins`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, CANVAS_W / 2 - 160, 260 + i * 36, 18, '#f7ead0', 'normal');
    text(ctx, value, CANVAS_W / 2 + 160, 260 + i * 36, 18, P.gold, 'bold', 'right');
  });
  text(ctx, 'The next shift brings more customers and less patience.', CANVAS_W / 2, 470, 16, '#cbb98d', 'normal', 'center');
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER for the next shift', CANVAS_W / 2, 520, 20, '#ffd94d', 'bold', 'center');
  ctx.globalAlpha = 1;
}

function drawNightDone(ctx, state) {
  ctx.fillStyle = 'rgba(10,6,26,0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'THE NIGHT IS YOURS!', CANVAS_W / 2, 190, 44, P.gold, 'bold', 'center');
  text(ctx, 'Three shifts, one wok, and a market full of happy regulars.', CANVAS_W / 2, 232, 17, '#f7ead0', 'normal', 'center');
  const rows = [
    [`Dishes served`, `${state.servedCount}`],
    [`Perfect serves`, `${state.perfectCount}`],
    [`Best combo`, `×${state.bestCombo}`],
    [`Final coins`, `${state.coins} coins`],
    [`Final score`, `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, CANVAS_W / 2 - 160, 290 + i * 36, 18, '#f7ead0', 'normal');
    text(ctx, value, CANVAS_W / 2 + 160, 290 + i * 36, 18, P.gold, 'bold', 'right');
  });
  text(ctx, 'Press R to run the stall again', CANVAS_W / 2, 520, 18, '#ffd94d', 'bold', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(10,6,26,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'THE STALL CLOSES EARLY', CANVAS_W / 2, 200, 40, P.red, 'bold', 'center');
  text(ctx, 'Too many regulars stormed off hungry.', CANVAS_W / 2, 244, 17, '#f7ead0', 'normal', 'center');
  const rows = [
    [`Shift reached`, SHIFTS[state.shiftIndex].label],
    [`Dishes served`, `${state.servedCount}`],
    [`Coins earned`, `${state.coins} coins`],
    [`Score`, `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, CANVAS_W / 2 - 160, 300 + i * 36, 18, '#f7ead0', 'normal');
    text(ctx, value, CANVAS_W / 2 + 160, 300 + i * 36, 18, P.gold, 'bold', 'right');
  });
  text(ctx, 'Press R to open the stall again', CANVAS_W / 2, 500, 18, '#ffd94d', 'bold', 'center');
}

// --- the frame ---

export function render(ctx, state, t, showHelp) {
  drawBackground(ctx, t);
  if (state.screen === 'title') {
    drawTitle(ctx, state, t);
    return;
  }
  drawTopBar(ctx, state);
  drawBoard(ctx, state, t);
  drawKitchen(ctx, state, t);
  drawSide(ctx, state, t);
  drawBottomBar(ctx, state);
  drawPopups(ctx, state);
  if (state.screen === 'paused') drawPaused(ctx);
  if (state.screen === 'shiftDone') drawShiftDone(ctx, state);
  if (state.screen === 'nightDone') drawNightDone(ctx, state);
  if (state.screen === 'gameOver') drawGameOver(ctx, state);
  if (showHelp) drawHelp(ctx);
}

export { fmtTime };
