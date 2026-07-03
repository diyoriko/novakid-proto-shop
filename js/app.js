// Interactive research prototype: avatar shop + AI-tutor shop with real state.
// Rebuilt from Masha's Figma file (oDTzhoaom24RsQaQ14BAMt) — 1280x720 stage.

const stage = document.getElementById('stage');

/* ================= layout constants (from Figma metadata) ================= */

const L = {
  dash: {
    avatarChip: { x: 53, y: 21, w: 74, h: 74 },
    streakBar:  { x: 357, y: 19, w: 531 },  // height omitted — PNG keeps its own aspect (531x40)
    banner:     { x: 427, y: 95, w: 427, h: 59 },
    counter:    { x: 1098, y: 21 },
    leftRail:   { x: 53, y: 207, w: 58, h: 247 },
    cardTutor:  { x: 118, y: 203, w: 287, h: 453 },
    cardGames:  { x: 421, y: 203, w: 286, h: 217 },
    cardHomework: { x: 421, y: 443, w: 287, h: 215 },
    cardMedia:  { x: 723, y: 203, w: 287, h: 453 },
    charName:   { x: 1009, y: 148, w: 282 },
    character:  { x: 1009, y: 195, w: 282, h: 399 },
    modify:     { x: 1023, y: 608, w: 204, h: 49 },
  },
  shop: {
    back:     { x: 53, y: 21, w: 50, h: 43 },
    tabsBar:  { x: 239, y: 28, w: 685, h: 85 },
    counter:  { x: 1128, y: 28, w: 124, h: 92 },
    grid:     { x: 281, y: 155 },
    card:     { w: 181, h: 223, gapX: 26, gapY: 26 },
    rail:     { x: 139, y: 113, w: 110, cell: 79 },
    pedestal: { x: 983, y: 302, w: 276 },
    character:{ x: 1009, y: 195, w: 282, h: 399 },
    nameChip: { x: 990, y: 140 },
  },
  tutorShop: {
    back:    { x: 53, y: 21, w: 56, h: 49 },
    panel:   { x: 152, y: 37, w: 773, h: 683 },
    grid:    { x: 187, y: 69 },
    card:    { w: 213, h: 263, gapX: 31, gapY: 29 },
    rail:    { x: 60, y: 97, w: 92, cell: 80, gap: 4 },
    counter: { x: 1128, y: 28, w: 124, h: 92 },
    pedestal:{ x: 983, y: 302, w: 276 },
    character:{ x: 989, y: 195, w: 282, h: 399 },
    nameChip:{ x: 1030, y: 145 },
  },
  // hotspot coords from Figma metadata (relative to each popup's top-left, 1x)
  popupReward:    { x: 416, y: 145, w: 448, h: 433, ok: { x: 112, y: 308, w: 220, h: 71 }, close: { x: 382, y: 25, w: 41, h: 41 } },
  popupNotEnough: { x: 325, y: 173, w: 502, h: 431, ok: { x: 145, y: 329, w: 211, h: 68 }, close: { x: 439, y: 24, w: 39, h: 39 }, card: { x: 170, y: 108, w: 160, h: 197 } },
  popupCompact:   { x: 389, y: 199, w: 502, h: 303, ok: { x: 145, y: 155, w: 211, h: 68 }, close: { x: 439, y: 24, w: 39, h: 39 } },
  popupLocked:    { x: 389, y: 148, w: 502, h: 423, ok: { x: 146, y: 322, w: 211, h: 68 }, close: { x: 439, y: 24, w: 39, h: 39 } },
};

/* ============================ helpers ============================ */

function el(tag, cls, styles = {}) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  Object.assign(n.style, styles);
  return n;
}

function px(v) { return `${v}px`; }

function place(n, box) {
  n.style.left = px(box.x);
  n.style.top = px(box.y);
  if (box.w) n.style.width = px(box.w);
  if (box.h) n.style.height = px(box.h);
  return n;
}

function img(src, cls, box) {
  const i = el('img', `abs ${cls || ''}`);
  i.src = src;
  i.draggable = false;
  if (box) place(i, box);
  return i;
}

function tap(node, handler) {
  node.classList.add('tap');
  node.addEventListener('pointerdown', e => e.preventDefault());
  node.addEventListener('click', () => SFX.tap());
  node.addEventListener('click', handler);
  return node;
}

