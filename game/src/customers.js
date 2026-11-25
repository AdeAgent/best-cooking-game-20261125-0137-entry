// Wok Rush — the night-market queue: who shows up, what they order, and how
// long they will wait. A ticket is a person with a patience bar, not a timer.
import { REGULARS, SHIFTS, MAX_WAITING } from './config.js';

let nextId = 1;

// Pick a dish from the current shift's menu, weighted so the cheap dishes
// show up more often early and the feast stays rare.
function pickDish(shift, rng) {
  const menu = shift.dishes;
  const weights = menu.map((id, i) => (menu.length - i) * 2 + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < menu.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return menu[i];
  }
  return menu[menu.length - 1];
}

export function makeCustomer(shift, rng) {
  const regular = REGULARS[Math.floor(rng() * REGULARS.length)];
  return {
    id: nextId++,
    name: regular.name,
    line: regular.line,
    face: regular.face,
    dishId: pickDish(shift, rng),
    patience: shift.patience,
    patienceMax: shift.patience,
    // A little bob so the queue feels alive; seeded per customer.
    bobPhase: rng() * Math.PI * 2,
    // Fresh arrivals flash once so the eye catches them.
    fresh: 1.2,
    served: false,
    left: false,
  };
}

// Spawn clock: returns true when a new customer should join the queue.
export function spawnDue(state, dt) {
  if (state.customers.filter((c) => !c.left && !c.served).length >= MAX_WAITING) return false;
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return false;
  const shift = SHIFTS[state.shiftIndex];
  state.spawnTimer = shift.spawnEvery * (0.85 + Math.random() * 0.3);
  return true;
}

// Tick every waiting customer's patience. Returns the ones who just stormed off.
export function tickPatience(state, dt) {
  const stormed = [];
  for (const c of state.customers) {
    if (c.served || c.left) continue;
    c.patience -= dt;
    if (c.fresh > 0) c.fresh -= dt;
    if (c.patience <= 0) {
      c.patience = 0;
      c.left = true;
      stormed.push(c);
    }
  }
  return stormed;
}

export function waitingCustomers(state) {
  return state.customers.filter((c) => !c.served && !c.left);
}

export function resetCustomerIds() { nextId = 1; }
