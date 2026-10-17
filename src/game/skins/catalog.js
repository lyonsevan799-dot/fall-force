export const SKINS = [
  { id: 'classic', name: 'Classic', rarity: 'Basic', price: 0, colors: ['#ffffff', '#7ff4ff', '#3ae8ff'], detail: 'The original luminous runner. Always available as your default.' },
  { id: 'crimson', name: 'Crimson', rarity: 'Basic', price: 100, colors: ['#ffb4ab', '#ef3340', '#8c1232'], detail: 'Crimson armor with precision-cut diagonal racing stripes.' },
  { id: 'ocean', name: 'Ocean Blue', rarity: 'Basic', price: 150, colors: ['#bbf4ff', '#278cff', '#123a9b'], detail: 'Deep blue glass with flowing wave lines.' },
  { id: 'toxic', name: 'Toxic Green', rarity: 'Rare', price: 300, colors: ['#dbff83', '#85ef24', '#166b32'], detail: 'A glowing reactor, suspended bubbles and a radioactive ring.' },
  { id: 'neon', name: 'Neon Purple', rarity: 'Rare', price: 400, colors: ['#f5b8ff', '#bb51ff', '#5524bf'], detail: 'Electric violet circuitry with luminous chevrons.' },
  { id: 'golden', name: 'Golden', rarity: 'Epic', price: 750, colors: ['#fff3b0', '#f5bf35', '#a56b15'], detail: 'Polished gold plating, a moving gleam and royal detailing.' },
  { id: 'shadow', name: 'Shadow', rarity: 'Epic', price: 900, colors: ['#36364d', '#151221', '#070810'], detail: 'Obsidian armor with a violet eclipse and a bright spectral rim.', edge: '#b68dff' },
  { id: 'ice', name: 'Ice Crystal', rarity: 'Epic', price: 1200, colors: ['#efffff', '#8ce8ff', '#318bbc'], detail: 'Angular frozen facets and a crystalline snowflake.' },
  { id: 'fireball', name: 'Fireball', rarity: 'Legendary', price: 1800, colors: ['#fff9ae', '#ff9b23', '#ee3540'], detail: 'A blazing core, animated flame crown and drifting embers.' },
  { id: 'galaxy', name: 'Galaxy', rarity: 'Legendary', price: 2500, colors: ['#8b6be5', '#3a236b', '#101232'], detail: 'A miniature nebula with stars and an orbiting constellation.', edge: '#b991ff' },
  { id: 'rainbow', name: 'Rainbow', rarity: 'Legendary', price: 3500, colors: ['#ff779c', '#67f5df', '#936dff'], detail: 'A full-spectrum finish with a sweeping prismatic shimmer.' },
  { id: 'diamond', name: 'Diamond', rarity: 'Legendary', price: 5000, colors: ['#ffffff', '#c4f7ff', '#59b7ef'], detail: 'A brilliant diamond cut, crisp silver edges and orbiting sparkles.' },
];
export const getSkin = (id) => SKINS.find((skin) => skin.id === id) || SKINS[0];
export const RARITIES = ['All Skins', 'Basic', 'Rare', 'Epic', 'Legendary'];
export const RARITY_STYLE = {
  Basic: 'border-skin-basic/35 text-skin-basic bg-skin-basic/5',
  Rare: 'border-skin-rare/40 text-skin-rare bg-skin-rare/5',
  Epic: 'border-skin-epic/40 text-skin-epic bg-skin-epic/5',
  Legendary: 'border-skin-legendary/50 text-skin-legendary bg-skin-legendary/5',
};