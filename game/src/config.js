// Wok Rush — Night Market Kitchen: every constant that shapes the game.
// One place for the numbers so tuning the feel never means hunting through logic.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// Palette: a night market after dark — deep indigo sky, warm lantern light,
// red awning, pale wood counters. Food is drawn to look worth serving.
export const PALETTE = {
  sky: '#171233',
  skyDeep: '#0e0a24',
  awning: '#c93b2e',
  awningDark: '#9c2a20',
  awningStripe: '#f2e3c6',
  wood: '#8a5a33',
  woodLight: '#a9713f',
  woodDark: '#5f3c1e',
  counter: '#3a2a1c',
  counterTop: '#6b4a2c',
  paper: '#f7ead0',
  paperDark: '#e8d5ae',
  ink: '#2b1d12',
  inkSoft: '#6b543a',
  gold: '#f5b942',
  goldDeep: '#d18f1f',
  green: '#58b368',
  red: '#e4572e',
  flame: '#ff9f1c',
  flameHot: '#ff5714',
  steam: 'rgba(255,255,255,0.55)',
  plate: '#f4f1e8',
  plateRim: '#c9b458',
};

// Layout rects for the single-screen kitchen. Everything the judge needs to
// see — order board, counter, wok, plate, timer — is on screen at once.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 14, y: 70, w: 292, h: 560 }, // order tickets live here
  kitchen: { x: 320, y: 70, w: 640, h: 560 }, // wok + bins + plate
  side: { x: 974, y: 70, w: 292, h: 560 }, // combo, rush, messages
  bottomBar: { x: 0, y: 642, w: 1280, h: 78 },
  wok: { cx: 560, cy: 330, r: 118 },
  plate: { cx: 856, cy: 300, r: 92 },
  trash: { x: 986, y: 576, w: 268, h: 40 },
  bins: { x: 330, y: 500, w: 620, h: 118 },
};

// Ingredients the stall stocks. Each bin is one key (1-8) and one click.
export const INGREDIENTS = [
  { id: 'noodle', name: 'Noodles', key: '1', color: '#f2c14e', cook: 4.0 },
  { id: 'rice', name: 'Rice', key: '2', color: '#f7ead0', cook: 4.5 },
  { id: 'chicken', name: 'Chicken', key: '3', color: '#e8a04c', cook: 5.0 },
  { id: 'shrimp', name: 'Shrimp', key: '4', color: '#ff8a7a', cook: 3.5 },
  { id: 'greens', name: 'Greens', key: '5', color: '#58b368', cook: 2.5 },
  { id: 'egg', name: 'Egg', key: '6', color: '#ffd94d', cook: 3.0 },
  { id: 'chili', name: 'Chili', key: '7', color: '#e4572e', cook: 2.0 },
  { id: 'soy', name: 'Soy', key: '8', color: '#7a4a21', cook: 1.5 },
];
export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// The menu: original dishes, each a combination of ingredients. A dish is
// ready to plate when every recipe ingredient sits in the wok cooked through.
// Anything else in the wok plates as Mystery Mash — servable, but cheap.
export const DISHES = [
  {
    id: 'lantern-noodles', name: 'Lantern Noodles', price: 14,
    recipe: ['noodle', 'chicken', 'greens'],
    blurb: 'The stall classic — smoky, springy, gone in minutes.',
  },
  {
    id: 'ember-rice', name: 'Ember Fried Rice', price: 14,
    recipe: ['rice', 'egg', 'shrimp'],
    blurb: 'Wok-kissed rice, a golden egg, one proud shrimp.',
  },
  {
    id: 'dragon-noodles', name: 'Dragon Noodles', price: 16,
    recipe: ['noodle', 'shrimp', 'chili'],
    blurb: 'Sweet heat. Regulars order it just to feel brave.',
  },
  {
    id: 'garden-rice', name: 'Golden Garden Rice', price: 18,
    recipe: ['rice', 'greens', 'egg', 'chili'],
    blurb: 'Four colours, one pan, zero leftovers.',
  },
  {
    id: 'night-feast', name: 'Night Market Feast', price: 24,
    recipe: ['noodle', 'chicken', 'shrimp', 'egg'],
    blurb: 'Everything the wok knows, on one plate.',
  },
];
export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));
export const MASH = { id: 'mystery-mash', name: 'Mystery Mash', price: 5 };

// Night-market regulars: each ticket carries a name and a craving line, so a
// ticket reads as a person, not a chore list.
export const REGULARS = [
  { name: 'Mira', line: 'Night shift soon — make it fast!', face: 'nurse' },
  { name: 'Old Bao', line: 'Same as always, extra fire.', face: 'elder' },
  { name: 'Lulu', line: 'Something spicy, I dare you.', face: 'kid' },
  { name: 'Ken', line: 'Hungry. Whatever is quickest.', face: 'driver' },
  { name: 'Sari', line: 'Noodles, please. Long day.', face: 'student' },
  { name: 'Pak Tono', line: 'The feast! My grandkids are waiting.', face: 'grandpa' },
  { name: 'Yuki', line: 'Pretty AND tasty, if you can.', face: 'tourist' },
  { name: 'Dimas', line: 'Double chili. I can take it.', face: 'chef' },
];

// One shift (a "day" of the night market). Pressure grows shift by shift:
// more customers, less patience, richer menus — never more chores.
export const SHIFTS = [
  {
    n: 1, label: 'Shift 1 · Dusk', duration: 150, spawnEvery: 11,
    patience: 46, dishes: ['lantern-noodles', 'ember-rice', 'dragon-noodles'],
    heatRise: 7.5, tipRate: 0.5,
  },
  {
    n: 2, label: 'Shift 2 · Rush Hour', duration: 150, spawnEvery: 8.5,
    patience: 38, dishes: ['lantern-noodles', 'ember-rice', 'dragon-noodles', 'garden-rice'],
    heatRise: 9.5, tipRate: 0.6,
  },
  {
    n: 3, label: 'Shift 3 · Midnight', duration: 150, spawnEvery: 7,
    patience: 32, dishes: ['lantern-noodles', 'ember-rice', 'dragon-noodles', 'garden-rice', 'night-feast'],
    heatRise: 11.5, tipRate: 0.7,
  },
];

export const MAX_HEARTS = 3;
export const MAX_WAITING = 4;
export const COMBO_WINDOW_SEC = 9; // serves inside this window stack the combo
export const SERVE_PERFECT_AT = 0.7; // patience fraction left for a "perfect" serve
export const BURN_AT_HEAT = 85; // wok heat at which food starts burning
export const STIR_COOL = 26; // heat a stir takes off
export const COOK_READY_AT = 0.9; // per-ingredient cook fraction for plating