function clearStage() { stage.innerHTML = ''; }

/* ---------- stage scaling ---------- */
function fitStage() {
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitStage);
fitStage();

/* ---------- star counters (live number, two Figma styles) ---------- */
function starCounter(box) {
  // dashboard style: white pill + tilted gold star
  const c = el('div', 'star-counter');
  c.style.left = px(box.x);
  c.style.top = px(box.y);
  const star = img('assets/ui/star-icon.png');
  star.classList.remove('abs'); star.style.position = 'static';
  c.append(star, Object.assign(el('span'), { textContent: state.balance }));
  c.id = 'star-counter';
  return c;
}

function starCounterShop(box) {
  // shop style: big gold star badge. The Figma render has "1000" baked in —
  // correct for this study (start 960 + reward 40). A live pill overlays it
  // only if the config produces a different balance.
  const c = el('div', 'star-counter-shop');
  place(c, box);
  const im = img('assets/ui/star-counter-shop.png');
  im.classList.remove('abs'); im.style.position = 'static';
  c.append(im);
  if (state.balance !== 1000) {
    const s = el('span');
    s.textContent = state.balance;
    Object.assign(s.style, {
      background: 'linear-gradient(#ffd23e,#f5a623)', borderRadius: '10px',
      left: '18%', right: '18%', padding: '2px 0',
    });
    c.append(s);
  }
  c.id = 'star-counter';
  return c;
}

function tickBalanceTo(target) {
  const span = document.querySelector('#star-counter span');
  const timer = setInterval(() => {
    if (state.balance >= target) { clearInterval(timer); return; }
    setState({ balance: Math.min(target, state.balance + CONFIG.tickStep) });
    if (span) span.textContent = state.balance;
    SFX.tick();
  }, CONFIG.tickIntervalMs);
}

/* ---------- background ---------- */
function background(withWedge) {
  const bg = el('div', 'bg-swirl');
  const swirl = el('img', 'swirl');
  swirl.src = 'assets/ui/back-swirl.svg?v=2';
  swirl.draggable = false;
  bg.append(swirl);
  if (withWedge) bg.append(el('div', 'bg-wedge'));
  return bg;
}

/* ---------- facilitator entry: translucent Tweaks chip (bottom-left) ---------- */
function armFacilitatorCorner(root) {
  const tweaks = el('div', 'tweaks-chip');
  tweaks.textContent = '⚙ Tweaks';
  tweaks.addEventListener('click', openFacMenu);
  root.append(tweaks);
}

function openFacMenu() {
  if (document.querySelector('.fac-menu')) return;
  const m = el('div', 'fac-menu');
  const mk = (label, fn) => { const b = el('button'); b.textContent = label; b.onclick = fn; return b; };
  m.append(
    mk('+1000 ⭐ to balance', () => {
      setState({ balance: state.balance + 1000 });
      logEvent('tweak', '+1000 stars');
      SFX.coin();
      go(state.screen);
      openFacMenu();
    }),
    mk('Reset session', () => { resetState(); go('facilitator'); }),
    mk('Export research log', () => exportLog()),
    mk(`Sound: ${state.muted ? 'off' : 'on'}`, function () {
      setState({ muted: !state.muted });
      this.textContent = `Sound: ${state.muted ? 'off' : 'on'}`;
      if (!state.muted) SFX.equip();
    }),
    mk('Facilitator screen', () => { setState({ screen: 'facilitator' }); go('facilitator'); }),
    mk('Close', () => m.remove()),
  );
  stage.append(m);
}

/* ============================ screens ============================ */

const SCREENS = {};

function go(name, arg) {
  setState({ screen: name });
  clearStage();
  SCREENS[name](arg);
}

/* ---------- facilitator start ---------- */
SCREENS.facilitator = () => {
  const f = el('div', 'fac');
  const h = el('h1'); h.textContent = 'Customization study — prototype';
  const p = el('p');
  p.textContent = 'One combined flow: the kid starts on the class-reward popup, explores the dashboard, and can customize both the avatar (Modify / shop / avatar / tap the character) and the AI Tutor (the AI Tutor tile). Everything is logged. During the test, the translucent “⚙ Tweaks” chip in the bottom-left corner opens the menu: reset, star top-up, sound, log export.';
  const a = el('button', 'btn a'); a.textContent = 'Start session';
  const r = el('button', 'btn ghost'); r.textContent = `Reset session · balance ${state.balance} · log ${state.log.length} events`;
  const x = el('button', 'btn ghost'); x.textContent = 'Export research log (JSON)';
  a.onclick = () => { setState({ flow: 'both' }); logEvent('session-start', 'combined avatar+tutor'); go('reward'); };
  r.onclick = () => { resetState(); go('facilitator'); };
  x.onclick = () => exportLog();
  f.append(h, p, a, r, x);
  stage.append(f);
};

