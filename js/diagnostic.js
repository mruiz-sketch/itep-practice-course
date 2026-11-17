// ============================================================
//  Diagnostic test (adaptive) — built on the 500-question bank
//  4 sections × 8 questions. Each answer moves the student's
//  estimated level up or down; the next question is taken
//  from that level. Result: CEFR level + iTEP-style band (1–6).
// ============================================================
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LEVEL_NAMES = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-intermediate", C1: "Advanced", C2: "Proficient" };
const SECTIONS = [
  { key: "G", name: "Grammar", text: "Choose the word or phrase that best completes each sentence." },
  { key: "V", name: "Vocabulary", text: "Choose the word or expression that best fits each sentence." },
  { key: "L", name: "Listening", text: "Press play to hear a short conversation or talk, then answer the question. You can listen twice. Use headphones if you can." },
  { key: "R", name: "Reading", text: "Read each text carefully and answer the question about it." },
];
const PER_SECTION = 8;
const START = 1.5;        // first guess: between A2 and B1

// Ability estimate (simple item-response model): each question's difficulty is its
// level (A1 = 0 … C2 = 5). With 4 options a guess is right 25% of the time.
const GRID = Array.from({ length: 141 }, (_, i) => -1 + i * 0.05); // ability -1 … 6
const P = (theta, b) => 0.25 + 0.75 / (1 + Math.exp(-1.7 * (theta - b)));
function estimate(answers, prior = START, sd = 1.5) {
  let num = 0, den = 0;
  for (const t of GRID) {
    let w = Math.exp(-((t - prior) ** 2) / (2 * sd * sd));
    for (const a of answers) { const p = P(t, a.li); w *= a.correct ? p : 1 - p; }
    num += w * t; den += w;
  }
  return num / den;
}

let bankPromise = null;
function loadBank() {
  bankPromise ||= fetch("data/question-bank.json").then((r) => {
    if (!r.ok) throw new Error("Could not load the questions.");
    return r.json();
  }).then((rows) => rows.map(([id, s, level, skill, q, a, d, p]) => ({ id, s, level, li: LEVELS.indexOf(level), skill, q, a, d, p })));
  return bankPromise;
}

const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const bandOf = (theta) => Math.round((clamp(theta, 0, 5) + 1) * 10) / 10; // 1.0 – 6.0
export const levelOf = (theta) => LEVELS[clamp(Math.round(theta), 0, 5)];

// ------------------------------------------------------------
//  Listening: read the script aloud with the browser's voices
// ------------------------------------------------------------
const tts = (() => {
  const synth = window.speechSynthesis;
  let voices = [];
  const load = () => { voices = (synth?.getVoices() || []).filter((v) => /^en(-|_|$)/i.test(v.lang)); };
  if (synth) { load(); synth.addEventListener?.("voiceschanged", load); }
  const pick = (re) => voices.find((v) => re.test(v.name));
  function voiceFor(who) {
    const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
    const pool = us.length ? us : voices;
    if (who === "W") return pick(/samantha|zira|aria|jenny|female|victoria|karen|moira|google us english/i) || pool[0];
    if (who === "M") return pick(/daniel|david|guy|male|alex|fred|google uk english male/i) || pool[1] || pool[0];
    return pick(/google us english|samantha|aria|jenny/i) || pool[0];
  }
  const api = {
    supported: false,
    // voices load late in some browsers; without English voices we show the script instead
    async ready() {
      if (!synth || !("SpeechSynthesisUtterance" in window)) return (api.supported = false);
      for (let i = 0; i < 15 && !voices.length; i++) { await wait(100); load(); }
      return (api.supported = voices.length > 0);
    },
    stop() { synth?.cancel(); },
    play(script, onEnd) {
      synth.cancel();
      const lines = script.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, i) => {
        let who = "N", text = line;
        const m = line.match(/^([A-Za-z ]{1,20}):\s*(.*)$/);
        if (m) { text = m[2]; who = m[1].trim() === "W" ? "W" : m[1].trim() === "M" ? "M" : "N"; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.92;
        const v = voiceFor(who);
        if (v) u.voice = v;
        u.pitch = who === "W" ? 1.15 : who === "M" ? 0.85 : 1;
        if (i === lines.length - 1) u.onend = onEnd;
        synth.speak(u);
      });
    },
  };
  return api;
})();

