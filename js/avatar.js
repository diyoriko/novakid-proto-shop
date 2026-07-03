// Avatar compositor — draws Casey with EVERY selected artifact on a canvas.
// Base render (per hairstyle) + palette recolor (skin / hair color) +
// overlays (outfit + hands, eyes, glasses, hat). All geometry in the
// 858x1216 @2x render space of the Figma characterType art.

const AVATAR = (() => {
  // source palette of the base render
  const SKIN_BASE = [239, 151, 120];
  const HAIR_BASE = [84, 31, 64];
  const SKIN_TOL = 46, HAIR_TOL = 42;

  // target palettes sampled from Masha's item art (index = catalog position, 0 = default)
  const SKIN_TARGETS = [null, [255, 218, 187], [175, 97, 81], [161, 77, 77], [194, 157, 255], [162, 246, 229]];
  const HAIR_TARGETS = [null, [255, 209, 25], [107, 32, 32], [231, 31, 79], [9, 106, 219], [53, 46, 89]];

  // geometry in render space (@2x). The thumbnails' mannequin head is a MIRROR
  // of Casey's head, so wearables are drawn flipped and placed in mirrored coords.
  // HEAD = Casey's bald-skull box, calibrated from the mannequin's eye geometry.
  const HEAD   = { x: 152, y: 205, w: 471, h: 357 };
  const EYES   = { x: 181, y: 386, w: 237, h: 119 }; // default eye whites bbox

  // outfit try-on: the base body below the jaw is wiped and the mannequin art
  // (same thumb geometry for all 6 outfits) is drawn with ONE uniform scale,
  // calibrated so outfit-1 lands exactly on the baked outfit. Hands are drawn
  // back at the mannequin cuffs (thumb-space anchors).
  const SHADOW_RGB = [107, 102, 115];         // ground shadow flat color in the base art
  const OUTFIT_CAL = {
    s: 2.20,                                   // thumb px -> render px
    cx: 367.5,                                 // garment center-x in render space
    top: 563,                                  // collar top in render space
    ref: { x: 69, y: 15, w: 192, h: 276 },     // outfit-1 content bbox in thumb space
    flip: false,
    hands: [
      { tx: 33,  ty: 144, src: 'assets/wear/hand-left.png' },
      { tx: 224, ty: 150, src: 'assets/wear/hand-right.png' },
    ],
    handW: 54,                                 // thumb-space hand width (height by art aspect)
    // each jacket's sleeves end elsewhere — per-outfit cuff anchors (thumb @2x space),
    // measured from the item art; falls back to `hands` (outfit-1 calibration)
    handsByOutfit: {
      2: [{ tx: 35, ty: 132 }, { tx: 222, ty: 135 }],
      3: [{ tx: 23, ty: 152 }, { tx: 232, ty: 157 }],
      4: [{ tx: 27, ty: 142 }, { tx: 222, ty: 147 }],
      5: [{ tx: 17, ty: 152 }, { tx: 232, ty: 157 }],
      6: [{ tx: 33, ty: 132 }, { tx: 224, ty: 137 }],
    },
  };

  // wearable anchors: item + mannequin-head insets ([top,right,bottom,left] % of the
  // 159.95x151.53 thumb) measured in Figma. Filled per category below (WEAR_ANCHORS).
  // Position = map mannequin-head bbox -> HEAD bbox, apply same affine to item bbox.
  let WEAR_ANCHORS = { hat: [], glasses: [], eyes: [] };

  function setAnchors(a) { WEAR_ANCHORS = a; }

  const cache = {};
  function loadImg(src) {
    return (cache[src] ||= new Promise(resolve => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => resolve(null);
      i.src = src;
    }));
  }

  function remap(data, from, tol, to) {
    const [fr, fg, fb] = from, [tr, tg, tb] = to;
    const kr = tr / fr, kg = tg / fg, kb = tb / fb;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue;
      const d = Math.abs(data[i] - fr) + Math.abs(data[i + 1] - fg) + Math.abs(data[i + 2] - fb);
      // include the shadow shade: same hue family, darker — test against 0.89x too
      const d2 = Math.abs(data[i] - fr * 0.89) + Math.abs(data[i + 1] - fg * 0.89) + Math.abs(data[i + 2] - fb * 0.92);
      if (d < tol || d2 < tol) {
        data[i]     = Math.min(255, data[i] * kr);
        data[i + 1] = Math.min(255, data[i + 1] * kg);
        data[i + 2] = Math.min(255, data[i + 2] * kb);
      }
    }
  }

  function insetToBox(inset, W = 320, H = 303) {
    // inset [top,right,bottom,left] in % -> pixel box in @2x thumb space
    const [t, r, b, l] = inset;
    return { x: l / 100 * W, y: t / 100 * H, w: (100 - l - r) / 100 * W, h: (100 - t - b) / 100 * H };
  }

  function wearPlacement(anchor) {
    // affine: mannequin head box (thumb space, MIRRORED) -> HEAD box (render space)
    const head = insetToBox(anchor.headInset);
    const item = insetToBox(anchor.itemInset);
    const sx = HEAD.w / head.w, sy = HEAD.h / head.h;
    // mirrored horizontal placement: measure from the head's RIGHT edge
    const relRight = (head.x + head.w) - (item.x + item.w);
    return {
      x: HEAD.x + relRight * sx,
      y: HEAD.y + (item.y - head.y) * sy,
      w: item.w * sx,
      h: item.h * sy,
    };
  }

  function drawFlipped(ctx, art, p) {
    ctx.save();
    ctx.translate(p.x + p.w, p.y);
    ctx.scale(-1, 1);
    ctx.drawImage(art, 0, 0, p.w, p.h);
    ctx.restore();
  }

  const famMatch = (r, g, b, ref, tol) =>
    (Math.abs(r - ref[0]) + Math.abs(g - ref[1]) + Math.abs(b - ref[2]) < tol) ||
    (Math.abs(r - ref[0] * 0.89) + Math.abs(g - ref[1] * 0.89) + Math.abs(b - ref[2] * 0.92) < tol);

  // Wipes the body (outfit + arms + legs) off the ctx while keeping the ground
  // shadow, heals the feet-shaped holes in it, and returns a canvas holding the
  // head (full rows above the jaw, per-row skin/hair spans through the chin).
  function liftHeadAndWipeBody(ctx, skinTo, hairTo) {
    const W = 858, H = 1216;
    const FULL_BOT = 556, SPAN_BOT = 700, CLEAR_TOP = 500;
    const skin = skinTo || SKIN_BASE, hair = hairTo || HAIR_BASE;
    const id = ctx.getImageData(0, 0, W, H);
    const d = id.data;

    const head = document.createElement('canvas');
    head.width = W; head.height = H;
    const hctx = head.getContext('2d');
    const hid = hctx.createImageData(W, H);
    const hd = hid.data;
    const JACKET = [214, 45, 0]; // baked jacket orange — never belongs to the head
    const copyRow = (y, x0, x1) => {
      for (let x = x0; x <= x1; x++) {
        const o = (y * W + x) * 4;
        if (y >= FULL_BOT && famMatch(d[o], d[o + 1], d[o + 2], JACKET, 80)) continue;
        hd[o] = d[o]; hd[o + 1] = d[o + 1]; hd[o + 2] = d[o + 2]; hd[o + 3] = d[o + 3];
      }
    };
    for (let y = 0; y < FULL_BOT; y++) copyRow(y, 0, W - 1);
    // below the full band: copy per-row RUNS of skin/hair (chin, ears, hair tips)
    // — never the union span, so the baked collar between them stays behind
    let lastRuns = null, miss = 0;
    for (let y = FULL_BOT; y < SPAN_BOT && miss < 10; y++) {
      const runs = [];
      let start = -1, gap = 0, skinMin = 1e9, skinMax = -1;
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        const isSkin = d[o + 3] > 40 && famMatch(d[o], d[o + 1], d[o + 2], skin, 60);
        const hit = isSkin || (d[o + 3] > 40 && famMatch(d[o], d[o + 1], d[o + 2], hair, 50));
        if (isSkin) { if (x < skinMin) skinMin = x; if (x > skinMax) skinMax = x; }
        if (hit) {
          if (start < 0) start = x;
          gap = 0;
        } else if (start >= 0 && ++gap > 18) {
          runs.push([Math.max(0, start - 4), Math.min(W - 1, x - gap + 4)]);
          start = -1; gap = 0;
        }
      }
      if (start >= 0) runs.push([Math.max(0, start - 4), W - 1]);
      // bridge gaps that lie inside the face (open mouth, eye shadows): the
      // interior of the face is head no matter what color it is
      const merged = [];
      for (const r of runs) {
        const prev = merged[merged.length - 1];
        if (prev && r[0] > prev[1] && prev[1] >= skinMin && r[0] <= skinMax) prev[1] = r[1];
        else merged.push(r);
      }
      if (merged.length) { lastRuns = merged; miss = 0; }
      else miss++;
      // ride the jaw outline a few rows past the last skin/hair pixels
      for (const [a, b] of (merged.length ? merged : lastRuns || [])) copyRow(y, a, b);
    }
    hctx.putImageData(hid, 0, 0);

    // wipe below CLEAR_TOP; the ground shadow (flat grey, lives below y=1000)
    // is the only survivor
    const SHADOW_TOP = 1000;
    let sMinX = 1e9, sMinY = 1e9, sMaxX = -1, sMaxY = -1;
    for (let y = CLEAR_TOP; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (d[o + 3] <= 40) continue;
      if (y >= SHADOW_TOP && Math.abs(d[o] - SHADOW_RGB[0]) + Math.abs(d[o + 1] - SHADOW_RGB[1]) + Math.abs(d[o + 2] - SHADOW_RGB[2]) < 24) {
        if (x < sMinX) sMinX = x; if (x > sMaxX) sMaxX = x; if (y < sMinY) sMinY = y; if (y > sMaxY) sMaxY = y;
      } else {
        d[o + 3] = 0;
      }
    }
    ctx.putImageData(id, 0, 0);
    if (sMaxX > 0) { // heal the holes where the old shoes stood — a flat ellipse hugging the ground
      const ry = Math.min((sMaxY - sMinY) / 2, 60);
      ctx.fillStyle = `rgb(${SHADOW_RGB[0]},${SHADOW_RGB[1]},${SHADOW_RGB[2]})`;
      ctx.beginPath();
      ctx.ellipse((sMinX + sMaxX) / 2, sMaxY - ry - 2, (sMaxX - sMinX) / 2, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return head;
  }

  // look = { hair, skinIdx, hairColorIdx, outfitIdx, eyesIdx, hatIdx, glassesIdx }
  // *Idx are catalog indices; 0 / -1 / undefined mean "default / nothing"
  async function compose(look) {
    const canvas = document.createElement('canvas');
    canvas.width = 858; canvas.height = 1216;
    const ctx = canvas.getContext('2d');

    const base = await loadImg(CHARACTERS.casey[look.hair || 'default']);
    if (base) ctx.drawImage(base, 0, 0);

    // palette recolors
    const skinTo = SKIN_TARGETS[look.skinIdx] || null;
    const hairTo = HAIR_TARGETS[look.hairColorIdx] || null;
    if (skinTo || hairTo) {
      const id = ctx.getImageData(0, 0, 858, 1216);
      if (skinTo) remap(id.data, SKIN_BASE, SKIN_TOL, skinTo);
      if (hairTo) remap(id.data, HAIR_BASE, HAIR_TOL, hairTo);
      ctx.putImageData(id, 0, 0);
    }

    // outfit try-on: wipe the baked body, dress the mannequin art at the
    // calibrated uniform scale, put hands back at the cuffs, head back on top
    if (look.outfitIdx > 0) {
      const art = await loadImg(`assets/items/outfit/outfit-${look.outfitIdx + 1}.png`);
      if (art) {
        const head = liftHeadAndWipeBody(ctx, skinTo, hairTo);
        const C = OUTFIT_CAL, s = C.s;
        const offX = C.cx - (C.ref.x + C.ref.w / 2) * s;
        const offY = C.top - C.ref.y * s;
        const p = { x: offX, y: offY, w: art.width * s, h: art.height * s };
        if (C.flip) drawFlipped(ctx, art, p);
        else ctx.drawImage(art, p.x, p.y, p.w, p.h);
        const cuffs = C.handsByOutfit[look.outfitIdx + 1] || C.hands;
        for (let hi = 0; hi < C.hands.length; hi++) {
          const h = { ...C.hands[hi], ...cuffs[hi] };
          const hand = await loadImg(h.src);
          if (!hand) continue;
          const hw = C.handW * s, hh = hw * hand.height / hand.width;
          const hx = C.flip ? (offX + p.w - (h.tx * s) - hw) : offX + h.tx * s;
          const hy = offY + h.ty * s;
          if (skinTo) {
            const hc = document.createElement('canvas');
            hc.width = hand.width; hc.height = hand.height;
            const hcx = hc.getContext('2d');
            hcx.drawImage(hand, 0, 0);
            const hid = hcx.getImageData(0, 0, hc.width, hc.height);
            remap(hid.data, SKIN_BASE, SKIN_TOL, skinTo);
            hcx.putImageData(hid, 0, 0);
            ctx.drawImage(hc, hx, hy, hw, hh);
          } else {
            ctx.drawImage(hand, hx, hy, hw, hh);
          }
        }
        ctx.drawImage(head, 0, 0);
      }
    }

    // eyes: hide the default ones under a skin patch, then draw the new pair.
    // Placement is calibrated: eyes-1 (the default art) maps exactly onto the
    // default eye-whites bbox; other variants use the same affine.
    if (look.eyesIdx > 0 && WEAR_ANCHORS.eyes[look.eyesIdx] && WEAR_ANCHORS.eyes[0]) {
      const skin = skinTo || SKIN_BASE;
      ctx.fillStyle = `rgb(${skin[0]},${skin[1]},${skin[2]})`;
      ctx.beginPath();
      ctx.ellipse(EYES.x + EYES.w / 2, EYES.y + EYES.h / 2, EYES.w / 2 + 16, EYES.h / 2 + 14, 0, 0, Math.PI * 2);
      ctx.fill();
      const ref = insetToBox(WEAR_ANCHORS.eyes[0].itemInset);
      const it = insetToBox(WEAR_ANCHORS.eyes[look.eyesIdx].itemInset);
      const sx = EYES.w / ref.w, sy = EYES.h / ref.h;
      // mirrored horizontal placement relative to the reference eye box
      const relRight = (ref.x + ref.w) - (it.x + it.w);
      const art = await loadImg(`assets/wear/eyes-${look.eyesIdx + 1}.png`);
      if (art) {
        drawFlipped(ctx, art, {
          x: EYES.x + relRight * sx, y: EYES.y + (it.y - ref.y) * sy,
          w: it.w * sx, h: it.h * sy,
        });
      }
    }

    for (const [cat, idx] of [['glasses', look.glassesIdx], ['hat', look.hatIdx]]) {
      if (!(idx >= 0) || !WEAR_ANCHORS[cat][idx]) continue;
      const art = await loadImg(`assets/wear/${cat}-${idx + 1}.png`);
      if (art) drawFlipped(ctx, art, wearPlacement(WEAR_ANCHORS[cat][idx]));
    }

    return canvas;
  }

  return { compose, setAnchors, _cal: OUTFIT_CAL }; // _cal exposed for calibration in devtools
})();
