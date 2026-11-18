// ============================================================
//  Personalized learning path
//  Takes the diagnostic result + the 4-week plan and turns it
//  into an ordered list of English Practice Lessons (lessons/).
//  Topics, number and order of lessons change with each result:
//   · every topic the student missed → its matching lesson first
//   · weaker sections get more lessons (and come first)
//   · each section starts at the student's level in that section
//  Lessons unlock one after another; progress is saved per lesson.
// ============================================================
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- Lesson catalog (lessons/js/catalog.js) ----------
const CAT = window.CATALOG || { levels: [], available: [] };
const BLOCK_NAMES = { g: "Grammar", v: "Vocabulary", f: "Functions", p: "Pronunciation", h: "Skills" };
export const LESSONS = {};
CAT.levels.forEach((L) => L.blocks.forEach((B) => B.topics.forEach((title, i) => {
  const id = `${L.id}-${B.key}${String(i + 1).padStart(2, "0")}`;
  if (CAT.available.includes(id)) LESSONS[id] = { id, title, level: L.name, li: LEVELS.indexOf(L.name), block: B.key, blockName: BLOCK_NAMES[B.key] };
})));
const ORDER = Object.keys(LESSONS); // catalog order: level, then block, then topic number
const lvlOf = (id) => LEVELS.indexOf(id.slice(0, 2).toUpperCase());
const block = (li, key) => Object.values(LESSONS).filter((l) => l.li === li && l.block === key).map((l) => l.id);
const one = (li, key, n) => (LESSONS[`${LEVELS[li]?.toLowerCase()}-${key}${String(n).padStart(2, "0")}`] ? [`${LEVELS[li].toLowerCase()}-${key}${String(n).padStart(2, "0")}`] : []);

