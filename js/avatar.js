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
  // slightly larger than the baked outfit so no old-outfit edges peek out
  const OUTFIT = { x: 126, y: 518, w: 482, h: 686 };
  const HANDS  = [{ x: 176, y: 843, w: 120, h: 141, src: 'assets/wear/hand-left.png' },
                  { x: 464, y: 874, w: 120, h: 141, src: 'assets/wear/hand-right.png' }];
  const EYES   = { x: 181, y: 386, w: 237, h: 119 }; // default eye whites bbox

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

    // outfit overlay (covers the baked one), hands redrawn on top
    if (look.outfitIdx > 0) {
      const art = await loadImg(`assets/items/outfit/outfit-${look.outfitIdx + 1}.png`);
      if (art) {
        ctx.drawImage(art, OUTFIT.x, OUTFIT.y, OUTFIT.w, OUTFIT.h);
        for (const h of HANDS) {
          const hand = await loadImg(h.src);
          if (!hand) continue;
          if (skinTo) {
            const hc = document.createElement('canvas');
            hc.width = hand.width; hc.height = hand.height;
            const hctx = hc.getContext('2d');
            hctx.drawImage(hand, 0, 0);
            const hid = hctx.getImageData(0, 0, hc.width, hc.height);
            remap(hid.data, SKIN_BASE, SKIN_TOL, skinTo);
            hctx.putImageData(hid, 0, 0);
            ctx.drawImage(hc, h.x, h.y, h.w, h.h);
          } else {
            ctx.drawImage(hand, h.x, h.y, h.w, h.h);
          }
        }
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

  return { compose, setAnchors };
})();