/* ---------- class reward popup over dimmed dashboard ---------- */
SCREENS.reward = () => {
  renderDashboard({ dimmed: true });
  const ov = el('div', 'overlay');
  const pop = el('div', 'popup');
  place(pop, L.popupReward);
  pop.append(img('assets/popups/popup-reward.png', 'frame', { x: 0, y: 0, w: L.popupReward.w }));
  const ok = el('div', 'hotspot'); place(ok, L.popupReward.ok);
  const close = el('div', 'hotspot'); place(close, L.popupReward.close);
  const done = () => {
    logEvent('reward-ok', `+${CONFIG.classReward}`);
    setState({ rewardTaken: true });
    SFX.coin();
    go('dashboard');
    setTimeout(() => tickBalanceTo(CONFIG.startBalance + CONFIG.classReward), 400);
  };
  tap(ok, done); tap(close, done);
  pop.append(ok, close);
  stage.append(ov, pop);
  armFacilitatorCorner(stage);
};

/* ---------- dashboard (both flows) ---------- */
function renderDashboard({ dimmed = false } = {}) {
  const root = el('div', 'screen');
  root.append(background(true));

  const d = L.dash;
  root.append(img('assets/ui/avatar-chip.png', '', d.avatarChip));
  root.append(img('assets/ui/streak-bar.png', '', d.streakBar));
  root.append(img('assets/ui/next-class-banner.png', '', d.banner));
  root.append(img('assets/ui/left-rail.png', '', d.leftRail));
  root.append(starCounter(d.counter));

  // 4 activity cards
  const tutorCard = state.tutor === 'pandy'
    ? img('assets/ui/card-ai-tutor.png', '', d.cardTutor)
    : composedTutorCard(d.cardTutor);
  root.append(tutorCard);
  root.append(img('assets/ui/card-games.png', '', d.cardGames));
  root.append(img('assets/ui/card-homework.png', '', d.cardHomework));
  root.append(img('assets/ui/card-media.png', '', d.cardMedia));

  // right-side character: Casey (flow A) or the chosen tutor (flow B)
  const isTutorFlow = state.flow === 'tutor';
  const charSrc = isTutorFlow
    ? CHARACTERS.tutors[state.tutor].idle
    : CHARACTERS.casey[state.hair];
  const character = img(charSrc, '', d.character);
  root.append(character);

  if (!isTutorFlow) {
    const name = el('div', 'dash-label-name');
    name.textContent = CONFIG.characterName;
    place(name, d.charName);
    root.append(name);
  }

  const modify = img('assets/ui/btn-modify.png', '', d.modify);
  root.append(modify);

  if (!dimmed) {
    // — the 4 researched entrances. Flow A/C: → avatar shop; flow B: → tutor shop.
    const dest = isTutorFlow ? 'tutorShop' : 'avatarShop';
    const enter = (entrance, where = dest) => () => { logEvent('entrance', entrance); go(where); };
    tap(character, enter('tap-character'));
    tap(modify, enter('modify-button'));
    const chipHot = el('div', 'hotspot'); place(chipHot, d.avatarChip);
    tap(chipHot, enter('avatar-chip'));
    root.append(chipHot);
    // shop icon = 3rd icon in the left rail
    const railCell = d.leftRail.h / 4;
    const shopHot = el('div', 'hotspot');
    place(shopHot, { x: d.leftRail.x, y: d.leftRail.y + railCell * 2, w: d.leftRail.w, h: railCell });
    tap(shopHot, enter('shop-icon'));
    root.append(shopHot);
    // activity cards. AI Tutor tile opens the tutor shop in flows B and C;
    // Games/Homework/Media are dead ends everywhere (logged only).
    const tutorHot = el('div', 'hotspot'); place(tutorHot, d.cardTutor);
    if (isTutorFlow || state.flow === 'both') tap(tutorHot, enter('ai-tutor-tile', 'tutorShop'));
    else tap(tutorHot, () => logEvent('card-tap', 'ai-tutor'));
    root.append(tutorHot);
    [['games', d.cardGames], ['homework', d.cardHomework], ['media', d.cardMedia]].forEach(([n, box]) => {
      const h = el('div', 'hotspot'); place(h, box);
      tap(h, () => logEvent('card-tap', n));
      root.append(h);
    });

    // tutor speech bubbles. Flow B: near the right-side tutor; flow C: near the AI Tutor tile.
    const bubblePos = isTutorFlow
      ? { right: px(1280 - d.character.x - d.character.w + 40), top: px(90), maxWidth: '280px' }
      : { left: px(d.cardTutor.x + 60), top: px(d.cardTutor.y - 62), maxWidth: '300px' };
    if ((isTutorFlow || state.flow === 'both') && state.tutorGreeted) {
      const bubble = el('div', 'speech-bubble', bubblePos);
      bubble.textContent = CONFIG.tutorHello;
      root.append(bubble);
      setState({ tutorGreeted: false });
      setTimeout(() => bubble.remove(), 5200);
    } else if (isTutorFlow) {
      const bubble = el('div', 'speech-bubble', bubblePos);
      bubble.textContent = CONFIG.tutorPrompt;
      tap(bubble, enter('tutor-bubble'));
      root.append(bubble);
    }

    armFacilitatorCorner(root);
  }

  stage.append(root);
  return root;
}

