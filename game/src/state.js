// Wok Rush — the run itself: screens, shifts, coins, hearts and combos.
// Everything the render and input layers need lives in one plain object so a
// screenshot stage can build a mid-game state with the same functions play uses.
import {
  SHIFTS, MAX_HEARTS, COMBO_WINDOW_SEC, SERVE_PERFECT_AT, DISH_BY_ID, MASH,
} from './config.js';
import { makeWok, wokAdd, wokTick, wokStir, wokDump, wokClear, wokEmpty } from './wok.js';
import { makeCustomer, spawnDue, tickPatience, waitingCustomers, resetCustomerIds } from './customers.js';
import { matchDish, plateResult } from './recipes.js';

export const SCREENS = ['title', 'play', 'paused', 'shiftDone', 'nightDone', 'gameOver'];

export function newRun() {
  resetCustomerIds();
  return {
    screen: 'title',
    shiftIndex: 0,
    shiftTimeLeft: SHIFTS[0].duration,
    spawnTimer: 2.5,
    customers: [],
    wok: makeWok(),
    plate: null, // { dish, readyAt } — the dish waiting on the plate station
    coins: 0,
    score: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    lastServeAt: -999,
    elapsed: 0,
    servedCount: 0,
    perfectCount: 0,
    lostCount: 0,
    message: '',
    messageAt: 0,
    popups: [], // floating "+12" coin popups { x, y, text, life }
    muted: false,
    // Shift summary shown on the between-shift screen.
    shiftSummary: null,
  };
}

export function startShift(state, shiftIndex) {
  const shift = SHIFTS[shiftIndex];
  state.shiftIndex = shiftIndex;
  state.shiftTimeLeft = shift.duration;
  state.spawnTimer = 2.0;
  state.customers = [];
  state.wok = makeWok();
  state.plate = null;
  state.screen = 'play';
  state.message = `${shift.label} — first orders coming in!`;
  state.messageAt = state.elapsed;
}

export function startRun(state) {
  const fresh = newRun();
  Object.assign(state, fresh);
  startShift(state, 0);
}

// --- actions the player takes ---

export function addIngredient(state, ingredientId) {
  if (state.screen !== 'play') return false;
  if (!wokAdd(state.wok, ingredientId)) return false;
  return true;
}

export function stirWok(state) {
  if (state.screen !== 'play') return false;
  return wokStir(state.wok);
}

export function dumpWok(state) {
  if (state.screen !== 'play') return false;
  return wokDump(state.wok);
}

// Move the wok's contents onto the plate. Returns the dish or null.
export function plateDish(state) {
  if (state.screen !== 'play' || state.plate) return null;
  const dish = plateResult(state.wok.contents);
  if (!dish) return null;
  state.plate = { dish, readyAt: state.elapsed };
  wokClear(state.wok);
  return dish;
}

// Serve the plated dish to a waiting customer. Exact dish match pays full
// price + tip; Mystery Mash pays its small price to anyone; a wrong dish is
// refused (the plate stays, the customer is unimpressed).
export function serveCustomer(state, customerId) {
  if (state.screen !== 'play' || !state.plate) return { ok: false, why: 'no-plate' };
  const customer = state.customers.find((c) => c.id === customerId && !c.served && !c.left);
  if (!customer) return { ok: false, why: 'no-customer' };
  const dish = state.plate.dish;
  const isMash = dish.id === MASH.id;
  if (!isMash && customer.dishId !== dish.id) return { ok: false, why: 'wrong-dish' };

  const patienceFrac = customer.patience / customer.patienceMax;
  const perfect = patienceFrac >= SERVE_PERFECT_AT;
  const withinCombo = state.elapsed - state.lastServeAt <= COMBO_WINDOW_SEC;
  state.combo = withinCombo ? state.combo + 1 : 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.lastServeAt = state.elapsed;

  const shift = SHIFTS[state.shiftIndex];
  const tip = Math.round(dish.price * shift.tipRate * patienceFrac * (perfect ? 1.5 : 1));
  const comboBonus = (state.combo - 1) * 2;
  const earned = dish.price + tip + comboBonus;
  state.coins += earned;
  state.score += earned * 10 + (perfect ? 50 : 0);
  state.servedCount += 1;
  if (perfect) state.perfectCount += 1;
  customer.served = true;
  customer.servedAt = state.elapsed;
  state.plate = null;
  state.popups.push({ x: 0, y: 0, text: `+${earned}`, life: 1.4, kind: perfect ? 'perfect' : 'coins' });
  state.message = perfect
    ? `Perfect serve! ${customer.name} loved the ${dish.name}.`
    : `${customer.name} got the ${dish.name} — +${earned} coins.`;
  state.messageAt = state.elapsed;
  return { ok: true, earned, perfect, combo: state.combo };
}

// --- the clock ---

export function tick(state, dt) {
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  state.shiftTimeLeft -= dt;

  const shift = SHIFTS[state.shiftIndex];
  wokTick(state.wok, dt, shift.heatRise);

  if (spawnDue(state, dt)) {
    state.customers.push(makeCustomer(shift, Math.random));
  }
  const stormed = tickPatience(state, dt);
  for (const c of stormed) {
    state.hearts -= 1;
    state.lostCount += 1;
    state.combo = 0;
    state.message = `${c.name} stormed off — no ${DISH_BY_ID[c.dishId].name} in time!`;
    state.messageAt = state.elapsed;
  }
  for (const p of state.popups) p.life -= dt;
  state.popups = state.popups.filter((p) => p.life > 0);

  // Keep the queue tidy: served and departed tickets leave the board.
  state.customers = state.customers.filter((c) => {
    if (c.served) return state.elapsed - (c.servedAt ?? state.elapsed) < 0.9;
    return true;
  });

  if (state.hearts <= 0) {
    state.hearts = 0;
    state.screen = 'gameOver';
    return;
  }
  if (state.shiftTimeLeft <= 0) {
    state.shiftTimeLeft = 0;
    finishShift(state);
  }
}

function finishShift(state) {
  const shift = SHIFTS[state.shiftIndex];
  const waiting = waitingCustomers(state).length;
  const bonus = state.hearts * 10 - waiting * 3;
  state.coins += Math.max(0, bonus);
  state.shiftSummary = {
    label: shift.label,
    served: state.servedCount,
    perfect: state.perfectCount,
    lost: state.lostCount,
    coins: state.coins,
    bonus: Math.max(0, bonus),
  };
  state.customers = [];
  state.wok = makeWok();
  state.plate = null;
  if (state.shiftIndex + 1 < SHIFTS.length) {
    state.screen = 'shiftDone';
  } else {
    state.screen = 'nightDone';
  }
}

export function nextShift(state) {
  startShift(state, state.shiftIndex + 1);
  state.hearts = MAX_HEARTS;
}

export { wokEmpty, matchDish };
