// ============================================================
//  Reva's Special Birthday Visual Novel
//  Follows prd.md: 3-phase flow, typing effect, Web Audio SFX
// ============================================================

// ---- Content Script (PRD Section 5) ----
const dialogue = [
  ["🐶", "tes, tes... satu, dua. apakah gw sudah terhubung dengan reva?"],
  ["🐶", "haloo ini gw mingyu mau mengucapkan selamat ulang tahun kepada elu reva"],
  ["🐶", "hmmmm....."],
  ["🚨", "untuk hadiahnya, selamat! kamu memenangkan 1x VIP Tiket SEVENTEEN World Tour 2028 di ICE BSD!"],
  ["🐶", "tapi karena ini tiket jalur gaib, pas lu dateng nanti ke konsernya tinggal bilang aja ke satpam..."],
  ["🐶", "lu bilang gini: 'pak, saya temennya mingyu' nanti lu bakal langsung disuruh masuk kok"],
  ["😜", "kayaknya sih..."],
  ["💻", "[AVRUA TAKE OVER ALERT]"],
  ["💻", "tes tes..."],
  ["🤫", "sorry mingyu udah gua kick"],
  ["✨", "gw mau bilang.."],
  ["🎉", "selamat ulang tahun, dan.."],
  ["🥂", "..thanks for letting me yap every day"],
  ["🤍", "thanks for being such a pure person"],
  ["😊", "it's so much fun talking to you"],
  ["🥰", "i could literally talk to you for hours and never get bored, asal lu tau"],
  ["🥺", "pleaseeeee, i hope you never change"],
  ["😜", "sengaja inggris biar ga alay cok wkwk"],
  ["🙄", "lu mah tetep bakal bilang alay sih"],
  ["😢", "intinya gua sedih sih kalo dicuekin"],
  ["❄️", "kemaren aja cuaca dingin bgt"],
  ["🧣", "lu mah jangan sampe dingin ke gua cok"],
  ["🤫", "gitu deehh"],
  ["🎂", "once again, happy birthday! enjoy your special day to the fullest!"],
  ["🎯", "i hope this year brings you closer to all your goals"],
  ["💰", "gw doain semoga lu kaya raya"],
  ["🙏", "aamiiinn"]
];

// Steps that use "alert mode" SFX + faster pacing (PRD FR-3)
const ALERT_STEPS = new Set([4, 8]); // 1-indexed
const GATE_STEP = 7; // intermission gate appears here
const CHOICE_STEP = 18; // "lu mah tetep bakal bilang alay sih" -> 2 choices

const NORMAL_DELAY = 45;
const ALERT_DELAY = 28;

// ---- DOM ----
const landing = document.getElementById("landing");
const game = document.getElementById("game");
const gameFrame = document.getElementById("gameFrame");
const circleImg = document.getElementById("circleImg");
const textEl = document.getElementById("text");
const dialogBox = document.getElementById("dialogBox");
const indicator = document.getElementById("indicator");
const gateBtn = document.getElementById("gateBtn");
const choiceWrap = document.getElementById("choiceWrap");
const choiceA = document.getElementById("choiceA");
const choiceB = document.getElementById("choiceB");
const endBtn = document.getElementById("endBtn");
const endScreen = document.getElementById("end");
const audioMingyu = document.getElementById("audioMingyu");
const audioAvrua = document.getElementById("audioAvrua");

// ---- Background audio (local MP3, ad-free) ----
function playMusic(el) {
  el.currentTime = 0;
  const p = el.play();
  if (p && p.catch) p.catch(() => {});
}

function switchMusic(from, to) {
  from.pause();
  playMusic(to);
}


// ---- Audio (Web Audio API, square wave) ----
let audioCtx = null;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    audioCtx = new AC();
    audioCtx.resume();
  }
}