// AI Tutor tile with the newly chosen tutor (composed live — no premade art)
function composedTutorCard(box) {
  const card = el('div', 'abs', {
    left: px(box.x), top: px(box.y), width: px(box.w), height: px(box.h),
    background: '#fff', borderRadius: '22px', boxShadow: '0 4px 12px rgba(20,10,60,.18)',
  });
  const innerH = box.h - 62;
  const inner = el('div', '', {
    position: 'absolute', left: '10px', top: '10px', right: '10px', height: px(innerH),
    background: '#c9bcf2', borderRadius: '16px', overflow: 'hidden',
  });
  const t = img(CHARACTERS.tutors[state.tutor].idle, '', { x: 0, y: 0 });
  Object.assign(t.style, { left: '50%', top: px(innerH * 0.16), width: '78%', transform: 'translateX(-50%)' });
  inner.append(t);
  const badge = el('div', '', {
    position: 'absolute', right: '18px', top: '18px', width: '30px', height: '30px',
    borderRadius: '50%', background: '#6d5fd6', border: '3px solid #fff',
  });
  const label = el('div', '', {
    position: 'absolute', left: 0, right: 0, bottom: '14px', textAlign: 'center',
    fontWeight: 700, fontSize: '24px', color: '#2b2350',
  });
  label.textContent = 'AI Tutor';
  card.append(inner, badge, label);
  return card;
}

SCREENS.dashboard = () => { renderDashboard(); };