// ---------- Diagnostic skill → lesson(s) ----------
// Each skill tag of the question bank points to the lesson(s) that teach it,
// from the easiest to the most advanced; the one closest to the student's level is used.
const SKILL_LESSONS = {
  grammar: {
    "verb to be": ["a1-g03", "a2-g01"], "articles a / an": ["a1-g04"], "plurals": ["a1-g05"],
    "possessive 's": ["a1-g06"], "possessive adjectives": ["a1-g06"], "this / these": ["a1-g07"],
    "there is / there are": ["a1-g08"], "present simple": ["a1-g10", "a2-g08"], "present simple (negative)": ["a1-g10"],
    "present simple (questions)": ["a1-g10"], "question words": ["a1-g12"], "subject questions": ["a1-g12", "a2-g21"],
    "can / can't": ["a1-g13"], "imperatives": ["a1-g14"], "prepositions of place": ["a1-g15"],
    "prepositions of time": ["a1-g16"], "present continuous": ["a1-g17", "a2-g08"], "object pronouns": ["a1-g20"],
    "countable / uncountable": ["a1-g18", "a2-g11"], "some / any": ["a1-g18", "a2-g17"], "conjunctions": ["a1-g21", "a2-g23"],
    "adverbs of frequency": ["a1-g11"], "comparatives": ["a1-g22", "a2-g09"], "superlatives": ["a2-g09"], "as ... as": ["a2-g09"],
    "past simple": ["a1-g22", "a2-g02"], "past simple (negative)": ["a2-g02"], "past simple (questions)": ["a2-g02"],
    "past continuous": ["a2-g04"], "going to (predictions)": ["a2-g05"], "will (instant decisions)": ["a2-g05"],
    "future plans (going to)": ["a2-g05", "b1-g04"], "present perfect (ever)": ["a2-g07"], "present perfect (never)": ["a2-g07"],
    "present perfect (yet / already)": ["a2-g07", "b1-g01"], "much / many": ["a2-g11"], "quantifiers (little / few)": ["a2-g11"],
    "have to (obligation)": ["a2-g12"], "should (advice)": ["a2-g12"], "modals of obligation": ["a2-g12", "b1-g12"],
    "verb + -ing": ["a2-g14"], "verb + to-infinitive": ["a2-g14"], "possessive pronouns": ["a2-g16"],
    "first conditional": ["a2-g19"], "relative clauses": ["a2-g20", "b1-g14"], "used to": ["a2-g22", "b1-g13"],
    "prepositions of movement": ["a2-g24"], "too / enough": ["b1-g18"], "so / such": ["b1-g18"],
    "present perfect vs past simple": ["b1-g01"], "present perfect continuous": ["b1-g02"], "past perfect": ["b1-g03"],
    "future continuous": ["b1-g05"], "second conditional": ["b1-g06"], "third conditional": ["b1-g06", "b2-g04"],
    "unless": ["b1-g08"], "passive voice (present)": ["b1-g09"], "passive voice (past)": ["b1-g09"],
    "reported speech": ["b1-g10"], "modals of possibility": ["b1-g11"], "be used to / get used to": ["b1-g13"],
    "non-defining relative clauses": ["b1-g14"], "question tags": ["b1-g15"], "indirect questions": ["b1-g16"],
    "gerund vs infinitive": ["b1-g17"], "verb patterns": ["b1-g17", "c1-g12"], "causative (have / get something done)": ["b1-g19", "b2-g08"],
    "make / let": ["b2-g08"], "wish (present)": ["b1-g20", "b2-g05"], "wish (past)": ["b2-g05"], "contrast linkers": ["b1-g21", "b2-g14"],
    "articles": ["b1-g24", "c2-g09"], "future perfect": ["b2-g03"], "mixed conditionals": ["b2-g04"],
    "passive voice (present perfect)": ["b2-g06"], "passive with modals": ["b2-g06"], "passive reporting verbs": ["b2-g07"],
    "impersonal passive": ["b2-g07"], "complex passives": ["b2-g07"], "modals of deduction (past)": ["b2-g09"],
    "modal perfects": ["b2-g10"], "needn't have": ["b2-g10"], "reported questions": ["b2-g11"],
    "reduced relative clauses": ["b2-g12"], "participle clauses": ["b2-g13", "c1-g10"], "dangling modifiers": ["c1-g10"],
    "advanced linkers": ["b2-g14", "c1-g14"], "it's time": ["b2-g15"], "would rather": ["b2-g15"],
    "future in the past": ["b2-g16"], "cleft sentences": ["b2-g18", "c1-g03"], "subject–verb agreement": ["b2-g19"],
    "neither / either": ["b2-g19"], "inversion": ["b2-g17", "c1-g01", "c2-g02"], "hardly ... when": ["c1-g01"],
    "inverted conditionals": ["c1-g02"], "subjunctive": ["c1-g04"], "as if / as though": ["c1-g04"],
    "were to (hypothetical)": ["c1-g05"], "advanced conditionals": ["c1-g05"], "may well / might well": ["c1-g06"],
    "nominalization (formal style)": ["c1-g08"], "fronting and inversion": ["c1-g11", "c2-g02"], "the more ... the more": ["c1-g16"],
    "would (past habits)": ["b1-g13"], "inversion with so": ["c2-g02"], "fixed subjunctive expressions": ["c2-g03"],
    "lest": ["c2-g03"], "however / whatever": ["c2-g07"],
  },
  vocabulary: {
    "everyday expressions": ["a1-v01"], "family": ["a1-v03"], "jobs": ["a1-v04", "a2-v07"], "school objects": ["a1-v05"],
    "the house": ["a1-v05"], "colors": ["a1-v06"], "days of the week": ["a1-v07"], "months": ["a1-v07"],
    "food and tableware": ["a1-v08"], "food": ["a1-v08"], "daily routine": ["a1-v09"], "common verbs": ["a1-v09"],
    "clothes": ["a1-v10"], "the body": ["a1-v11"], "weather": ["a1-v12"], "places in town": ["a1-v13", "a2-v08"],
    "transport": ["a1-v14"], "animals": ["a1-v15"], "opposites": ["a1-v16", "a2-v14"], "numbers": ["a1-g01"],
    "feelings": ["a2-v11", "b1-v06"], "travel": ["a2-v01", "b1-v10"], "shopping": ["a2-v02"], "money": ["a2-v02", "b2-v01"],
    "health": ["a2-v03", "b1-v07", "b2-v07"], "sports": ["a2-v04"], "technology": ["a2-v05", "b1-v08", "b2-v03"],
    "education": ["a2-v06", "b1-v01", "b2-v08"], "work": ["b1-v02", "b2-v05"], "environment": ["a2-v10", "b1-v05", "b2-v01"],
    "phrasal verbs": ["a2-v12", "b1-v11", "b2-g21", "c1-v07"], "collocations (make / do)": ["a2-v13"], "collocations (take)": ["a2-v13"],
    "-ed / -ing adjectives": ["b1-g22"], "time expressions": ["a2-g03"], "synonyms": ["b2-v12", "c2-v07"],
    "media": ["b1-v03"], "personality": ["b1-v06"], "word formation": ["b1-v12", "b2-v09", "c2-v06"],
    "word formation (prefixes)": ["a2-v14", "b2-v09"], "collocations": ["b1-v13", "b2-v10", "c1-v08"],
    "dependent prepositions": ["b1-v13"], "commonly confused words": ["b1-v14", "c2-v07"],
    "collocations (adjective + noun)": ["b2-v10"], "collocations (adverb + adjective)": ["b2-g22"],
    "idioms": ["b2-v11", "c1-v06", "c2-v02"], "advanced collocations": ["c1-v08"], "connotation": ["c1-v09"],
    "formal register": ["b2-v12", "c1-v07"], "precise vocabulary": ["c1-v01", "c2-v01"], "academic register": ["c1-v01"],
    "nuanced vocabulary": ["c2-v07"],
  },
  listening: {
    "numbers": ["a1-h02"], "prices": ["a1-h02", "a1-f06"], "telling the time": ["a1-f05"], "days and dates": ["a1-v07"],
    "spelling": ["a1-p01"], "personal information": ["a1-f02"], "likes and dislikes": ["a1-f04"], "preferences": ["a1-f04"],
    "specific details": ["a1-h02", "a2-h02", "b1-h02", "b2-h02", "c1-h02", "c2-h02"], "directions": ["a2-f04"],
    "arrangements": ["a2-g06"], "future plans": ["a2-f02"], "messages": ["a2-h02"], "announcements": ["a2-h02", "b2-h02"],
    "requests": ["a2-g13"], "past events": ["a2-f01"], "sequence of events": ["a2-f01"], "opinions": ["b1-f02"],
    "making inferences": ["a2-h02", "b1-h02", "b2-h02"], "main idea": ["b1-h02", "b2-h02", "c1-h02"],
    "reasons": ["b1-f02"], "rules and instructions": ["a2-f07"], "speaker's feelings": ["b1-f07"],
    "speaker's opinion": ["b1-f02"], "speaker's purpose": ["b1-h02", "b2-f06"], "suggestions": ["b1-f06"],
    "lectures": ["b2-h02", "c1-h02"], "news": ["b2-h02"], "speaker's attitude": ["b2-p02"], "tone": ["b2-p02", "c1-p01"],
    "implied meaning": ["c1-f03", "c1-h02"], "change of opinion": ["c1-f03"], "irony": ["c2-f03"],
  },
  reading: {
    "finding details": ["a1-h01", "a2-h01", "b1-h01", "b2-h01", "c1-h01"], "understanding signs": ["a1-h01"],
    "main idea": ["a1-h01", "a2-h01", "b1-h01", "b2-h01", "c1-h01", "c2-h01"], "purpose of a text": ["a1-h01", "a2-h01"],
    "simple inference": ["a1-h01"], "pronoun reference": ["a1-g20", "a2-g16"], "making inferences": ["a2-h01", "b1-h01", "b2-h01"],
    "sequence of events": ["a2-g23"], "understanding rules": ["a2-f07", "b1-g12"], "vocabulary in context": ["b1-v12", "b2-v09", "c1-v01"],
    "writer's attitude": ["b2-h01", "c1-f03"], "writer's opinion": ["b1-f02", "b2-h01"], "writer's purpose": ["b2-h01"],
    "tone": ["b2-h01", "c1-v09"], "reference": ["c1-g09", "c2-g05"], "implied meaning": ["c1-h01", "c2-h01"],
    "text organization": ["c1-g14"],
  },
};

