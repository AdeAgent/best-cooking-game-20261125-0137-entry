// Wok Rush — the menu: what a pile of wok contents is, and what it is worth.
// Matching is set-based: a dish matches when the wok holds exactly its recipe
// (order never matters), every ingredient cooked through, nothing burnt.
import { DISH_BY_ID, DISHES, ING_BY_ID, MASH, COOK_READY_AT } from './config.js';

// The wok holds one entry per ingredient id: { cooked: 0..1, burnt: bool }.
// Returns the dish the wok currently is, or null when it matches nothing.
export function matchDish(wokContents) {
  const ids = Object.keys(wokContents).sort();
  if (ids.length === 0) return null;
  for (const dish of DISHES) {
    const recipe = [...dish.recipe].sort();
    if (ids.length === recipe.length && ids.every((id, i) => id === recipe[i])) {
      return dish;
    }
  }
  return null;
}

// Is this wok ready to plate? Every ingredient cooked past the ready line,
// nothing burnt, and the pile matches a real dish.
export function wokReadyToPlate(wokContents) {
  const dish = matchDish(wokContents);
  if (!dish) return false;
  return Object.values(wokContents).every((c) => !c.burnt && c.cooked >= COOK_READY_AT);
}

// A wok that matches no dish plates as Mystery Mash — cheap, but servable to
// anyone, so a wrong toss never hard-locks the run.
export function plateResult(wokContents) {
  if (Object.keys(wokContents).length === 0) return null;
  if (wokReadyToPlate(wokContents)) return matchDish(wokContents);
  const anyBurnt = Object.values(wokContents).some((c) => c.burnt);
  const anyCooked = Object.values(wokContents).some((c) => c.cooked >= COOK_READY_AT);
  if (anyCooked && !anyBurnt) return MASH;
  return null;
}

// How far along is the wok toward its best-matching dish (0..1)? Used for the
// wok's cook ring and for the "almost there" hint on the plate station.
export function wokProgress(wokContents) {
  const ids = Object.keys(wokContents);
  if (ids.length === 0) return 0;
  const dish = matchDish(wokContents);
  if (dish) {
    const sum = dish.recipe.reduce((a, id) => a + Math.min(1, wokContents[id].cooked), 0);
    return sum / dish.recipe.length;
  }
  const sum = ids.reduce((a, id) => a + Math.min(1, wokContents[id].cooked), 0);
  return sum / ids.length;
}

// What the plate station should say about the wok right now. A pile that is
// part of a recipe names the dish and what it still needs; only a pile no
// recipe contains is Mystery Mash.
export function wokStatus(wokContents) {
  const ids = Object.keys(wokContents);
  if (ids.length === 0) return { label: 'Wok is empty', tone: 'idle' };
  if (Object.values(wokContents).some((c) => c.burnt)) {
    return { label: 'Burnt! Dump it (trash)', tone: 'bad' };
  }
  const dish = matchDish(wokContents);
  if (!dish) {
    const partial = DISHES.find((d) => ids.every((id) => d.recipe.includes(id)) && d.recipe.length > ids.length);
    if (partial) {
      const missing = partial.recipe.filter((id) => !wokContents[id]);
      return { label: `${partial.name} needs ${missing.map((id) => ING_BY_ID[id].name).join(', ')}`, tone: 'cooking' };
    }
    return { label: 'No recipe matches — Mystery Mash', tone: 'mash' };
  }
  if (wokReadyToPlate(wokContents)) {
    return { label: `${dish.name} — ready to plate!`, tone: 'ready' };
  }
  const missing = dish.recipe.filter((id) => !wokContents[id]);
  if (missing.length > 0) {
    return { label: `${dish.name} needs ${missing.map((id) => ING_BY_ID[id].name).join(', ')}`, tone: 'cooking' };
  }
  return { label: `${dish.name} is cooking…`, tone: 'cooking' };
}

export { DISH_BY_ID };