/* ---------- avatar shop ---------- */
SCREENS.avatarShop = () => {
  const root = el('div', 'screen');
  root.append(background(false));
  const s = L.shop;

  // back
  const back = img('assets/ui/back-arrow.png', '', s.back);
  tap(back, () => { logEvent('shop-back'); go('dashboard'); });
  root.append(back);

  // panel + top tabs (real Figma render; Frame/Flag are stubs — logged only)
  const panel = el('div', 'shop-panel');
  root.append(panel);
  root.append(img('assets/ui/tabs-bar.png', '', L.shop.tabsBar));
  const third = L.shop.tabsBar.w / 3;
  ['Frame', 'Flag'].forEach((name, i) => {
    const h = el('div', 'hotspot');
    place(h, { x: L.shop.tabsBar.x + third * (i + 1), y: L.shop.tabsBar.y, w: third, h: L.shop.tabsBar.h });
    tap(h, () => logEvent('stub-tab', name));
    root.append(h);
  });

  // category rail
  const rail = el('div', 'cat-rail');
  Object.entries(SHOP_CATALOG).forEach(([key, cat]) => {
    const b = el('div', `cat-btn${key === state.shopCategory ? ' active' : ''}`);
    b.append(img(cat.icon));
    b.querySelector('img').classList.remove('abs');
    b.querySelector('img').style.position = 'static';
    tap(b, () => { logEvent('category', key); setState({ shopCategory: key }); go('avatarShop'); });
    rail.append(b);
  });
  root.append(rail);

  // item grid
  const grid = el('div', 'item-grid');
  const cat = SHOP_CATALOG[state.shopCategory];
  const ownedList = state.ownedExtra[state.shopCategory] || [];
  const selectedIdx = selectedIndex(state.shopCategory);
  cat.items.forEach((item, i) => {
    const card = el('div', 'item-card');
    card.append(img(item.art, 'art'));
    const isOwned = !item.price || ownedList.includes(i);
    if (i === selectedIdx) {
      card.append(tickMark());
    } else if (isOwned) {
      card.append(el('div', 'dot'));
    } else {
      const pr = el('div', 'price');
      pr.append(img('assets/ui/star-icon.png'), Object.assign(el('span'), { textContent: CONFIG.itemPrice }));
      pr.querySelector('img').classList.remove('abs');
      pr.querySelector('img').style.position = 'static';
      card.append(pr);
    }
    tap(card, () => onShopItem(item, i, isOwned));
    grid.append(card);
  });
  root.append(grid);

  // character preview
  root.append(img('assets/ui/pedestal.png', '', s.pedestal));
  const preview = el('div', 'char-preview'); place(preview, s.character);
  preview.append(img(CHARACTERS.casey[state.hair]));
  preview.querySelector('img').classList.remove('abs');
  preview.querySelector('img').style.position = 'static';
  preview.id = 'char-preview';
  root.append(preview);

  root.append(starCounterShop(s.counter));
  armFacilitatorCorner(root);
  stage.append(root);
};

function tickMark() {
  // green check over a pale-blue ellipse, as in the Figma card selected state
  const t = el('div', 'tick');
  t.innerHTML = `<svg viewBox="0 0 48 44" width="48" height="44">
    <ellipse cx="24" cy="26" rx="20" ry="14" fill="#BBD4F5"/>
    <path d="M10 22 L20 34 L40 8" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 22 L20 34 L40 8" fill="none" stroke="#2FC24C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return t;
}

// currently selected item index in a category (purchases override the default)
function selectedIndex(catKey) {
  if (state.selectedExtra[catKey] !== undefined) return state.selectedExtra[catKey];
  const items = SHOP_CATALOG[catKey].items;
  if (catKey === 'hair') return items.findIndex(it => it.equip === state.hair);
  return items.findIndex(it => it.state === 'current'); // -1 = nothing (hat/glasses)
}

function bouncePreview() {
  const p = document.getElementById('char-preview');
  if (p) p.animate([{ transform: 'scale(.92)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
}

function onShopItem(item, index, isOwned) {
  const cat = state.shopCategory;
  if (isOwned) {
    if (index === selectedIndex(cat)) { logEvent('item-tap', `${cat} #${index + 1} (already selected)`); return; }
    const patch = { selectedExtra: { ...state.selectedExtra, [cat]: index } };
    // only the free hairstyles have on-character art — the character updates for those
    if (item.equip) patch.hair = item.equip;
    setState(patch);
    logEvent('select-item', `${cat} #${index + 1}`);
    SFX.equip();
    go('avatarShop');
    bouncePreview();
    return;
  }
  if (state.balance >= CONFIG.itemPrice) {
    setState({
      balance: state.balance - CONFIG.itemPrice,
      ownedExtra: { ...state.ownedExtra, [cat]: [...(state.ownedExtra[cat] || []), index] },
      selectedExtra: { ...state.selectedExtra, [cat]: index },
    });
    logEvent('purchase', `${cat} #${index + 1} for ${CONFIG.itemPrice}`);
    SFX.coin();
    go('avatarShop');
    bouncePreview();
    return;
  }
  logEvent('paid-item-tap', `${cat} #${index + 1} — not enough stars`);
  showNotEnough(item.art);
}