// ------------------------------------------------------------
//  Test controller
// ------------------------------------------------------------
export function createDiagnostic({ root, toast, onSave, onExit }) {
  const body = $("#xBody", root);
  let bank = [];
  let state = null;

  function render(html) {
    body.classList.remove("show");
    void body.offsetWidth;
    body.innerHTML = html;
    body.classList.add("show");
  }
  function progress() {
    const done = state ? state.answers.length : 0;
    const total = SECTIONS.length * PER_SECTION;
    $("#xBar", root).style.width = `${(done / total) * 100}%`;
    $("#xStep", root).textContent = state && state.sec < SECTIONS.length ? `${SECTIONS[state.sec].name} · ${done} of ${total} answered` : "";
  }

  function open() {
    document.body.classList.add("is-diag");
    root.classList.add("show");
    root.setAttribute("aria-hidden", "false");
  }
  function close() {
    tts.stop();
    root.classList.remove("show");
    root.setAttribute("aria-hidden", "true");
  }

  // ---------- Intro ----------
  async function start(profile) {
    open();
    state = null; progress();
    render(`<div class="x-center"><p class="t-kicker">ITEP PRACTICE COURSE</p>
      <h2 class="t-title">DIAGNOSTIC TEST</h2>
      <p class="x-lead">Hi ${esc(profile.firstName || "")}! This test finds your current English level.</p>
      <ul class="x-facts">
        <li><strong>${SECTIONS.length * PER_SECTION}</strong> questions</li>
        <li><strong>4</strong> sections: Grammar, Vocabulary, Listening, Reading</li>
        <li>About <strong>20–25</strong> minutes</li>
      </ul>
      <p class="x-note">The test adapts to you: after a correct answer the next question is harder; after a mistake it is easier. Don't worry if some questions feel difficult. Answer each one as well as you can; you can't go back.</p>
      <div class="t-actions"><button type="button" class="btn-blue ghost" data-x="exit">Not now</button>
      <button type="button" class="btn-blue" data-x="begin" disabled>Loading questions…</button></div></div>`);
    try {
      bank = await loadBank();
      const b = $("[data-x=begin]", body); b.disabled = false; b.textContent = "Start the test";
    } catch (e) { toast(e.message, "error"); }
  }

  function begin() {
    state = { sec: 0, prior: START, theta: START, n: 0, used: new Set(), answers: [], thetas: {} };
    sectionIntro();
  }

  async function sectionIntro() {
    const S = SECTIONS[state.sec];
    if (S.key === "L") await tts.ready();
    progress();
    const extra = S.key === "L" && !tts.supported
      ? `<p class="x-note warn">Audio is not available in this browser, so you will read the script instead. For the real test experience, use Chrome, Edge or Safari.</p>` : "";
    render(`<div class="x-center"><p class="t-kicker">SECTION ${state.sec + 1} OF ${SECTIONS.length}</p>
      <h2 class="t-title">${S.name.toUpperCase()}</h2>
      <p class="x-lead">${esc(S.text)}</p>${extra}
      <div class="t-actions"><button type="button" class="btn-blue" data-x="section-go">Start ${esc(S.name)}</button></div></div>`);
  }

  function nextQuestion() {
    const S = SECTIONS[state.sec];
    const target = clamp(Math.round(state.theta + 0.2), 0, 5);
    // nearest level that still has unused questions
    let pool = [];
    for (let d = 0; d < 6 && !pool.length; d++) {
      for (const li of [target + d, target - d]) {
        if (li < 0 || li > 5) continue;
        pool = bank.filter((q) => q.s === S.key && q.li === li && !state.used.has(q.id));
        if (pool.length) break;
      }
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    state.used.add(q.id);
    state.current = { q, options: shuffle([q.a, ...q.d]), choice: null, plays: 0 };
    showQuestion();
  }

  function showQuestion() {
    const { q, options } = state.current;
    const S = SECTIONS[state.sec];
    const opts = `<div class="x-options ${S.key === "R" ? "one-col" : ""}" role="radiogroup">
      ${options.map((o, i) => `<button type="button" class="x-opt" role="radio" aria-checked="false" data-opt="${i}" ${S.key === "L" && tts.supported ? "disabled" : ""}>
        <span class="x-letter">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
    const head = `<p class="t-kicker">${S.name.toUpperCase()} · QUESTION ${state.n + 1} OF ${PER_SECTION}</p>`;
    const next = `<div class="t-actions"><button type="button" class="btn-blue" data-x="next" disabled>${state.n + 1 === PER_SECTION ? (state.sec + 1 === SECTIONS.length ? "Finish" : "Next section") : "Next"}</button></div>`;
    const question = `<p class="x-q">${esc(q.q).replace(/_{3,}/g, '<span class="x-blank">_____</span>')}</p>`;

    if (S.key === "R") {
      render(`<div class="x-read">
        <article class="x-passage">${esc(q.p).replace(/\n/g, "<br>")}</article>
        <div class="x-side">${head}${question}${opts}${next}</div></div>`);
    } else if (S.key === "L") {
      const audio = tts.supported
        ? `<div class="x-audio"><button type="button" class="x-play" data-x="play" aria-label="Play audio">
             <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>
             <p class="x-plays" id="xPlays">Press play to listen · 2 plays left</p></div>`
        : `<article class="x-passage small">${esc(q.p).replace(/\n/g, "<br>")}</article>`;
      render(`<div class="x-center">${head}${audio}${question}${opts}${next}</div>`);
    } else {
      render(`<div class="x-center">${head}${question}${opts}${next}</div>`);
    }
  }

  function play(btn) {
    const cur = state.current;
    if (cur.plays >= 2) return;
    cur.plays++;
    btn.classList.add("playing"); btn.disabled = true;
    $("#xPlays", body).textContent = "Playing…";
    body.querySelectorAll(".x-opt").forEach((b) => (b.disabled = false));
    let ended = false;
    const done = () => {
      if (ended || state?.current !== cur) return;
      ended = true;
      btn.classList.remove("playing");
      const left = 2 - cur.plays;
      btn.disabled = left === 0;
      $("#xPlays", body).textContent = left ? `1 play left` : "No plays left";
    };
    tts.play(cur.q.p, done);
    // some browsers never report the end of speech: unlock after the expected time
    const words = cur.q.p.split(/\s+/).length;
    setTimeout(done, (words / 2.3) * 1000 + 2500);
  }

  function choose(i) {
    state.current.choice = i;
    body.querySelectorAll(".x-opt").forEach((b) => {
      const on = Number(b.dataset.opt) === i;
      b.classList.toggle("on", on); b.setAttribute("aria-checked", on);
    });
    $("[data-x=next]", body).disabled = false;
  }

  async function answer() {
    const { q, options, choice } = state.current;
    if (choice == null) return;
    tts.stop();
    const correct = options[choice] === q.a;
    state.answers.push({ id: q.id, s: q.s, li: q.li, level: q.level, skill: q.skill, correct });
    // new estimate of the student's level in this section; the next question is picked near it
    const S = SECTIONS[state.sec];
    state.theta = estimate(state.answers.filter((a) => a.s === S.key), state.prior);
    state.n++;
    progress();
    if (state.n < PER_SECTION) return nextQuestion();

    // section finished
    state.thetas[SECTIONS[state.sec].key] = state.theta;
    state.sec++;
    if (state.sec < SECTIONS.length) {
      const prev = Object.values(state.thetas);
      // the next section starts near the level found so far
      state.prior = state.theta = clamp(prev.reduce((a, b) => a + b, 0) / prev.length, 0.5, 4.5);
      state.n = 0;
      return sectionIntro();
    }
    finish();
  }

  async function finish() {
    const t = state.thetas;
    const overall = (t.G + t.V + t.L + t.R) / 4;
    const sections = {};
    SECTIONS.forEach((S) => (sections[S.name.toLowerCase()] = { level: levelOf(t[S.key]), band: bandOf(t[S.key]) }));
    const toPractice = {};
    SECTIONS.forEach((S) => {
      const missed = [...new Set(state.answers.filter((a) => a.s === S.key && !a.correct).map((a) => a.skill))].slice(0, 3);
      if (missed.length) toPractice[S.name.toLowerCase()] = missed;
    });
    const result = {
      diagnosticLevel: levelOf(overall),
      diagnosticScore: bandOf(overall),
      diagnosticSections: sections,
      diagnosticPractice: toPractice,
      diagnosticCorrect: state.answers.filter((a) => a.correct).length,
      diagnosticTotal: state.answers.length,
    };
    render(`<div class="x-center"><p class="empty">Saving your result…</p></div>`);
    try { await onSave(result); }
    catch (e) { toast(e.message || "Your result could not be saved. Please tell your teacher.", "error", 7000); }
    showResult(result);
  }

  // ---------- Result ----------
  function showResult(r, profile) {
    open();
    state = null; progress();
    const secs = SECTIONS.map((S) => {
      const s = r.diagnosticSections?.[S.name.toLowerCase()];
      if (!s) return "";
      return `<div class="x-row"><span class="x-sec">${S.name}</span>
        <span class="x-track"><span style="width:${(s.band / 6) * 100}%"></span></span>
        <span class="x-lvl">${s.level}</span></div>`;
    }).join("");
    const practice = Object.entries(r.diagnosticPractice || {}).map(([sec, skills]) =>
      `<li><strong>${esc(sec[0].toUpperCase() + sec.slice(1))}:</strong> ${skills.map(esc).join(", ")}</li>`).join("");
    render(`<div class="x-result">
      <div class="x-badge"><p class="t-kicker">YOUR LEVEL</p>
        <p class="x-big">${esc(r.diagnosticLevel)}</p>
        <p class="x-name">${esc(LEVEL_NAMES[r.diagnosticLevel] || "")}</p>
        <p class="x-band">iTEP band ${Number(r.diagnosticScore).toFixed(1)} / 6</p>
        ${r.diagnosticTotal ? `<p class="x-small">${r.diagnosticCorrect} of ${r.diagnosticTotal} correct</p>` : ""}</div>
      <div class="x-detail"><h3>By section</h3>${secs}
        ${practice ? `<h3>What to practice next</h3><ul class="x-practice">${practice}</ul>` : `<h3>Excellent work!</h3><p class="x-small">You answered every question correctly.</p>`}
        <div class="t-actions left"><button type="button" class="btn-blue" data-x="exit">Done</button></div></div></div>`);
  }

  root.addEventListener("click", (e) => {
    const opt = e.target.closest("[data-opt]");
    if (opt && !opt.disabled) return choose(Number(opt.dataset.opt));
    const a = e.target.closest("[data-x]"); if (!a || a.disabled) return;
    switch (a.dataset.x) {
      case "begin": begin(); break;
      case "section-go": nextQuestion(); break;
      case "play": play(a); break;
      case "next": answer(); break;
      case "exit": close(); onExit(); break;
    }
  });
  // keyboard: 1–4 or A–D to choose, Enter for next
  addEventListener("keydown", (e) => {
    if (!root.classList.contains("show") || !state?.current || e.target.tagName === "INPUT") return;
    const k = e.key.toUpperCase();
    const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "ABCD".indexOf(k);
    const btn = i >= 0 && body.querySelector(`[data-opt="${i}"]`);
    if (btn && !btn.disabled) choose(i);
    else if (e.key === "Enter" && e.target.tagName !== "BUTTON" && state.current.choice != null) { e.preventDefault(); answer(); }
  });

  return { start, showResult, close };
}
