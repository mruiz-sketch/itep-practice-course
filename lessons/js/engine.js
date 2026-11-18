/* Motor de presentaciones interactivas. Cada tema vive en lessons/<id>.json */
(function () {
  'use strict';

  var CAT = window.CATALOG;
  var app = document.getElementById('app');

  /* ---------- Modo integrado (dentro de la ruta personalizada del iTEP Practice Course) ---------- */
  var QS = new URLSearchParams(location.search);
  var EMBED = QS.get('embed') === '1';
  var NEXT_ID = QS.get('next') || '';
  function tell(msg) { if (EMBED && window.parent !== window) window.parent.postMessage(Object.assign({ source: 'itep-lessons' }, msg), location.origin); }
  if (EMBED) document.documentElement.classList.add('embed');

  /* ---------- Textos de interfaz por idioma ---------- */
  var UI = {
    es: {
      blocks: { g: 'Gramática', v: 'Vocabulario', f: 'Funciones comunicativas', p: 'Pronunciación', h: 'Habilidades' },
      topic: 'Tema', index: 'Índice', prev: 'Anterior', next: 'Siguiente', pts: 'pts',
      kinds: { cover: 'Inicio', explain: 'Explicación', examples: 'Ejemplos', mc: 'Opción múltiple', listen: 'Escucha', tf: 'Verdadero o falso', fill: 'Completa', order: 'Ordena', match: 'Relaciona', sort: 'Clasifica', result: 'Resultado' },
      instr: {
        mc: 'Elige la respuesta correcta.', listen: 'Escucha y elige lo que oíste.', tf: 'Decide si cada afirmación es verdadera o falsa.',
        fill: 'Escribe la palabra que falta y pulsa Check (o Enter).', order: 'Toca las palabras en orden para formar la oración.',
        match: 'Toca un elemento de la izquierda y luego su pareja de la derecha.', sort: 'Toca una palabra y luego el grupo al que pertenece.',
        examples: 'Toca el altavoz para escuchar cada ejemplo.'
      },
      tTrue: 'Verdadero', tFalse: 'Falso', check: 'Comprobar', hint: 'Pista', show: 'Ver respuesta', reset: 'Reiniciar',
      good: ['¡Correcto!', '¡Muy bien!', '¡Exacto!', '¡Eso es!'], again: 'Casi. Inténtalo otra vez.', answer: 'Respuesta',
      listen: 'Escuchar', slow: 'Lento', goals: 'Al terminar podrás', tip: 'Tip', watch: 'Ojo',
      result: { title: 'Tema completado', first: 'Correctas al primer intento', again: 'Repetir tema', nextT: 'Siguiente tema', back: 'Volver al índice',
        msg: ['Repasa la explicación y vuelve a intentarlo.', 'Buen comienzo. Repite los ejercicios que fallaste.', '¡Bien hecho! Ya casi lo dominas.', '¡Excelente! Dominas este tema.'] },
      soon: 'Esta presentación aún no está disponible.', loading: 'Cargando…', loadErr: 'No se pudo cargar la presentación. Recarga la página.',
      noTTS: 'Tu navegador no tiene voz en inglés disponible.', streak: 'racha', available: 'disponibles', soonPill: 'Próximamente', best: 'Mejor resultado'
    },
    en: {
      blocks: { g: 'Grammar', v: 'Vocabulary', f: 'Functions', p: 'Pronunciation', h: 'Skills' },
      topic: 'Topic', index: 'Index', prev: 'Back', next: 'Next', pts: 'pts',
      kinds: { cover: 'Start', explain: 'Explanation', examples: 'Examples', mc: 'Multiple choice', listen: 'Listening', tf: 'True or false', fill: 'Gap fill', order: 'Word order', match: 'Matching', sort: 'Categorise', result: 'Result' },
      instr: {
        mc: 'Choose the correct answer.', listen: 'Listen and choose what you heard.', tf: 'Decide if each statement is true or false.',
        fill: 'Type the missing word and press Check (or Enter).', order: 'Tap the words in order to build the sentence.',
        match: 'Tap an item on the left, then its partner on the right.', sort: 'Tap a word, then the group it belongs to.',
        examples: 'Tap the speaker to hear each example.'
      },
      tTrue: 'True', tFalse: 'False', check: 'Check', hint: 'Hint', show: 'Show answer', reset: 'Reset',
      good: ['Correct!', 'Well done!', 'Exactly!', 'That\'s it!'], again: 'Not quite. Try again.', answer: 'Answer',
      listen: 'Listen', slow: 'Slow', goals: 'By the end you will be able to', tip: 'Tip', watch: 'Watch out',
      result: { title: 'Topic complete', first: 'Correct on first try', again: 'Repeat topic', nextT: 'Next topic', back: 'Back to index',
        msg: ['Review the explanation and try again.', 'Good start. Repeat the exercises you missed.', 'Well done! You have almost mastered it.', 'Excellent! You have mastered this topic.'] },
      soon: 'This presentation is not available yet.', loading: 'Loading…', loadErr: 'The presentation could not be loaded. Reload the page.',
      noTTS: 'No English voice is available in your browser.', streak: 'streak', available: 'available', soonPill: 'Coming soon', best: 'Best result',
      useAll: 'Use all the words.', tapFirst: 'Tap a word first.', exercises: 'exercises', slide: 'SLIDE', of: 'OF', topics: 'topics'
    }
  };

  /* ---------- Utilidades ---------- */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('curso-ingles:' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('curso-ingles:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(n, k); }); return; }
    n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* Marcado mínimo: **negrita**, *cursiva*, ==resaltado== */
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>');
  }
  function rich(tag, s, cls) { return el(tag, { class: cls, html: md(s) }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) {
    return String(s).toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim();
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Voz (Web Speech API) ---------- */
  var TTS = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    voice: null,
    pickVoice: function () {
      try {
        var vs = window.speechSynthesis.getVoices();
        this.voice = vs.filter(function (v) { return /^en[-_]US/i.test(v.lang) && /Google|Samantha|Aria|Jenny|Microsoft/i.test(v.name); })[0] ||
          vs.filter(function (v) { return /^en[-_]US/i.test(v.lang); })[0] ||
          vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
      } catch (e) { this.voice = null; }
    },
    say: function (text, slow) {
      if (!this.ok) return false;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        if (!this.voice) this.pickVoice();
        if (this.voice) u.voice = this.voice;
        u.rate = slow ? 0.6 : 0.9;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    }
  };
  if (TTS.ok) { try { window.speechSynthesis.onvoiceschanged = function () { TTS.pickVoice(); }; TTS.pickVoice(); } catch (e) { TTS.ok = false; } }

  var ICON_SPEAK = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function speakBtns(text, t, big) {
    var wrap = el('span', { class: 'speak' + (big ? ' big' : '') });
    function play(slow, btn) {
      var ok = TTS.say(text, slow);
      if (!ok) { btn.title = t.noTTS; btn.classList.add('mute'); return; }
      btn.classList.add('on'); setTimeout(function () { btn.classList.remove('on'); }, 600);
    }
    var b1 = el('button', { type: 'button', class: 'spk', 'aria-label': t.listen + ': ' + text, html: ICON_SPEAK + (big ? '<span>' + esc(t.listen) + '</span>' : '') });
    b1.addEventListener('click', function () { play(false, b1); });
    var b2 = el('button', { type: 'button', class: 'spk slow', 'aria-label': t.slow + ': ' + text, text: t.slow });
    b2.addEventListener('click', function () { play(true, b2); });
    add(wrap, [b1, b2]);
    return wrap;
  }

  /* ---------- Catálogo plano ---------- */
  var flat = [];
  CAT.levels.forEach(function (L) {
    L.blocks.forEach(function (B) {
      B.topics.forEach(function (title, i) {
        var id = L.id + '-' + B.key + (i + 1 < 10 ? '0' : '') + (i + 1);
        flat.push({ id: id, level: L, block: B, n: i + 1, title: title, available: CAT.available.indexOf(id) !== -1 });
      });
    });
  });
  var byId = {}; flat.forEach(function (t) { byId[t.id] = t; });

  /* ---------- Router ---------- */
  function route() {
    var h = (location.hash || '').slice(1);
    if (h && byId[h]) openLesson(h);
    else if (EMBED) tell({ type: 'close' });
    else renderHub(h && /^nivel-(a1|a2|b1|b2|c1|c2)$/.test(h) ? h.slice(6) : null);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Índice ---------- */
  var hubLevel = store.get('nivel') || 'a1';

  function stars(n, total) {
    var s = el('span', { class: 'stars', 'aria-label': n + ' / ' + (total || 3) });
    for (var i = 0; i < (total || 3); i++) add(s, el('span', { class: i < n ? 'star on' : 'star', 'aria-hidden': 'true', text: '★' }));
    return s;
  }

  function brandbar(center) {
    return el('header', { class: 'brandbar' },
      el('a', { class: 'b-itep', href: '#', 'aria-label': EMBED ? 'Back to my learning path' : 'Course index', onclick: EMBED ? function (e) { e.preventDefault(); tell({ type: 'close' }); } : null }, el('img', { src: '../assets/itep-blue.png', alt: 'iTEP' })),
      el('div', { class: 'b-center' }, center),
      el('img', { class: 'b-oblt', src: '../assets/oblt-orange.png', alt: 'OBLT' }));
  }

  function renderHub(levelFromHash) {
    if (levelFromHash) hubLevel = levelFromHash;
    if (TTS.ok) try { window.speechSynthesis.cancel(); } catch (e) { /* ok */ }
    D = null;
    document.title = 'English Practice Lessons · iTEP Practice Course';
    app.innerHTML = ''; app.scrollTop = 0;
    var L = CAT.levels.filter(function (l) { return l.id === hubLevel; })[0] || CAT.levels[0];
    var t = UI.en;
    var total = flat.length, avail = flat.filter(function (x) { return x.available; }).length;

    var tabs = el('div', { class: 'q-grid levels', role: 'tablist', 'aria-label': 'CEFR levels' });
    CAT.levels.forEach(function (lv) {
      var mine = flat.filter(function (x) { return x.level === lv; });
      var av = mine.filter(function (x) { return x.available; }).length;
      add(tabs, el('button', {
        type: 'button', role: 'tab', class: 'q-chip' + (lv === L ? ' on' : ''), 'aria-selected': lv === L ? 'true' : 'false', id: 'tab-' + lv.id,
        onclick: function () { hubLevel = lv.id; store.set('nivel', lv.id); renderHub(); var f = document.getElementById('tab-' + lv.id); if (f) f.focus(); }
      }, el('span', { class: 'qc-name', text: lv.name }), el('small', { text: lv.label }), el('small', { class: 'qc-count', text: av + ' / ' + mine.length })));
    });

    var panel = el('section', { class: 'card-grid blocks', role: 'tabpanel', 'aria-labelledby': 'tab-' + L.id });
    L.blocks.forEach(function (B) {
      var list = el('ol', { class: 'topics' });
      B.topics.forEach(function (title, i) {
        var tp = flat.filter(function (x) { return x.level === L && x.block === B && x.n === i + 1; })[0];
        var best = store.get('best:' + tp.id);
        var num = el('span', { class: 'tnum', text: String(i + 1).padStart(2, '0') });
        var name = el('span', { class: 'tname', text: title });
        var right = tp.available ? (best ? stars(best.stars) : el('span', { class: 'pill go', text: 'Start' })) : el('span', { class: 'pill', text: t.soonPill });
        var row = tp.available ? el('a', { class: 'topic', href: '#' + tp.id }, num, name, right) : el('div', { class: 'topic soon', 'aria-disabled': 'true' }, num, name, right);
        add(list, el('li', null, row));
      });
      add(panel, el('div', { class: 'block' }, el('h2', { class: 'c-title' }, t.blocks[B.key], el('span', { class: 'bcount', text: B.topics.length + ' ' + t.topics })), list));
    });

    add(app, [brandbar(null), el('div', { class: 'page hub' },
      el('div', { class: 'hub-head' },
        el('p', { class: 't-kicker', text: 'CEFR A1–C2 · ' + total + ' TOPICS · ' + avail + ' AVAILABLE' }),
        el('h1', { class: 't-title', text: 'ENGLISH PRACTICE LESSONS' }),
        el('p', { class: 't-hint', text: 'One interactive presentation per topic, with examples you can listen to and exercises that check themselves. Explanations are in Spanish at A1–A2 and in English from B1.' })
      ),
      tabs, panel,
      el('p', { class: 'hub-foot', html: 'Syllabus based on the CEFR Companion Volume (Council of Europe, 2020) and the <em>Core Inventory for General English</em> (British Council / EAQUALS).' })
    )]);
  }

  /* ---------- Presentación ---------- */
  var D = null;

  function exerciseKind(type) { return ['mc', 'listen', 'tf', 'fill', 'order', 'match', 'sort'].indexOf(type) !== -1; }
  function itemCount(s) { return s.type === 'match' ? s.pairs.length : (s.items ? s.items.length : 0); }

  function openLesson(id) {
    var meta = byId[id];
    var t = UI.en;
    document.title = meta.title + ' · ' + meta.level.name;
    app.innerHTML = '';
    if (!meta.available) {
      add(app, el('div', { class: 'msg' }, el('p', { text: t.soon }), el('a', { class: 'btn-blue', href: '#nivel-' + meta.level.id, text: t.result.back })));
      return;
    }
    add(app, el('div', { class: 'msg' }, el('p', { text: t.loading })));
    fetch('data/' + id + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (lesson) { startDeck(meta, lesson); })
      .catch(function () {
        app.innerHTML = '';
        add(app, el('div', { class: 'msg' }, el('p', { text: t.loadErr }), el('a', { class: 'btn-blue', href: '#nivel-' + meta.level.id, text: t.result.back })));
      });
  }

  function startDeck(meta, lesson) {
    var slides = lesson.slides.concat([{ type: 'result' }]);
    var max = 0;
    slides.forEach(function (s) { if (exerciseKind(s.type)) max += itemCount(s) * 10; });
    var tt = Object.assign({}, UI.en, { instr: UI[meta.level.lang].instr });
    D = { meta: meta, lesson: lesson, slides: slides, i: 0, score: 0, max: max, items: 0, firstOk: 0, results: {}, streak: 0, seen: {}, t: tt };
    slides.forEach(function (s) { if (exerciseKind(s.type)) D.items += itemCount(s); });
    renderDeck();
  }

  /* Registra un intento. Solo el primer intento de cada ítem cuenta para los puntos. */
  function attempt(key, ok, pts) {
    if (!(key in D.results)) {
      D.results[key] = ok;
      if (ok) { var p = pts == null ? 10 : pts; D.score += p; D.firstOk += p === 10 ? 1 : 0; D.streak++; bump('+' + p); }
      else { D.streak = 0; }
      updatePoints();
    }
  }

  function updatePoints() {
    var p = document.getElementById('pts'); if (p) p.textContent = D.score;
    var s = document.getElementById('streak');
    if (s) { s.textContent = D.streak >= 3 ? D.streak + ' ' + D.t.streak : ''; s.hidden = D.streak < 3; }
  }
  function bump(txt) {
    var host = document.getElementById('ptsbox'); if (!host) return;
    if (reduceMotion) return;
    var b = el('span', { class: 'bump', text: txt, 'aria-hidden': 'true' });
    host.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  }

  function renderDeck() {
    var m = D.meta, t = D.t;
    app.innerHTML = '';
    var prog = el('div', { class: 'x-progress' }, el('div', { class: 'x-bar' }, el('span', { id: 'xBar' })), el('span', { id: 'xStep' }));
    add(app, [brandbar(prog), el('div', { class: 'page deck' },
      el('div', { class: 'deckbar' },
        EMBED ? el('button', { type: 'button', class: 'btn-back', text: '← My path', onclick: function () { tell({ type: 'close' }); } })
          : el('a', { class: 'btn-back', href: '#nivel-' + m.level.id, text: '← ' + t.index }),
        el('p', { class: 'crumb' }, el('span', { class: 'badge', text: m.level.name }), t.blocks[m.block.key] + ' · ' + t.topic + ' ' + m.n),
        el('p', { class: 'ptsbox', id: 'ptsbox' },
          el('span', { class: 'streak', id: 'streak', hidden: true }),
          el('strong', { id: 'pts', text: '0' }), el('span', { text: ' / ' + D.max + ' ' + t.pts }))
      ),
      el('main', { class: 'stage', id: 'stage' }),
      el('footer', { class: 'deck-nav' },
        el('button', { type: 'button', class: 'btn-blue ghost', id: 'prev', onclick: function () { go(D.i - 1); } }, t.prev),
        el('button', { type: 'button', class: 'btn-blue', id: 'next', onclick: function () { go(D.i + 1); } }, t.next)
      )
    )]);
    go(0);
  }

  function go(i) {
    if (!D || i < 0 || i >= D.slides.length) return;
    if (TTS.ok) try { window.speechSynthesis.cancel(); } catch (e) { /* ok */ }
    D.i = i; D.seen[i] = true;
    var stage = document.getElementById('stage');
    stage.innerHTML = '';
    add(stage, renderSlide(D.slides[i], i));
    var t = D.t;
    document.getElementById('xBar').style.width = Math.round((i + 1) / D.slides.length * 100) + '%';
    document.getElementById('xStep').textContent = t.slide + ' ' + (i + 1) + ' ' + t.of + ' ' + D.slides.length + ' · ' + (t.kinds[D.slides[i].type] || '').toUpperCase();
    document.getElementById('prev').disabled = i === 0;
    document.getElementById('next').hidden = i === D.slides.length - 1;
    var h = stage.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    app.scrollTop = 0;
  }

  document.addEventListener('keydown', function (e) {
    if (EMBED && e.key === 'Escape') { tell({ type: 'close' }); return; }
    if (!D || !document.getElementById('stage')) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { go(D.i + 1); }
    else if (e.key === 'ArrowLeft') { go(D.i - 1); }
  });

  function slideHead(s) {
    var t = D.t;
    var kind = t.kinds[s.type] || '';
    var instr = s.instr || t.instr[s.type];
    return el('div', { class: 'shead' },
      el('p', { class: 'kicker' + (exerciseKind(s.type) ? ' ex' : ''), text: kind + (exerciseKind(s.type) ? ' · ' + itemCount(s) * 10 + ' ' + t.pts : '') }),
      s.title ? rich('h2', s.title) : null,
      instr && s.type !== 'cover' && s.type !== 'explain' ? el('p', { class: 'instr', text: instr }) : null
    );
  }

  function feedback() { return el('p', { class: 'fb', 'aria-live': 'polite' }); }
  function setFb(fb, ok, why, extra) {
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    fb.innerHTML = '';
    add(fb, el('strong', { text: ok ? pick(D.t.good) : D.t.again }));
    if (extra) add(fb, el('span', { class: 'extra', html: ' ' + md(extra) }));
    if (why && ok) add(fb, el('span', { class: 'why', html: ' ' + md(why) }));
  }

  function renderSlide(s, i) {
    var R = {
      cover: slideCover, explain: slideExplain, examples: slideExamples,
      mc: slideChoice, listen: slideChoice, tf: slideChoice,
      fill: slideFill, order: slideOrder, match: slideMatch, sort: slideSort, result: slideResult
    }[s.type];
    var wrap = el('section', { class: 'slide t-' + s.type });
    add(wrap, R(s, i));
    return wrap;
  }

  /* ---- Portada ---- */
  function slideCover(s) {
    var m = D.meta, t = D.t;
    return [
      el('p', { class: 'kicker', text: m.level.name + ' · ' + t.blocks[m.block.key] + ' · ' + t.topic + ' ' + m.n }),
      rich('h2', s.title || m.title, 'cover-title'),
      s.subtitle ? rich('p', s.subtitle, 'lede') : null,
      s.goals ? el('div', { class: 'goals' }, el('p', { class: 'glabel', text: t.goals }),
        el('ul', null, s.goals.map(function (g) { return rich('li', g); }))) : null,
      el('div', { class: 'cover-meta' },
        el('span', { text: D.items + ' ' + t.exercises }),
        el('span', { text: D.max + ' ' + t.pts }))
    ];
  }

  /* ---- Explicación ---- */
  function table(tb) {
    var thead = el('thead', null, el('tr', null, tb.head.map(function (h) { return el('th', { scope: 'col', html: md(h) }); })));
    var tbody = el('tbody', null, tb.rows.map(function (r) {
      return el('tr', null, r.map(function (c, ci) {
        var td = el('td', { html: md(c) });
        if (tb.speak === ci) { var plain = c.replace(/[*=]/g, ''); add(td, speakBtns(tb.say ? tb.say[tb.rows.indexOf(r)] || plain : plain, D.t)); }
        return td;
      }));
    }));
    return el('div', { class: 'tablewrap' }, el('table', null, thead, tbody));
  }
  function slideExplain(s) {
    var t = D.t;
    return [
      slideHead(s),
      (s.body || []).map(function (p) { return rich('p', p, 'body'); }),
      s.table ? table(s.table) : null,
      s.list ? el('ul', { class: 'blist' }, s.list.map(function (x) { return rich('li', x); })) : null,
      s.errors ? el('div', { class: 'errors' }, s.errors.map(function (e) {
        return el('div', { class: 'err' },
          el('p', { class: 'bad' }, el('span', { class: 'mark', 'aria-label': 'Incorrecto', text: '✗' }), rich('span', e.bad)),
          el('p', { class: 'good' }, el('span', { class: 'mark', 'aria-label': 'Correcto', text: '✓' }), rich('span', e.good)),
          e.note ? rich('p', e.note, 'enote') : null);
      })) : null,
      s.tip ? el('aside', { class: 'tip' }, el('strong', { text: (s.tipLabel || t.tip) + ' ' }), el('span', { html: md(s.tip) })) : null,
      s.watch ? el('aside', { class: 'tip watch' }, el('strong', { text: t.watch + ' ' }), el('span', { html: md(s.watch) })) : null
    ];
  }

  /* ---- Ejemplos ---- */
  function slideExamples(s) {
    return [slideHead(s), el('div', { class: 'exgrid' }, s.items.map(function (x) {
      return el('div', { class: 'excard' },
        el('div', { class: 'exline' }, rich('p', x.en, 'en'), speakBtns(x.say || x.en.replace(/[*=]/g, ''), D.t)),
        x.es ? rich('p', x.es, 'es') : null,
        x.note ? rich('p', x.note, 'note') : null);
    }))];
  }

  /* ---- Opción múltiple / Escucha / Verdadero-falso ---- */
  function slideChoice(s, si) {
    var t = D.t;
    var list = el('div', { class: 'items' });
    s.items.forEach(function (it, j) {
      var key = si + ':' + j;
      var opts, ans;
      if (s.type === 'tf') { opts = [t.tTrue, t.tFalse]; ans = it.a ? 0 : 1; }
      else { opts = it.options; ans = it.a; }
      var order = s.type === 'tf' || s.keepOrder ? opts.map(function (_, k) { return k; }) : shuffle(opts.map(function (_, k) { return k; }));
      var fb = feedback();
      var row = el('div', { class: 'opts' + (s.type === 'tf' ? ' tf' : '') });
      var solved = false;
      order.forEach(function (k) {
        var b = el('button', { type: 'button', class: 'opt' }, el('span', { class: 'x-letter', 'aria-hidden': 'true', text: s.type === 'tf' ? (k === 0 ? 'T' : 'F') : 'ABCDEF'.charAt(row.children.length) }), el('span', { class: 'otxt', html: md(opts[k]) }));
        b.addEventListener('click', function () {
          if (solved) return;
          if (k === ans) {
            solved = true; attempt(key, true);
            b.classList.add('right');
            row.querySelectorAll('.opt').forEach(function (o) { o.disabled = true; });
            setFb(fb, true, it.why);
            card.classList.add('done');
          } else {
            attempt(key, false);
            b.classList.add('wrong'); b.disabled = true;
            setFb(fb, false, null, it.clue);
          }
        });
        add(row, b);
      });
      var q;
      if (s.type === 'listen') q = el('div', { class: 'q listen-q' }, el('span', { class: 'qn', text: (j + 1) + '.' }), speakBtns(it.say, t, true));
      else q = el('div', { class: 'q' }, el('span', { class: 'qn', text: (j + 1) + '.' }), rich('p', s.type === 'tf' ? it.s : it.q), it.say ? speakBtns(it.say, t) : null);
      var card = el('div', { class: 'item' }, q, row, fb);
      add(list, card);
    });
    return [slideHead(s), list];
  }

  /* ---- Completar ---- */
  function slideFill(s, si) {
    var t = D.t;
    var list = el('div', { class: 'items' });
    s.items.forEach(function (it, j) {
      var key = si + ':' + j;
      var answers = Array.isArray(it.a) ? it.a : [it.a];
      var parts = it.t.split('___');
      var w = Math.max.apply(null, answers.map(function (a) { return a.length; }));
      var inp = el('input', { type: 'text', id: 'f-' + si + '-' + j, class: 'gap', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', style: 'width:calc(' + Math.max(4, w + 1) + 'ch + 40px)', 'aria-label': (j + 1) + '. ' + it.t.replace('___', '…') });
      var fb = feedback();
      var tries = 0, hinted = false, solved = false;
      var showBtn = el('button', { type: 'button', class: 'btn-blue small ghost', hidden: true, text: t.show });
      function check() {
        if (solved) return;
        var v = norm(inp.value);
        if (!v) { inp.focus(); return; }
        var ok = answers.some(function (a) { return norm(a) === v; });
        if (ok) {
          solved = true; attempt(key, true, hinted ? 5 : 10);
          inp.classList.remove('wrong'); inp.classList.add('right'); inp.readOnly = true;
          checkBtn.disabled = true; hintBtn.disabled = true; showBtn.hidden = true;
          setFb(fb, true, it.why); card.classList.add('done');
        } else {
          tries++; attempt(key, false);
          inp.classList.remove('wrong'); void inp.offsetWidth; inp.classList.add('wrong');
          setFb(fb, false, null, it.clue);
          if (tries >= 2) showBtn.hidden = false;
        }
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      var checkBtn = el('button', { type: 'button', class: 'btn-blue small', text: t.check, onclick: check });
      var hintBtn = el('button', { type: 'button', class: 'btn-blue small ghost', text: t.hint, onclick: function () {
        if (solved) return; hinted = true;
        var h = it.hint || (answers[0].charAt(0) + '…');
        fb.className = 'fb hint'; fb.innerHTML = ''; add(fb, el('strong', { text: t.hint + ': ' }), el('span', { html: md(h) }));
        inp.focus();
      } });
      showBtn.addEventListener('click', function () {
        solved = true; inp.value = answers[0]; inp.readOnly = true; inp.classList.remove('wrong'); inp.classList.add('shown');
        checkBtn.disabled = true; hintBtn.disabled = true; showBtn.hidden = true;
        fb.className = 'fb shown'; fb.innerHTML = ''; add(fb, el('strong', { text: t.answer + ': ' }), el('span', { html: md(answers.join(' / ') + (it.why ? '. ' + it.why : '')) }));
      });
      var line = el('p', { class: 'fillline' }, el('span', { class: 'qn', text: (j + 1) + '.' }), el('span', { html: md(parts[0]) }), inp, el('span', { html: md(parts[1] || '') }));
      var card = el('div', { class: 'item' }, line, it.es ? rich('p', it.es, 'es') : null, el('div', { class: 'actions' }, checkBtn, hintBtn, showBtn), fb);
      add(list, card);
    });
    return [slideHead(s), list];
  }

  /* ---- Ordenar palabras ---- */
  function slideOrder(s, si) {
    var t = D.t;
    var list = el('div', { class: 'items' });
    s.items.forEach(function (it, j) {
      var key = si + ':' + j;
      var words = it.a.split(' ');
      var mixed = shuffle(words.map(function (w, k) { return { w: w, k: k }; }));
      var tries = 0;
      while (words.length > 1 && mixed.map(function (x) { return x.w; }).join(' ') === it.a && tries++ < 10) mixed = shuffle(mixed);
      var built = el('div', { class: 'built', 'aria-label': 'Tu oración' });
      var bank = el('div', { class: 'bank' });
      var fb = feedback(); var solved = false;
      function chip(x) {
        var c = el('button', { type: 'button', class: 'chip', text: x.w });
        c.addEventListener('click', function () {
          if (solved) return;
          if (c.parentNode === bank) built.appendChild(c); else bank.appendChild(c);
          fb.className = 'fb'; fb.textContent = '';
        });
        return c;
      }
      mixed.forEach(function (x) { bank.appendChild(chip(x)); });
      var checkBtn = el('button', { type: 'button', class: 'btn-blue small', text: t.check, onclick: function () {
        if (solved) return;
        var got = Array.prototype.map.call(built.children, function (c) { return c.textContent; }).join(' ');
        if (bank.children.length) { fb.className = 'fb hint'; fb.textContent = t.useAll; return; }
        if (norm(got) === norm(it.a) && got.slice(-1) === it.a.slice(-1)) {
          solved = true; attempt(key, true); built.classList.add('right'); checkBtn.disabled = true; resetBtn.disabled = true;
          setFb(fb, true, it.why); card.classList.add('done');
          add(fb, speakBtns(it.a, t));
        } else { attempt(key, false); built.classList.remove('wrong'); void built.offsetWidth; built.classList.add('wrong'); setFb(fb, false, null, it.clue); }
      } });
      var resetBtn = el('button', { type: 'button', class: 'btn-blue small ghost', text: t.reset, onclick: function () {
        if (solved) return; Array.prototype.slice.call(built.children).forEach(function (c) { bank.appendChild(c); }); built.classList.remove('wrong');
      } });
      var card = el('div', { class: 'item' },
        el('div', { class: 'q' }, el('span', { class: 'qn', text: (j + 1) + '.' }), it.es ? rich('p', it.es, 'es') : null),
        built, bank, el('div', { class: 'actions' }, checkBtn, resetBtn), fb);
      add(list, card);
    });
    return [slideHead(s), list];
  }

  /* ---- Relacionar ---- */
  function slideMatch(s, si) {
    var left = el('div', { class: 'mcol' }), right = el('div', { class: 'mcol' });
    var sel = null; var fb = feedback(); var done = 0;
    var L = s.pairs.map(function (p, k) { return { k: k, txt: p[0], side: 'l' }; });
    var Rr = shuffle(s.pairs.map(function (p, k) { return { k: k, txt: p[1], side: 'r' }; }));
    function mk(x) {
      var b = el('button', { type: 'button', class: 'mitem', 'aria-pressed': 'false', html: md(x.txt) });
      x.btn = b;
      b.addEventListener('click', function () {
        if (b.classList.contains('right')) return;
        if (s.speak && x.side === (s.speak === 'right' ? 'r' : 'l')) TTS.say(x.txt.replace(/[*=]/g, ''));
        if (!sel || sel.side === x.side) {
          if (sel) { sel.btn.classList.remove('sel'); sel.btn.setAttribute('aria-pressed', 'false'); }
          if (sel === x) { sel = null; return; }
          sel = x; b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); return;
        }
        var a = sel, c = x; sel = null;
        a.btn.classList.remove('sel'); a.btn.setAttribute('aria-pressed', 'false');
        var lk = a.side === 'l' ? a.k : c.k;
        if (a.k === c.k) {
          attempt(si + ':' + lk, true);
          a.btn.classList.add('right'); c.btn.classList.add('right'); a.btn.disabled = true; c.btn.disabled = true;
          done++;
          if (done === s.pairs.length) setFb(fb, true, s.why);
          else { fb.className = 'fb ok'; fb.textContent = pick(D.t.good); }
        } else {
          attempt(si + ':' + lk, false);
          [a.btn, c.btn].forEach(function (n) { n.classList.remove('wrong'); void n.offsetWidth; n.classList.add('wrong'); setTimeout(function () { n.classList.remove('wrong'); }, 700); });
          setFb(fb, false);
        }
      });
      return b;
    }
    L.forEach(function (x) { left.appendChild(mk(x)); });
    Rr.forEach(function (x) { right.appendChild(mk(x)); });
    return [slideHead(s), el('div', { class: 'match' }, left, right), fb];
  }

  /* ---- Clasificar ---- */
  function slideSort(s, si) {
    var pool = el('div', { class: 'bank pool' });
    var sel = null; var fb = feedback(); var left = s.items.length;
    var bins = s.buckets.map(function (name, bi) {
      var drop = el('div', { class: 'binlist' });
      var head = el('button', { type: 'button', class: 'binhead', html: md(name) });
      head.addEventListener('click', function () {
        if (!sel) { fb.className = 'fb hint'; fb.textContent = D.t.tapFirst; return; }
        var x = sel; sel = null; x.btn.classList.remove('sel'); x.btn.setAttribute('aria-pressed', 'false');
        if (x.b === bi) {
          attempt(si + ':' + x.j, true); x.btn.classList.add('right'); x.btn.disabled = true; drop.appendChild(x.btn); left--;
          if (!left) setFb(fb, true, s.why); else { fb.className = 'fb ok'; fb.textContent = pick(D.t.good); }
        } else {
          attempt(si + ':' + x.j, false);
          x.btn.classList.remove('wrong'); void x.btn.offsetWidth; x.btn.classList.add('wrong');
          setFb(fb, false, null, x.clue);
        }
      });
      return el('div', { class: 'bin' }, head, drop);
    });
    shuffle(s.items.map(function (it, j) { return { w: it.w, b: it.b, j: j, clue: it.clue }; })).forEach(function (x) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', html: md(x.w) });
      x.btn = b;
      b.addEventListener('click', function () {
        if (sel) { sel.btn.classList.remove('sel'); sel.btn.setAttribute('aria-pressed', 'false'); }
        if (sel === x) { sel = null; return; }
        sel = x; b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); b.classList.remove('wrong');
      });
      pool.appendChild(b);
    });
    return [slideHead(s), pool, el('div', { class: 'bins', style: 'grid-template-columns:repeat(' + Math.min(s.buckets.length, 4) + ',minmax(0,1fr))' }, bins), fb];
  }

  /* ---- Resultado ---- */
  function slideResult() {
    var t = D.t, m = D.meta;
    var pct = D.max ? Math.round(D.score / D.max * 100) : 0;
    var st = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
    var best = store.get('best:' + m.id);
    if (!best || pct > best.pct) store.set('best:' + m.id, { pct: pct, stars: st });
    var idx = flat.indexOf(m);
    var next = null;
    if (EMBED) next = byId[NEXT_ID] && byId[NEXT_ID].available ? byId[NEXT_ID] : null;
    else for (var k = idx + 1; k < flat.length; k++) { if (flat[k].available) { next = flat[k]; break; } }
    tell({ type: 'done', id: m.id, pct: pct, stars: st, score: D.score, max: D.max, firstOk: D.firstOk, items: D.items });
    return [
      el('p', { class: 'kicker', text: t.kinds.result }),
      el('h2', { text: t.result.title }),
      el('div', { class: 'score' },
        el('div', { class: 'bigpct' }, el('strong', { text: pct + '%' }), el('span', { text: D.score + ' / ' + D.max + ' ' + t.pts })),
        stars(st)
      ),
      el('p', { class: 'lede', text: t.result.msg[st] }),
      el('p', { class: 'body', text: t.result.first + ': ' + D.firstOk + ' / ' + D.items }),
      EMBED && st < 1 ? el('p', { class: 'body', html: '<strong>Score 50% or more (1 ★) to unlock your next lesson.</strong> Repeat the topic — only your best result counts.' }) : null,
      el('div', { class: 'actions wide' },
        el('button', { type: 'button', class: 'btn-blue ghost', text: t.result.again, onclick: function () { startDeck(D.meta, D.lesson); } }),
        EMBED ? (next && st >= 1 ? el('button', { type: 'button', class: 'btn-blue', text: 'Next lesson: ' + next.title, onclick: function () { tell({ type: 'next', id: next.id }); } }) : null)
          : (next ? el('a', { class: 'btn-blue', href: '#' + next.id, text: t.result.nextT + ': ' + next.title }) : null),
        EMBED ? el('button', { type: 'button', class: 'btn-blue ghost', text: 'Back to my path', onclick: function () { tell({ type: 'close' }); } })
          : el('a', { class: 'btn-blue ghost', href: '#nivel-' + m.level.id, text: t.result.back })
      )
    ];
  }

  route();
})();