function showNotEnough(artSrc, compact = false) {
  SFX.denied();
  const spec = compact ? L.popupCompact : L.popupNotEnough;
  const file = compact ? 'assets/popups/popup-notenough-compact.png' : 'assets/popups/popup-notenough.png';
  const ov = el('div', 'overlay');
  const pop = el('div', 'popup');
  place(pop, spec);
  pop.append(img(file, 'frame', { x: 0, y: 0, w: spec.w }));
  if (!compact && artSrc && spec.card) {
    // live item art inside the pink card — the thing Figma could not do
    const c = el('div', 'popup-card'); place(c, spec.card);
    c.append(img(artSrc));
    c.querySelector('img').classList.remove('abs');
    c.querySelector('img').style.position = 'static';
    pop.append(c);
  }
  const closeAll = () => { ov.remove(); pop.remove(); };
  const ok = el('div', 'hotspot'); place(ok, spec.ok); tap(ok, () => { logEvent('popup-close', 'not-enough OK'); closeAll(); });
  const cl = el('div', 'hotspot'); place(cl, spec.close); tap(cl, () => { logEvent('popup-close', 'not-enough X'); closeAll(); });
  pop.append(ok, cl);
  stage.append(ov, pop);
}

/* ---------- tutor shop ---------- */
SCREENS.tutorShop = () => {
  const root = el('div', 'screen');
  root.append(background(false));
  const t = L.tutorShop;
  const shownTutor = state.tryOnTutor || state.tutor;

  const back = img('assets/ui/back-arrow.png', '', t.back);
  tap(back, () => {
    if (state.tryOnTutor && state.tryOnTutor !== state.tutor) {
      const chosen = state.tryOnTutor;
      logEvent('tutor-chosen', chosen);
      setState({ tutor: chosen, tryOnTutor: null, tutorGreeted: true });
      SFX.choose();
      go('loading');
    } else {
      logEvent('shop-back', 'tutor');
      setState({ tryOnTutor: null });
      go('dashboard');
    }
  });
  root.append(back);

  // panel
  const panel = el('div', 'abs', {
    left: px(t.panel.x), top: px(t.panel.y), width: px(t.panel.w), height: px(t.panel.h),
    background: '#251d4f', borderRadius: '24px 24px 0 0',
  });
  root.append(panel);

  // tutor cards: one flat grid (Red Pandy sits next to Pandy), scrolls vertically
  const grid = el('div', 'abs', {
    left: px(t.grid.x), top: px(t.grid.y), display: 'grid',
    gridTemplateColumns: `repeat(3, ${t.card.w}px)`, gridAutoRows: px(t.card.h),
    columnGap: px(t.card.gapX), rowGap: px(t.card.gapY),
    height: px(t.panel.h - (t.grid.y - t.panel.y) - 24),
    overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'none',
  });
  TUTOR_CATALOG.forEach(entry => {
    const info = CHARACTERS.tutors[entry.key];
    const card = el('div', 'item-card');
    const art = img(info.idle, 'art');
    Object.assign(art.style, { left: '14px', top: '12px', width: px(t.card.w - 28), height: px(t.card.h - 80) });
    card.append(art);
    const checked = shownTutor === entry.key;
    const tutorOwned = !entry.price || (state.ownedExtra.tutor || []).includes(entry.key);
    if (checked) card.append(tickMark());
    else if (tutorOwned) card.append(el('div', 'dot'));
    else {
      const pr = el('div', 'price');
      pr.append(img('assets/ui/star-icon.png'), Object.assign(el('span'), { textContent: CONFIG.itemPrice }));
      pr.querySelector('img').classList.remove('abs');
      pr.querySelector('img').style.position = 'static';
      card.append(pr);
    }
    tap(card, () => {
      if (tutorOwned) { logEvent('tutor-tryon', entry.key); tryOnTutor(entry.key); return; }
      if (state.balance >= CONFIG.itemPrice) {
        setState({
          balance: state.balance - CONFIG.itemPrice,
          ownedExtra: { ...state.ownedExtra, tutor: [...(state.ownedExtra.tutor || []), entry.key] },
        });
        logEvent('purchase', `tutor ${entry.key} for ${CONFIG.itemPrice}`);
        SFX.coin();
        tryOnTutor(entry.key);
        return;
      }
      logEvent('paid-tutor-tap', `${entry.key} — not enough stars`);
      showNotEnough(null, true);
    });
    grid.append(card);
  });
  root.append(grid);

  // pedestal preview + name chip + phrase
  root.append(img('assets/ui/pedestal.png', '', t.pedestal));
  const preview = el('div', 'char-preview'); place(preview, t.character);
  const shown = CHARACTERS.tutors[shownTutor];
  const pv = img(shownTutor === 'pandy' ? shown.talk : shown.idle);
  pv.classList.remove('abs'); pv.style.position = 'static';
  preview.append(pv);
  preview.id = 'char-preview';
  root.append(preview);

  const chip = el('div', 'name-chip', { left: px(t.nameChip.x), top: px(t.nameChip.y) });
  const chk = el('div', 'chk'); chk.textContent = '✓';
  chip.append(chk, Object.assign(el('span'), { textContent: shown.name }));
  root.append(chip);

  if (state.tryOnTutor) {
    const bubble = el('div', 'speech-bubble', { right: px(40), top: px(60) });
    bubble.textContent = CONFIG.tutorPhrases[state.tryOnTutor] || 'Hello!';
    root.append(bubble);
    setTimeout(() => bubble.remove(), 4200);
  }

  root.append(starCounterShop(t.counter));
  armFacilitatorCorner(root);
  stage.append(root);
};