// Lessons that build each section, in order, for a given level.
const CORE = {
  grammar: (li) => block(li, "g"),
  vocabulary: (li) => block(li, "v"),
  listening: (li) => [...one(li, "h", 2), ...block(li, "p"), ...block(li, "f")],
  reading: (li) => [...one(li, "h", 1), ...block(li, "v")],
};
const WHY_CORE = { grammar: "grammar", vocabulary: "vocabulary", listening: "listening & speaking", reading: "reading & vocabulary" };

function pickLesson(candidates, li) {
  const ok = candidates.filter((id) => LESSONS[id]);
  if (!ok.length) return null;
  const below = ok.filter((id) => lvlOf(id) <= li);
  return below.length ? below[below.length - 1] : ok[0];
}

// ---------- Build the path ----------
export function buildPathway(r) {
  if (!r || !r.diagnosticSections) return null;
  const used = new Set();
  const take = (id, why) => (id && LESSONS[id] && !used.has(id) ? (used.add(id), { ...LESSONS[id], why }) : null);

  const overallLi = Math.max(0, LEVELS.indexOf(r.diagnosticLevel));
  const targetBand = Math.min(6, overallLi + 2); // band of the next level
  const secs = Object.entries(r.diagnosticSections).map(([key, v]) => ({
    key, name: key[0].toUpperCase() + key.slice(1), band: Number(v.band) || 1, li: Math.max(0, LEVELS.indexOf(v.level)),
  })).sort((a, b) => a.band - b.band);

  // weaker sections → more lessons (3 to 8)
  secs.forEach((s) => (s.n = clamp(Math.round(3 + 2 * (targetBand - s.band)), 3, 8)));

  // queue of lessons for a section: missed topics first, then core lessons from its level upwards
  const queue = (s) => {
    const q = [];
    (r.diagnosticPractice?.[s.key] || [])
      .map((skill) => [pickLesson(SKILL_LESSONS[s.key]?.[skill] || [], s.li), `You missed “${skill}” in the diagnostic`])
      .filter(([id]) => id)
      .sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0])) // easiest first
      .forEach((x) => q.push(x));
    for (let li = s.li; li <= Math.min(5, s.li + 1); li++) {
      CORE[s.key](li).forEach((id) => q.push([id, `${LEVELS[li]} ${WHY_CORE[s.key]} to reach your next level`]));
    }
    return q;
  };
  const queues = Object.fromEntries(secs.map((s) => [s.key, queue(s)]));
  const draw = (s, n) => {
    const out = [];
    const q = queues[s.key];
    while (out.length < n && q.length) { const [id, why] = q.shift(); const it = take(id, why); if (it) out.push({ ...it, section: s.name }); }
    return out;
  };

  const [w1, w2, w3, w4] = secs;
  const weeks = [];
  weeks.push({ title: `Week 1 · ${w1.name}`, focus: `Your top priority (${LEVELS[w1.li]})`, items: draw(w1, w1.n) });
  weeks.push({ title: `Week 2 · ${w2.name}`, focus: `Second priority (${LEVELS[w2.li]}) + one more ${w1.name.toLowerCase()} lesson`, items: [...draw(w2, w2.n), ...draw(w1, 1)] });
  const half = (s) => Math.max(2, Math.ceil(s.n * 0.6));
  if (w3 && w4) weeks.push({ title: `Week 3 · ${w3.name} + ${w4.name}`, focus: `Keep your stronger areas active (${LEVELS[w3.li]} · ${LEVELS[w4.li]})`, items: [...draw(w3, half(w3)), ...draw(w4, half(w4))] });
  // week 4: iTEP Writing & Speaking + a function and a pronunciation lesson at the student's level
  const L = overallLi, w4items = [];
  const add = (ids, why) => { for (const id of ids) { const it = take(id, why); if (it) { w4items.push({ ...it, section: "iTEP Writing & Speaking" }); return; } } };
  add(one(L, "h", 3), "iTEP Writing practice");
  add(one(L, "h", 4), "iTEP Speaking practice");
  add(block(L, "f"), `${LEVELS[L]} communicative functions`);
  add(block(L, "p"), `${LEVELS[L]} pronunciation`);
  weeks.push({ title: "Week 4 · Review + iTEP Writing & Speaking", focus: "Put everything together and practice what the diagnostic didn't test", items: w4items });

  const lessons = weeks.flatMap((w, wi) => w.items.map((it) => ({ ...it, week: wi })));
  return { weeks, lessons, total: lessons.length, target: L >= 5 ? "KEEP YOUR C2" : `REACH ${LEVELS[L + 1]}` };
}

