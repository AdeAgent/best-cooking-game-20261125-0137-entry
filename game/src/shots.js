// Wok Rush — screenshot staging. ?shot=cover|rush|serve&seed=N builds a real
// mid-game state through the same functions play uses (spawn a customer, toss
// ingredients into the wok, plate a dish), then freezes the clock so the
// screenshot is a stable render of the game's own code — never a mock-up.
// The seeded RNG makes the staged scene reproducible.
import { SHIFTS, DISH_BY_ID } from './config.js';
import { makeCustomer } from './customers.js';
import { wokAdd } from './wok.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stage one named scene on a fresh run. Returns nothing; the caller renders.
export function stageShot(state, name, seed) {
  const rng = mulberry32(seed);
  // Start a real shift, then fast-forward the clock to mid-shift.
  state.screen = 'play';
  state.shiftIndex = name === 'rush' ? 1 : 0;
  const shift = SHIFTS[state.shiftIndex];
  state.shiftTimeLeft = name === 'cover' ? 72 : name === 'rush' ? 41 : 118;
  state.elapsed = shift.duration - state.shiftTimeLeft;
  state.coins = name === 'cover' ? 86 : name === 'rush' ? 142 : 58;
  state.score = state.coins * 10 + 120;
  state.combo = name === 'rush' ? 4 : name === 'cover' ? 2 : 0;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.servedCount = name === 'cover' ? 6 : name === 'rush' ? 11 : 4;
  state.spawnTimer = 6;

  // A queue of real customers with real orders and staggered patience.
  const queue = name === 'rush' ? 4 : 3;
  for (let i = 0; i < queue; i++) {
    const c = makeCustomer(shift, rng);
    c.patience = c.patienceMax * (name === 'rush' ? [0.92, 0.55, 0.3, 0.14][i] : [0.85, 0.6, 0.4][i]);
    c.fresh = 0;
    state.customers.push(c);
  }

  if (name === 'cover') {
    // One dish mid-assembly in the wok: two ingredients in, one cooking.
    wokAdd(state.wok, 'noodle');
    wokAdd(state.wok, 'chicken');
    state.wok.contents.noodle.cooked = 0.95;
    state.wok.contents.chicken.cooked = 0.55;
    state.wok.heat = 58;
    // And one plate ready to serve on the plate station.
    state.plate = { dish: DISH_BY_ID['ember-rice'], readyAt: state.elapsed };
    state.message = 'Ember Fried Rice is ready — serve it!';
    state.messageAt = state.elapsed;
  } else if (name === 'rush') {
    // A full wok at high heat: the rush-hour moment, stir or burn.
    for (const id of ['noodle', 'shrimp', 'chili']) wokAdd(state.wok, id);
    state.wok.contents.noodle.cooked = 0.9;
    state.wok.contents.shrimp.cooked = 0.8;
    state.wok.contents.chili.cooked = 0.7;
    state.wok.heat = 82;
    state.message = 'Rush hour! Stir that wok!';
    state.messageAt = state.elapsed;
  } else if (name === 'serve') {
    // A finished dish on the plate, a happy customer waiting to take it.
    state.plate = { dish: DISH_BY_ID['lantern-noodles'], readyAt: state.elapsed };
    state.customers[0].dishId = 'lantern-noodles';
    state.customers[0].name = 'Mira';
    state.customers[0].line = 'Night shift soon — make it fast!';
    state.popups.push({ x: 0, y: 0, text: '+24', life: 1.2, kind: 'perfect' });
    state.message = 'Perfect serve! Mira loved the Lantern Noodles.';
    state.messageAt = state.elapsed;
  }
}
