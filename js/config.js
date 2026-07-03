// Prototype economy + flow settings — edit freely between test sessions.
// Everything the moderator may want to tweak lives here.
const CONFIG = {
  // Star economy. Kid starts with startBalance, gets classReward from the
  // "Great job in Class!" popup, so ends at 1000 — matching the shop mocks.
  // All paid items cost itemPrice (2000) → "Not enough stars" is always shown,
  // which is the intended test condition.
  startBalance: 960,
  classReward: 40,
  itemPrice: 2000,

  // Text shown on the dashboard banner.
  nextClassText: 'Next class: 27 June, 6PM',
  characterName: 'Casey',

  // Tutor greeting phrases (speech bubble on try-on in the tutor shop).
  tutorPhrases: {
    pandy:    'Hello my friend!',
    redpandy: "Yo, what's up?",
    barsu:    'Hmph. Fine, I will teach you.',
    duck:     'Quack-tastic to meet you!',
    aliencat: 'Greetings, earth kid!',
    unicorn:  'Sparkles and rainbows, hello!',
    glazy:    'Hi sweetie! Donut worry, learning is fun!',
  },
  // Greeting after returning to the dashboard with a new tutor.
  tutorHello: 'Hello! Let’s go to AI Tutor — adventures are waiting!',
  // The prompt from the current tutor that leads the kid to the tutor shop (flow B).
  tutorPrompt: 'Great job! Want to see some other characters?',

  // How long the "Preparing your new Tutor..." screen shows, ms.
  loadingMs: 2600,

  // Star counter tick-up animation: steps of +5, like the Figma component.
  tickStep: 5,
  tickIntervalMs: 90,
};
