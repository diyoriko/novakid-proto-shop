# Novakid — Customization Prototype

Interactive research prototype for the kids-era customization study: avatar shop
(skin / hair / hair color / eyes / outfit / hat / glasses) + AI-Tutor choice, with
real state, a star economy and synthesized UI sounds.

Built from the Figma design (frames rebuilt 1:1, art exported from the source file).
Unlike a Figma click-through, the character composes live and every choice persists
across the whole flow — no hand-assembled frame combinations.

**Live:** https://diyoriko.github.io/novakid-proto-shop/

## For facilitators

- **Start session** — one combined flow: class-reward popup (+40 ⭐) → dashboard →
  avatar shop (Modify / shop icon / avatar chip / tap the character) and AI-Tutor
  shop (AI Tutor tile).
- **Try-on is free, Apply commits.** Tapping any item — including priced ones —
  previews it on the character (skin and hair colors recolor live, hats/glasses/
  eyes/outfits composite on the canvas). Stars are charged only when the kid taps
  Apply; if the total exceeds the balance, the "Not enough stars" popup shows.
- **⚙ Tweaks** (translucent chip, bottom-left) — reset between participants,
  +1000 ⭐ top-up (to unlock purchases), sound on/off, research-log export.
- Everything is logged with timestamps: which entrance the kid used, items tried,
  purchases, popups seen. Export as JSON from Tweaks.
- Economy in `js/config.js`: start 960 ⭐ + 40 reward = 1000; every paid item 2000
  (i.e. "Not enough stars" is the intended test condition until you top up).

## Stack

No build, no dependencies: static HTML/CSS/JS, layered PNGs exported from Figma,
Web Audio API for sounds. Serve the folder with any static server:

```
python3 -m http.server 8787
```

## Structure

```
index.html          entry, 1280x720 stage scaled to fit
css/app.css         all styles
js/config.js        economy + copy (edit freely)
js/state.js         session state, persistence, research log
js/data.js          item/tutor catalogs
js/sfx.js           synthesized sound design
js/app.js           screens + logic
assets/             art exported from the Figma source file
fonts/              Mikado webfonts
```
