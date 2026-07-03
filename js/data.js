// Catalog of shop items + characters. Art files live in assets/.
// state: 'current' = selected at session start, 'owned' = free to equip,
// price = locked behind stars (always CONFIG.itemPrice in the study).

const CHARACTERS = {
  // Casey by hairstyle — full pre-composed renders from Figma characterType
  casey: {
    default:  'assets/characters/casey-default.png',
    ponytail: 'assets/characters/casey-ponytail.png',
    short:    'assets/characters/casey-short.png',
  },
  tutors: {
    pandy:    { idle: 'assets/characters/tutor-pandy-idle.png', talk: 'assets/characters/tutor-pandy-talk.png', name: 'Pandy' },
    redpandy: { idle: 'assets/characters/tutor-redpandy.png',   talk: 'assets/characters/tutor-redpandy.png',   name: 'Red Pandy' },
    barsu:    { idle: 'assets/characters/tutor-barsu.png',      talk: 'assets/characters/tutor-barsu.png',      name: 'Barsu' },
    duck:     { idle: 'assets/characters/tutor-duck.png',       talk: 'assets/characters/tutor-duck.png',       name: 'Duck Norris' },
    aliencat: { idle: 'assets/characters/tutor-aliencat.png',   talk: 'assets/characters/tutor-aliencat.png',   name: 'Alien Cat' },
    unicorn:  { idle: 'assets/characters/tutor-unicorn.png',    talk: 'assets/characters/tutor-unicorn.png',    name: 'Unicorn' },
    glazy:    { idle: 'assets/characters/tutor-glazy.png',      talk: 'assets/characters/tutor-glazy.png',      name: 'Glazy' },
  },
};

// Avatar shop: 7 categories in left-rail order.
// equip: hairstyle key — only free hair items actually change the character
// (matching the Figma prototype, where the 3 free hairstyles are the only
// on-character variants; everything else is priced at 2000 → "Not enough stars").
const SHOP_CATALOG = {
  skin: {
    icon: 'assets/ui/cat-icon-1.png',
    items: [
      { art: 'assets/items/skin/skin-1.png', state: 'current' },
      { art: 'assets/items/skin/skin-2.png', price: true },
      { art: 'assets/items/skin/skin-3.png', price: true },
      { art: 'assets/items/skin/skin-4.png', price: true },
      { art: 'assets/items/skin/skin-5.png', price: true },
      { art: 'assets/items/skin/skin-6.png', price: true },
    ],
  },
  hair: {
    icon: 'assets/ui/cat-icon-2.png',
    items: [
      { art: 'assets/items/hair/hair-1.png', state: 'current', equip: 'default' },
      { art: 'assets/items/hair/hair-2.png', state: 'owned',   equip: 'short' },
      { art: 'assets/items/hair/hair-3.png', state: 'owned',   equip: 'ponytail' },
      { art: 'assets/items/hair/hair-4.png', price: true },
      { art: 'assets/items/hair/hair-5.png', price: true },
      { art: 'assets/items/hair/hair-6.png', price: true },
    ],
  },
  haircolor: {
    icon: 'assets/ui/cat-icon-3.png',
    items: [
      { art: 'assets/items/haircolor/color-1.png', state: 'current' },
      { art: 'assets/items/haircolor/color-2.png', price: true },
      { art: 'assets/items/haircolor/color-3.png', price: true },
      { art: 'assets/items/haircolor/color-4.png', price: true },
      { art: 'assets/items/haircolor/color-5.png', price: true },
      { art: 'assets/items/haircolor/color-6.png', price: true },
    ],
  },
  eyes: {
    icon: 'assets/ui/cat-icon-4.png',
    items: [
      { art: 'assets/items/eyes/eyes-1.png', state: 'current' },
      { art: 'assets/items/eyes/eyes-2.png', price: true },
      { art: 'assets/items/eyes/eyes-3.png', price: true },
      { art: 'assets/items/eyes/eyes-4.png', price: true },
      { art: 'assets/items/eyes/eyes-5.png', price: true },
      { art: 'assets/items/eyes/eyes-6.png', price: true },
    ],
  },
  outfit: {
    icon: 'assets/ui/cat-icon-5.png',
    items: [
      { art: 'assets/items/outfit/outfit-1.png', state: 'current' },
      { art: 'assets/items/outfit/outfit-2.png', price: true },
      { art: 'assets/items/outfit/outfit-3.png', price: true },
      { art: 'assets/items/outfit/outfit-4.png', price: true },
      { art: 'assets/items/outfit/outfit-5.png', price: true },
      { art: 'assets/items/outfit/outfit-6.png', price: true },
    ],
  },
  hat: {
    icon: 'assets/ui/cat-icon-6.png',
    items: [
      { art: 'assets/items/hat/hat-1.png', price: true },
      { art: 'assets/items/hat/hat-2.png', price: true },
      { art: 'assets/items/hat/hat-3.png', price: true },
      { art: 'assets/items/hat/hat-4.png', price: true },
      { art: 'assets/items/hat/hat-5.png', price: true },
      { art: 'assets/items/hat/hat-6.png', price: true },
    ],
  },
  glasses: {
    icon: 'assets/ui/cat-icon-7.png',
    items: [
      { art: 'assets/items/glasses/glasses-1.png', price: true },
      { art: 'assets/items/glasses/glasses-2.png', price: true },
      { art: 'assets/items/glasses/glasses-3.png', price: true },
      { art: 'assets/items/glasses/glasses-4.png', price: true },
      { art: 'assets/items/glasses/glasses-5.png', price: true },
      { art: 'assets/items/glasses/glasses-6.png', price: true },
    ],
  },
};

// Tutor shop: one flat grid (3 columns, scrolls) — Red Pandy sits next to Pandy.
const TUTOR_CATALOG = [
  { key: 'pandy',    state: 'current' },
  { key: 'redpandy', state: 'owned' },
  { key: 'barsu',    state: 'owned' },
  { key: 'duck',     state: 'owned' },
  { key: 'aliencat', price: true },
  { key: 'unicorn',  price: true },
  { key: 'glazy',    price: true },
];