function tryOnTutor(key) {
  setState({ tryOnTutor: key });
  SFX.equip();
  setTimeout(() => SFX.hello(), 320);
  go('tutorShop');
  const p = document.getElementById('char-preview');
  if (p) p.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 340, easing: 'ease-out' });
}

function showSkinLocked() {
  SFX.popup();
  const ov = el('div', 'overlay');
  const pop = el('div', 'popup');
  place(pop, L.popupLocked);
  pop.append(img('assets/popups/popup-skin-locked.png', 'frame', { x: 0, y: 0, w: L.popupLocked.w }));
  const closeAll = () => { ov.remove(); pop.remove(); };
  const ok = el('div', 'hotspot'); place(ok, L.popupLocked.ok); tap(ok, closeAll);
  const cl = el('div', 'hotspot'); place(cl, L.popupLocked.close); tap(cl, closeAll);
  pop.append(ok, cl);
  stage.append(ov, pop);
}

/* ---------- loading: "Preparing your new Tutor..." ---------- */
SCREENS.loading = () => {
  const root = el('div', 'loading-screen');
  root.append(background(false));
  const inner = el('div', 'loading-inner');
  const bar = el('div', 'loading-bar');
  const fill = el('div', 'fill');
  bar.append(fill);
  const walker = img('assets/popups/loading-spinner.gif', 'loading-walker');
  walker.classList.remove('abs');
  const text = el('div', 'loading-text');
  text.textContent = 'Preparing your new Tutor...';
  inner.append(walker, bar, text);
  root.append(inner);
  stage.append(root);

  const steps = 8;
  let step = 0;
  const iv = setInterval(() => {
    step++;
    fill.style.width = `${(step / steps) * 100}%`;
    walker.style.left = px(20 + (step / steps) * 240);
    if (step >= steps) {
      clearInterval(iv);
      setTimeout(() => go('dashboard'), 350);
    }
  }, CONFIG.loadingMs / steps);
};

/* ============================ boot ============================ */

// preload all art so the test never flickers on a tablet
function preload() {
  const urls = new Set();
  Object.values(CHARACTERS.casey).forEach(u => urls.add(u));
  Object.values(CHARACTERS.tutors).forEach(t => { urls.add(t.idle); urls.add(t.talk); });
  Object.values(SHOP_CATALOG).forEach(c => { urls.add(c.icon); c.items.forEach(i => urls.add(i.art)); });
  ['assets/ui/avatar-chip.png','assets/ui/streak-bar.png','assets/ui/next-class-banner.png','assets/ui/left-rail.png',
   'assets/ui/card-ai-tutor.png','assets/ui/card-games.png','assets/ui/card-homework.png','assets/ui/card-media.png',
   'assets/ui/btn-modify.png','assets/ui/star-icon.png','assets/ui/back-arrow.png','assets/ui/pedestal.png',
   'assets/popups/popup-reward.png','assets/popups/popup-notenough.png','assets/popups/popup-notenough-compact.png',
   'assets/popups/popup-skin-locked.png','assets/popups/loading-spinner.gif',
  ].forEach(u => urls.add(u));
  urls.forEach(u => { const i = new Image(); i.src = u; });
}

document.addEventListener('contextmenu', e => e.preventDefault());
preload();

// resume where the session left off (e.g. accidental reload mid-test)
const resumable = ['dashboard', 'avatarShop', 'tutorShop', 'reward'];
go(resumable.includes(state.screen) ? state.screen : 'facilitator');
