// Wok Rush — the wok itself: fire is a resource. Food cooks while the heat
// is up; stir to feed the flame evenly. Let the heat run away and the food
// burns — dump it and start the dish again.
import {
  ING_BY_ID, BURN_AT_HEAT, STIR_COOL, COOK_READY_AT,
} from './config.js';

export function makeWok() {
  return {
    contents: {}, // ingredient id -> { cooked: 0..1, burnt: bool }
    heat: 0, // 0..100, rises while food cooks
    stirAnim: 0, // 0..1, toss animation after a stir
    burnFlash: 0, // 0..1, red flash while something burns
  };
}

export function wokEmpty(wok) {
  return Object.keys(wok.contents).length === 0;
}

// Toss an ingredient into the wok. Returns false when the wok is already full
// of that ingredient (one of each per dish keeps the loop readable).
export function wokAdd(wok, ingredientId) {
  if (wok.contents[ingredientId]) return false;
  wok.contents[ingredientId] = { cooked: 0, burnt: false };
  return true;
}

// One tick of cooking. Heat climbs while anything is in the pan; each piece
// cooks toward done; past the burn line, pieces start to char.
export function wokTick(wok, dt, heatRise) {
  const ids = Object.keys(wok.contents);
  if (ids.length === 0) {
    wok.heat = Math.max(0, wok.heat - dt * 22);
    return;
  }
  wok.heat = Math.min(100, wok.heat + heatRise * dt);
  const burning = wok.heat >= BURN_AT_HEAT;
  for (const id of ids) {
    const piece = wok.contents[id];
    if (piece.burnt) continue;
    // Cooking slows as the piece nears done, so "almost" still needs attention.
    const rate = (1 / ING_BY_ID[id].cook) * (burning ? 0.35 : 1);
    piece.cooked = Math.min(1, piece.cooked + rate * dt);
    if (burning && piece.cooked >= 0.25) {
      piece.burnt = true;
      wok.burnFlash = 1;
    }
  }
  if (wok.stirAnim > 0) wok.stirAnim = Math.max(0, wok.stirAnim - dt * 2.2);
  if (wok.burnFlash > 0) wok.burnFlash = Math.max(0, wok.burnFlash - dt * 1.5);
}

// Stir: knock the heat down and toss the food (the animation sells the action).
// Returns false when there is nothing to stir.
export function wokStir(wok) {
  if (wokEmpty(wok)) return false;
  wok.heat = Math.max(0, wok.heat - STIR_COOL);
  wok.stirAnim = 1;
  return true;
}

// Dump a burnt wok into the trash. Returns false when there is nothing to dump.
export function wokDump(wok) {
  if (wokEmpty(wok)) return false;
  wok.contents = {};
  wok.heat = 0;
  wok.burnFlash = 0;
  return true;
}

// Clear the wok after plating (the food is on the plate now).
export function wokClear(wok) {
  wok.contents = {};
  wok.heat = Math.max(0, wok.heat - 30);
}

export { COOK_READY_AT };
