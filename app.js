(() => {
  "use strict";

  const MODULES = {
    1: "Networking Today", 2: "Basic Switch & End Device Config", 3: "Protocols and Models",
    4: "Physical Layer", 5: "Number Systems", 6: "Data Link Layer", 7: "Ethernet Switching",
    8: "Network Layer", 9: "Address Resolution", 10: "Basic Router Configuration",
    11: "IPv4 Addressing", 12: "IPv6 Addressing", 13: "ICMP", 14: "Transport Layer",
    15: "Application Layer", 16: "Network Security Fundamentals", 17: "Build a Small Network"
  };
  const PASS = 70;
  const LETTERS = ["A", "B", "C", "D"];
  const EXAM = { size: 60, minutes: 60 };
  const REPO = "https://github.com/YassinKamal345/ccna1-quiz";

  // ---------- storage (safe) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const K = { wrong: "ccna1.wrong", hist: "ccna1.history", mods: "ccna1.modules", practice: "ccna1.practice", size: "ccna1.size" };

  // ---------- data ----------
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "q" + (h >>> 0).toString(36); };
  const BANK = (window.QUESTIONS || []).map(q => ({ ...q, id: hash(q.q) }));
  const byId = new Map(BANK.map(q => [q.id, q]));

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const $ = id => document.getElementById(id);
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "style") n.style.cssText = v;
      else n.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null) n.append(c);
    return n;
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const modLabel = q => q.gen ? "Subnetting · pregunta generada" : `Módulo ${q.m} · ${MODULES[q.m]}`;

  function issueUrl(q) {
    const body = `**Pregunta (módulo ${q.m}):**\n${q.q}\n\n**Opciones:**\n${q.o.map((o, i) => `- ${o}${i === 0 ? "  ← marcada como correcta" : ""}`).join("\n")}\n\n**¿Qué está mal?**\n`;
    return `${REPO}/issues/new?title=${encodeURIComponent("Error en pregunta: " + q.q.slice(0, 60))}&body=${encodeURIComponent(body)}`;
  }
  const reportLink = q => q.gen ? null : el("a", { class: "report", href: issueUrl(q), target: "_blank", rel: "noopener", text: "⚑ Reportar error" });

  // ---------- state ----------
  let selected = new Set(store.get(K.mods, Object.keys(MODULES).map(Number)));
  let state = null;   // {items, answers, flags:Set, idx, practice, label, startedAt, endsAt}
  let lastResult = null;
  let timer = null;

  function show(view) {
    for (const v of ["home", "quiz", "results"]) $(v).hidden = v !== view;
    window.scrollTo({ top: 0 });
  }

  // ---------- home ----------
  function renderHome() {
    const counts = {};
    BANK.forEach(q => counts[q.m] = (counts[q.m] || 0) + 1);
    $("moduleChips").replaceChildren(...Object.entries(MODULES).map(([n, name]) => {
      n = Number(n);
      return el("button", {
        class: "chip" + (selected.has(n) ? " on" : ""), title: name,
        onclick: () => { selected.has(n) ? selected.delete(n) : selected.add(n); saveMods(); renderHome(); }
      }, el("b", { text: n }), name, el("small", { text: `(${counts[n] || 0})` }));
    }));

    const pool = BANK.filter(q => selected.has(q.m)).length;
    const wrong = store.get(K.wrong, []).filter(id => byId.has(id));
    const hist = store.get(K.hist, []);
    const best = hist.length ? Math.max(...hist.map(h => h.pct)) : null;
    const avg = hist.length ? Math.round(hist.reduce((a, h) => a + h.pct, 0) / hist.length) : null;

    $("stats").replaceChildren(
      stat(BANK.length, "preguntas en el banco"),
      stat(pool, "en los módulos elegidos"),
      stat(best == null ? "—" : best + "%", "mejor nota"),
      stat(avg == null ? "—" : avg + "%", `media (${hist.length} tandas)`)
    );

    $("startBtn").disabled = pool === 0;
    $("wrongBtn").textContent = `Repasar falladas (${wrong.length})`;
    $("wrongBtn").disabled = wrong.length === 0;
    $("practiceMode").checked = store.get(K.practice, false);
    $("quizSize").value = String(store.get(K.size, 20));

    $("historyCard").hidden = hist.length === 0;
    $("history").replaceChildren(...hist.slice(-10).reverse().map(h =>
      el("div", { class: "hist" },
        el("span", { text: new Date(h.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) + (h.label ? " · " + h.label : "") }),
        el("b", { text: `${h.correct}/${h.total} · ${h.pct}%`, style: `color:var(${h.pct >= PASS ? "--ok" : "--bad"})` }))));
  }
  const stat = (v, l) => el("div", { class: "stat" }, el("div", { class: "v", text: v }), el("div", { class: "l", text: l }));
  const saveMods = () => store.set(K.mods, [...selected]);

  // pick `size` questions spreading them evenly across modules
  function pickBalanced(pool, size) {
    const byMod = {};
    shuffle(pool).forEach(q => (byMod[q.m] = byMod[q.m] || []).push(q));
    const mods = shuffle(Object.keys(byMod));
    const picked = [];
    const target = Math.min(size, pool.length);
    while (picked.length < target) {
      for (const m of mods) if (byMod[m].length && picked.length < target) picked.push(byMod[m].pop());
    }
    return shuffle(picked);
  }

  // ---------- quiz ----------
  function startQuiz(questions, label, opts = {}) {
    stopTimer();
    const practice = opts.exam ? false : $("practiceMode").checked;
    state = {
      label, practice, exam: !!opts.exam, idx: 0, warned: false, quitArmed: false,
      startedAt: Date.now(), endsAt: opts.minutes ? Date.now() + opts.minutes * 60000 : null,
      items: questions.map(q => ({ q, opts: shuffle(q.o.map((text, i) => ({ text, correct: i === 0 }))) })),
      answers: new Array(questions.length).fill(null),
      flags: new Set()
    };
    $("modeTag").textContent = state.exam ? "Simulacro" : practice ? "Modo práctica" : "Modo examen";
    $("timer").hidden = !state.endsAt;
    if (state.endsAt) { tick(); timer = setInterval(tick, 1000); }
    resetQuit();
    show("quiz");
    renderQuestion();
  }

  function tick() {
    if (!state || !state.endsAt) return;
    const left = Math.max(0, (state.endsAt - Date.now()) / 1000);
    const t = $("timer");
    t.textContent = "⏱ " + mmss(left);
    t.classList.toggle("low", left <= 300);
    if (left <= 0) { stopTimer(); finish(true); }
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function renderQuestion() {
    const { items, idx, answers, practice } = state;
    const it = items[idx];
    const ans = answers[idx];
    const locked = practice && ans !== null;

    $("qCounter").textContent = `Pregunta ${idx + 1} de ${items.length}`;
    $("progressBar").style.width = `${(answers.filter(a => a !== null).length / items.length) * 100}%`;
    $("qModule").textContent = modLabel(it.q);
    $("qText").textContent = it.q.q;
    $("qCode").hidden = !it.q.c;
    $("qCode").textContent = it.q.c || "";

    $("qOptions").replaceChildren(...it.opts.map((o, i) => {
      let cls = "opt";
      if (locked) { if (o.correct) cls += " correct"; else if (i === ans) cls += " wrong"; }
      else if (i === ans) cls += " sel";
      return el("button", { class: cls, onclick: () => choose(i), ...(locked ? { disabled: "" } : {}) },
        el("span", { class: "letter", text: LETTERS[i] }), el("span", { text: o.text }));
    }));

    const fb = $("feedback");
    if (locked) {
      const ok = it.opts[ans].correct;
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "ok" : "bad");
      fb.replaceChildren(el("b", { text: ok ? "✔ Correcto. " : "✘ Incorrecto. " }), it.q.e);
    } else fb.hidden = true;

    const flagged = state.flags.has(idx);
    $("flagBtn").classList.toggle("on", flagged);
    $("flagBtn").textContent = flagged ? "⚑ Marcada para revisar" : "⚐ Marcar para revisar";
    $("qReport").replaceChildren(...[reportLink(it.q)].filter(Boolean));

    $("prevBtn").disabled = idx === 0;
    $("nextBtn").textContent = idx === items.length - 1 ? "Finalizar" : "Siguiente";
    $("finishWarn").hidden = true;
    state.warned = false;
    renderDots();
  }

  function renderDots() {
    const { items, idx, answers, practice, flags } = state;
    $("dots").replaceChildren(...items.map((it, i) => {
      let cls = "dot";
      if (answers[i] !== null) cls += practice ? (it.opts[answers[i]].correct ? " ok" : " bad") : " answered";
      if (flags.has(i)) cls += " flag";
      if (i === idx) cls += " current";
      return el("button", { class: cls, text: i + 1, title: `Pregunta ${i + 1}${flags.has(i) ? " (marcada)" : ""}`, onclick: () => go(i) });
    }));
  }

  function go(i) { state.idx = i; renderQuestion(); }

  function choose(i) {
    if (state.practice && state.answers[state.idx] !== null) return;
    state.answers[state.idx] = i;
    renderQuestion();
  }

  function next() {
    if (state.idx < state.items.length - 1) { go(state.idx + 1); return; }
    const missing = state.answers.filter(a => a === null).length;
    const flagged = state.flags.size;
    if ((missing || flagged) && !state.warned) {
      const parts = [];
      if (missing) parts.push(`${missing} sin responder`);
      if (flagged) parts.push(`${flagged} marcada(s) para revisar`);
      $("finishWarn").textContent = `Tienes ${parts.join(" y ")}. Pulsa "Finalizar" otra vez para corregir igualmente.`;
      $("finishWarn").hidden = false;
      state.warned = true;
      return;
    }
    finish(false);
  }

  function resetQuit() { if (state) state.quitArmed = false; $("quitBtn").textContent = "← Salir"; $("quitBtn").classList.remove("danger"); }
  function quit() {
    const answered = state.answers.some(a => a !== null);
    if (answered && !state.quitArmed) {
      state.quitArmed = true;
      $("quitBtn").textContent = "¿Salir? Perderás las respuestas · pulsa otra vez";
      $("quitBtn").classList.add("danger");
      setTimeout(() => { if (state && state.quitArmed) resetQuit(); }, 4000);
      return;
    }
    stopTimer();
    state = null;
    renderHome();
    show("home");
  }

  // ---------- results ----------
  function finish(timeUp) {
    stopTimer();
    const { items, answers } = state;
    const rows = items.map((it, i) => {
      const a = answers[i];
      return { it, a, ok: a !== null && it.opts[a].correct };
    });
    const correct = rows.filter(r => r.ok).length;
    const pct = Math.round((correct / rows.length) * 100);
    const secs = Math.round((Date.now() - state.startedAt) / 1000);

    const wrong = new Set(store.get(K.wrong, []));
    rows.forEach(r => { if (!r.it.q.gen) r.ok ? wrong.delete(r.it.q.id) : wrong.add(r.it.q.id); });
    store.set(K.wrong, [...wrong]);
    const hist = store.get(K.hist, []);
    hist.push({ date: Date.now(), correct, total: rows.length, pct, label: state.label });
    store.set(K.hist, hist.slice(-50));

    lastResult = { rows, correct, pct, secs, timeUp, label: state.label };
    renderResults("all");
    show("results");
  }

  function renderResults(filter) {
    const { rows, correct, pct, secs, timeUp } = lastResult;
    const pass = pct >= PASS;
    const ring = $("scoreRing");
    ring.style.setProperty("--p", pct);
    ring.style.setProperty("--c", `var(${pass ? "--ok" : "--bad"})`);
    $("scorePct").textContent = pct + "%";
    $("scoreVerdict").textContent = (timeUp ? "⏱ Tiempo agotado · " : "") + (pass ? "¡Aprobado!" : "Hay que repasar");
    $("scoreVerdict").className = "verdict " + (pass ? "ok" : "bad");
    $("scoreDetail").textContent = `${correct} de ${rows.length} correctas · Nota: ${(pct / 10).toFixed(1)} / 10 · Tiempo: ${mmss(secs)} · Aprobado a partir del ${PASS}%`;

    const mods = {};
    rows.forEach(r => { const m = r.it.q.m; mods[m] = mods[m] || { ok: 0, t: 0 }; mods[m].t++; if (r.ok) mods[m].ok++; });
    $("byModule").replaceChildren(...Object.keys(mods).map(Number).sort((a, b) => a - b).map(m => {
      const { ok, t } = mods[m]; const p = Math.round(ok / t * 100);
      return el("div", { class: "mrow" },
        el("span", { text: `${m}. ${MODULES[m]}` }),
        el("div", { class: "bar" }, el("i", { style: `width:${p}%;background:var(${p >= PASS ? "--ok" : "--bad"})` })),
        el("span", { class: "n", text: `${ok}/${t}` }));
    }));

    document.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
    $("retryWrongBtn").disabled = correct === rows.length;

    const list = rows.map((r, i) => ({ ...r, n: i + 1 }))
      .filter(r => filter === "all" || (filter === "wrong" ? !r.ok : r.ok));
    $("review").replaceChildren(...(list.length ? list.map(reviewItem) : [el("p", { class: "muted", text: "Nada que mostrar aquí." })]));
  }

  function reviewItem(r) {
    const { it, a, ok, n } = r;
    const correctIdx = it.opts.findIndex(o => o.correct);
    const fmt = i => `${LETTERS[i]}) ${it.opts[i].text}`;
    return el("div", { class: "ritem" },
      el("div", { class: "qh" },
        el("span", { class: "icon " + (ok ? "ok" : "bad"), text: ok ? "✔" : "✘" }),
        el("div", {}, el("div", { class: "qt", text: `${n}. ${it.q.q}` }),
          el("div", { class: "muted small" }, modLabel(it.q), it.q.gen ? null : " · ", reportLink(it.q)))),
      it.q.c ? el("pre", { text: it.q.c }) : null,
      el("div", { class: "ans" },
        el("div", { class: "you " + (ok ? "good" : "bad"), text: "Tu respuesta: " + (a === null ? "(sin responder)" : fmt(a)) }),
        ok ? null : el("div", { class: "good", text: "Correcta: " + fmt(correctIdx) })),
      el("div", { class: "why" }, el("b", { text: "Por qué: " }), it.q.e));
  }

  // ---------- starters ----------
  const size = () => Number($("quizSize").value);
  function startRandom() { startQuiz(pickBalanced(BANK.filter(q => selected.has(q.m)), size()), "Aleatoria"); }
  function startSubnet() { startQuiz(window.SubnetGen.generate(size()).sort(() => Math.random() - .5), "Subnetting"); }
  function startExam() { startQuiz(pickBalanced(BANK, EXAM.size), "Simulacro", { exam: true, minutes: EXAM.minutes }); }

  // ---------- events ----------
  $("selAll").onclick = () => { selected = new Set(Object.keys(MODULES).map(Number)); saveMods(); renderHome(); };
  $("selNone").onclick = () => { selected.clear(); saveMods(); renderHome(); };
  $("practiceMode").onchange = e => store.set(K.practice, e.target.checked);
  $("quizSize").onchange = e => store.set(K.size, Number(e.target.value));
  $("startBtn").onclick = startRandom;
  $("subnetBtn").onclick = startSubnet;
  $("examBtn").onclick = startExam;
  $("wrongBtn").onclick = () => {
    const qs = store.get(K.wrong, []).map(id => byId.get(id)).filter(Boolean);
    if (qs.length) startQuiz(shuffle(qs).slice(0, size()), "Falladas");
  };
  $("clearHist").onclick = e => {
    const b = e.currentTarget;
    if (b.dataset.armed) { store.set(K.hist, []); store.set(K.wrong, []); delete b.dataset.armed; b.textContent = "Borrar progreso"; renderHome(); }
    else { b.dataset.armed = "1"; b.textContent = "¿Seguro? Pulsa otra vez"; setTimeout(() => { delete b.dataset.armed; b.textContent = "Borrar progreso"; }, 3000); }
  };
  $("prevBtn").onclick = () => { if (state.idx > 0) go(state.idx - 1); };
  $("nextBtn").onclick = next;
  $("flagBtn").onclick = () => { const i = state.idx; state.flags.has(i) ? state.flags.delete(i) : state.flags.add(i); renderQuestion(); };
  $("quitBtn").onclick = quit;
  $("againBtn").onclick = () => {
    const l = lastResult && lastResult.label;
    if (l === "Subnetting") startSubnet(); else if (l === "Simulacro") startExam(); else startRandom();
  };
  $("homeBtn").onclick = () => { renderHome(); show("home"); };
  $("retryWrongBtn").onclick = () => startQuiz(shuffle(lastResult.rows.filter(r => !r.ok).map(r => r.it.q)), "Repetición");
  document.querySelectorAll(".seg-btn").forEach(b => b.onclick = () => renderResults(b.dataset.filter));

  document.addEventListener("keydown", e => {
    if ($("quiz").hidden || !state || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, select, textarea, .calc")) return;
    const k = e.key.toLowerCase();
    const map = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
    if (k in map && map[k] < state.items[state.idx].opts.length) { choose(map[k]); e.preventDefault(); }
    else if (k === "arrowright" || k === "enter") { next(); e.preventDefault(); }
    else if (k === "arrowleft" && state.idx > 0) { go(state.idx - 1); e.preventDefault(); }
    else if (k === "m") { $("flagBtn").click(); e.preventDefault(); }
  });

  renderHome();
})();
