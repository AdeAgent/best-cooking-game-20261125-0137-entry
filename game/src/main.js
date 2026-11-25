// Wok Rush — bootstrap and game loop. Wires the canvas to the state machine,
// the pointer and the keyboard, and exposes the game for playtests and for
// the screenshot stages (window.__game, window.__shotReady).
import { CANVAS_W, CANVAS_H } from './config.js';
import { createAudio } from './audio.js';
import {
  newRun, startRun, tick, nextShift,
  addIngredient, stirWok, dumpWok, plateDish, serveCustomer,
} from './state.js';
import { waitingCustomers } from './customers.js';
import { render } from './render.js';
import { canvasPoint, regionAt, keyAction } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const audio = createAudio();
const state = newRun();
let showHelp = false;
let shotMode = false;
let lastTime = performance.now();

// A staged screenshot (?shot=cover|rush|serve) freezes the clock after the
// scene is built: the render stays live (flames flicker) but nothing spawns,
// cooks or leaves, so the shot is stable.
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
if (shotName) {
  const seed = Number(params.get('seed') || '7');
  stageShot(state, shotName, seed);
  shotMode = true;
  state.screen = 'play';
}

function sizzleControl() {
  const cooking = state.screen === 'play' && Object.keys(state.wok.contents).length > 0;
  if (cooking) audio.startSizzle();
  else audio.stopSizzle();
}

function act(action) {
  if (!action) return;
  audio.unlock();
  switch (action.type) {
    case 'add': {
      if (addIngredient(state, action.id)) audio.add();
      break;
    }
    case 'stir':
      if (stirWok(state)) audio.stir();
      break;
    case 'dump':
      if (dumpWok(state)) audio.bad();
      break;
    case 'plate': {
      const dish = plateDish(state);
      if (dish) audio.ready();
      break;
    }
    case 'serveTop': {
      const top = waitingCustomers(state)[0];
      if (top) serveByTicket(top.id);
      break;
    }
    case 'pause':
      if (state.screen === 'play') state.screen = 'paused';
      else if (state.screen === 'paused') state.screen = 'play';
      break;
    case 'mute':
      state.muted = audio.toggleMute();
      break;
    case 'help':
      showHelp = !showHelp;
      break;
    case 'restart':
      if (state.screen !== 'title') startRun(state);
      break;
    case 'confirm':
      if (state.screen === 'title') startRun(state);
      else if (state.screen === 'shiftDone') nextShift(state);
      break;
    default: break;
  }
  sizzleControl();
}

function serveByTicket(customerId) {
  const result = serveCustomer(state, customerId);
  if (result.ok) {
    audio.serve(result.combo);
  } else if (result.why === 'wrong-dish') {
    audio.bad();
    state.message = 'Wrong dish! That customer ordered something else.';
    state.messageAt = state.elapsed;
  }
}

function onPointer(event) {
  audio.unlock();
  if (showHelp) { showHelp = false; return; }
  if (state.screen === 'title') { startRun(state); return; }
  if (state.screen === 'shiftDone') { nextShift(state); return; }
  if (state.screen === 'nightDone' || state.screen === 'gameOver') { startRun(state); return; }
  if (state.screen === 'paused') { state.screen = 'play'; return; }
  const p = canvasPoint(canvas, event);
  const region = regionAt(state, p.x, p.y);
  if (!region) return;
  switch (region.kind) {
    case 'bin':
      if (addIngredient(state, region.id)) audio.add();
      break;
    case 'wok':
      if (stirWok(state)) audio.stir();
      break;
    case 'plate': {
      const dish = plateDish(state);
      if (dish) audio.ready();
      break;
    }
    case 'trash':
      if (dumpWok(state)) audio.bad();
      break;
    case 'ticket':
      serveByTicket(region.id);
      break;
    case 'mute':
      state.muted = audio.toggleMute();
      break;
    case 'help':
      showHelp = true;
      break;
    default: break;
  }
  sizzleControl();
}

canvas.addEventListener('pointerdown', onPointer);
window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }
  act(keyAction(event));
});

// The loop: fixed-step updates, render every frame. In shot mode the state
// never ticks — the scene is frozen, only the flames and steam animate.
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotMode && state.screen === 'play') tick(state, dt);
  render(ctx, state, now / 1000, showHelp);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Playtest and screenshot hooks. __game exposes live state; __shotReady
// flips once the staged scene has rendered a few frames.
window.__game = { state, screen: () => state.screen, audio };
window.__shotReady = false;
if (shotMode) {
  let frames = 0;
  const watch = () => {
    frames += 1;
    if (frames >= 5) window.__shotReady = true;
    else requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
} else {
  window.__shotReady = true;
}