// ---------- Path screen ----------
const STAR = (n) => `<span class="lp-stars" aria-label="${n} of 3 stars">${[0, 1, 2].map((i) => `<span class="${i < n ? "on" : ""}">★</span>`).join("")}</span>`;
const BLOCK_ICON = { g: "G", v: "V", f: "F", p: "P", h: "S" };

// A lesson is passed with at least 1 star (50%); passing it unlocks the next one.
export const passed = (progress, id) => (progress?.[id]?.stars || 0) >= 1;
export function pathStats(path, progress = {}) {
  const done = path.lessons.filter((l) => passed(progress, l.id)).length;
  const stars = path.lessons.reduce((a, l) => a + (progress[l.id]?.stars || 0), 0);
  const nextIdx = path.lessons.findIndex((l) => !passed(progress, l.id));
  return { done, stars, nextIdx, next: nextIdx >= 0 ? path.lessons[nextIdx] : null };
}

export function renderPathway(path, progress = {}, r = {}) {
  const st = pathStats(path, progress);
  const pct = Math.round((st.done / path.total) * 100);
  let idx = 0;
  const weeks = path.weeks.map((w, wi) => {
    const wDone = w.items.filter((l) => passed(progress, l.id)).length;
    const rows = w.items.map((l) => {
      const i = idx++;
      const done = passed(progress, l.id);
      const tried = !done && progress[l.id];
      const open = done || i === 0 || passed(progress, path.lessons[i - 1].id);
      const isNext = i === st.nextIdx;
      const state = done ? "done" : isNext ? "next" : open ? "open" : "locked";
      const mark = done ? "✓" : state === "locked" ? "🔒" : String(i + 1);
      const right = done ? STAR(progress[l.id].stars || 0)
        : tried ? `<span class="lp-go retry">TRY AGAIN · ${progress[l.id].pct}%</span>`
        : isNext ? `<span class="lp-go">START</span>` : state === "locked" ? `<span class="lp-lock">Locked</span>` : "";
      return `<li><button type="button" class="lp-item ${state}" ${state === "locked" ? "disabled" : `data-lesson="${l.id}"`}
          aria-label="Lesson ${i + 1}: ${esc(l.title)}${done ? " (completed)" : state === "locked" ? " (locked)" : ""}">
        <span class="lp-dot">${mark}</span>
        <span class="lp-txt"><span class="lp-title">${esc(l.title)}</span>
          <span class="lp-meta"><span class="lp-badge">${l.level}</span><span class="lp-blk b-${l.block}">${BLOCK_ICON[l.block]}</span>${esc(l.blockName)} · ${esc(l.why)}</span></span>
        ${right}</button></li>`;
    }).join("");
    const complete = wDone === w.items.length && w.items.length;
    return `<section class="lp-week${complete ? " complete" : ""}">
      <header><p class="p-num">${wi + 1}</p><div><h3>${esc(w.title)}</h3><p class="p-focus">${esc(w.focus)}</p></div>
        <span class="lp-wcount">${complete ? "WEEK COMPLETE ★" : `${wDone} / ${w.items.length}`}</span></header>
      <ol class="lp-list">${rows}</ol></section>`;
  }).join("");

  const nextBtn = st.next
    ? `<button type="button" class="btn-blue" data-lesson="${st.next.id}">${st.done ? "CONTINUE" : "START"} · LESSON ${st.nextIdx + 1}</button>`
    : `<p class="lp-finished">🏆 You finished your path! Take the diagnostic again with your teacher to see your new level.</p>`;

  return `<div class="lp">
    <div class="lp-head">
      <div><p class="t-kicker">YOUR LEARNING PATH · ${path.total} LESSONS · 4 WEEKS</p>
        <h2 class="t-title">STEP BY STEP TO ${esc(path.target)}</h2>
        <p class="x-note">Built from your diagnostic (${esc(r.diagnosticLevel || "")}${r.diagnosticScore != null ? ` · band ${Number(r.diagnosticScore).toFixed(1)}` : ""}): the topics you missed come first, and your weakest areas get more lessons. Score at least 50% (★) in a lesson to unlock the next one.</p></div>
      <div class="lp-score">
        <div class="lp-ring" style="--p:${pct}"><strong>${pct}%</strong><span>${st.done} / ${path.total}</span></div>
        <p class="lp-starsum">★ ${st.stars} <small>/ ${path.total * 3} stars</small></p>
      </div>
    </div>
    <div class="t-actions left lp-cta">${nextBtn}
      <button type="button" class="btn-blue ghost" data-x="plan">My study plan</button>
      <button type="button" class="btn-blue ghost" data-x="exit">Done</button></div>
    <div class="lp-weeks">${weeks}</div>
  </div>`;
}