function playBeep(freq, type) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.setValueAtTime(0.2, t + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

// Distinct SFX per speaker (PRD FR-3)
//  Mingyu: buzzy low square wave (~110Hz)
//  Avrua : softer higher triangle wave (~330Hz)
function beepForStep(step) {
  const alert = ALERT_STEPS.has(step);
  const mingyu = step <= GATE_STEP;
  if (mingyu) {
    return alert
      ? { type: "square", freq: 180 + Math.floor(Math.random() * 200) }
      : { type: "square", freq: 110 };
  }
  return alert
    ? { type: "triangle", freq: 420 + Math.floor(Math.random() * 260) }
    : { type: "triangle", freq: 330 };
}

// ---- State ----
let currentStep = 0;      // 1-indexed
let isTyping = false;
let typeTimeout = null;
let fullText = "";

// ---- Typing Engine ----
function startStep(step, overrideText) {
  currentStep = step;
  const idx = step - 1;
  const [, txt] = dialogue[idx];
  fullText = overrideText || txt;

  // Mingyu photo during his dialogue (steps 1-7), Avrua photo during takeover
  if (step <= GATE_STEP) {
    circleImg.src = "assets/mingyu.jpg";
  } else {
    circleImg.src = "assets/avrua.jpg";
  }
  circleImg.classList.remove("hidden");

  textEl.textContent = "";
  dialogBox.classList.remove("done");
  gateBtn.classList.add("hidden");
  choiceWrap.classList.add("hidden");
  isTyping = true;

  // Glitch effect on AVRUA takeover
  if (step === 8) {
    gameFrame.classList.add("glitch");
    setTimeout(() => gameFrame.classList.remove("glitch"), 700);
  }
  // Dancing monkey during takeover
  const alert = ALERT_STEPS.has(step);
  const delay = alert ? ALERT_DELAY : NORMAL_DELAY;
  const beep = beepForStep(step);

  let i = 0;
  function typeChar() {
    if (i < fullText.length) {
      const ch = fullText[i];
      textEl.textContent += ch;
      if (ch !== " ") {
        playBeep(beep.freq, beep.type);
      }
      i++;
      typeTimeout = setTimeout(typeChar, delay);
    } else {
      finishTyping();
    }
  }
  typeChar();
}

function finishTyping() {
  clearTimeout(typeTimeout);
  textEl.textContent = fullText;
  isTyping = false;
  dialogBox.classList.add("done");
  // Intermission gate at step 7
  if (currentStep === GATE_STEP) {
    gateBtn.classList.remove("hidden");
  }
  // Choice at step 18 ("lu mah tetep bakal bilang alay sih")
  if (currentStep === CHOICE_STEP) {
    choiceWrap.classList.remove("hidden");
  }
  // "?" button after the final dialogue
  if (currentStep === dialogue.length) {
    endBtn.classList.remove("hidden");
  }
}

function skipTyping() {
  clearTimeout(typeTimeout);
  finishTyping();
}

function advance() {
  // At gate step, do not advance by tapping the frame
  if (currentStep === GATE_STEP) return;
  if (currentStep < dialogue.length) {
    startStep(currentStep + 1);
  }
}

// ---- Prevent text selection / copy ----
["copy", "cut", "contextmenu", "selectstart"].forEach((ev) => {
  document.addEventListener(ev, (e) => e.preventDefault());
});

// ---- Interaction ----
gameFrame.addEventListener("click", (e) => {
  // Ignore taps that originate on the gate/choice/end buttons (handled separately)
  if (e.target === gateBtn || e.target === choiceA || e.target === choiceB || e.target === endBtn) return;
  // While choices are shown, taps on the frame do nothing
  if (!choiceWrap.classList.contains("hidden")) return;
  if (isTyping) {
    skipTyping();
  } else {
    advance();
  }
});

gateBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  gateBtn.classList.add("hidden");
  switchMusic(audioMingyu, audioAvrua); // switch song on Avrua takeover
  startStep(8); // begin Avrua takeover
});

endBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  game.classList.add("hidden");
  endScreen.classList.remove("hidden");
});

// Step 18 choice: branch the next dialogue (step 19)
choiceA.addEventListener("click", (e) => {
  e.stopPropagation();
  choiceWrap.classList.add("hidden");
  startStep(19, "tuh kan anjir lah");
});
choiceB.addEventListener("click", (e) => {
  e.stopPropagation();
  choiceWrap.classList.add("hidden");
  startStep(19, "yippiee");
});

landing.querySelector("#claimBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  landing.classList.add("hidden");
  game.classList.remove("hidden");
  startStep(1);
  // Play local MP3 in background (user gesture allows sound)
  playMusic(audioMingyu);
});
