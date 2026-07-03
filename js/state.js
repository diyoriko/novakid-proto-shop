// Session state: persists across screens (and reloads) within one participant
// session via sessionStorage. Facilitator resets between participants.
const STORE_KEY = 'nk-proto-shop-state-v1';

const DEFAULT_STATE = {
  flow: 'both',             // single combined flow: avatar + tutor customization
  screen: 'facilitator',    // current screen id
  balance: CONFIG.startBalance,
  rewardTaken: false,
  hair: 'default',          // 'default' | 'ponytail' | 'short'
  tutor: 'pandy',           // 'pandy' | 'redpandy' | 'barsu' | 'duck'
  shopCategory: 'skin',     // active category in the avatar shop
  // purchases made with stars (Tweaks can top up the balance):
  ownedExtra: {},           // { category: [itemIndex, ...], tutor: [key, ...] }
  selectedExtra: {},        // { category: itemIndex } — committed selection per category
  // draft try-on state — nothing is charged until the kid taps Apply:
  draftSelected: null,      // { category: itemIndex } while browsing the avatar shop
  draftHair: null,          // hairstyle previewed on the pedestal
  tryOnTutor: null,         // tutor previewed on the pedestal in the tutor shop
  muted: false,             // sound design on/off (Tweaks menu)
  log: [],                  // research event log: {t, event, detail}
};

let state = load();

function load() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) {
      const st = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
      // sessions saved by older builds may miss newer keys
      if (!st.ownedExtra) st.ownedExtra = {};
      if (!st.selectedExtra) st.selectedExtra = {};
      if (!st.log) st.log = [];
      return st;
    }
  } catch (e) { /* fall through to default */ }
  return structuredClone(DEFAULT_STATE);
}

function save() {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function setState(patch) {
  Object.assign(state, patch);
  save();
}

// Research log — every meaningful tap lands here with a timestamp.
function logEvent(event, detail = '') {
  state.log.push({ t: new Date().toISOString(), event, detail });
  save();
}

function resetState() {
  state = structuredClone(DEFAULT_STATE);
  save();
}

function exportLog() {
  const blob = new Blob([JSON.stringify(state.log, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `session-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
