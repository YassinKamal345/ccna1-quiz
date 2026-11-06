// Side calculator: + − × ÷ ^ ( ), live result, binary/hex view. Independent from the quiz logic.
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const panel = $("calc"), fab = $("calcToggle"), input = $("calcExpr");
  const out = $("calcResult"), bin = $("calcBin"), hex = $("calcHex");
  const KEY = "ccna1.calcOpen";

  // ---- safe parser (no eval): expr = term (+|- term)* ; term = factor (*|/ factor)* ; factor = unary (^ factor)? ----
  function evaluate(src) {
    const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
    let i = 0;
    const peek = () => s[i];
    function num() {
      const m = /^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      return parseFloat(m[0]);
    }
    function primary() {
      if (peek() === "(") { i++; const v = expr(); if (peek() === ")") i++; return v; } // tolerate missing ")"
      return num();
    }
    function unary() {
      if (peek() === "-") { i++; return -unary(); }
      if (peek() === "+") { i++; return unary(); }
      return primary();
    }
    function factor() {
      const b = unary();
      if (peek() === "^") { i++; return Math.pow(b, factor()); }
      return b;
    }
    function term() {
      let v = factor();
      while (peek() === "*" || peek() === "/") { const op = s[i++]; const r = factor(); v = op === "*" ? v * r : v / r; }
      return v;
    }
    function expr() {
      let v = term();
      while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = term(); v = op === "+" ? v + r : v - r; }
      return v;
    }
    if (!s) return null;
    const v = expr();
    if (i !== s.length || !isFinite(v)) throw 0;
    return v;
  }

  const fmt = v => Number.isInteger(v) ? String(v) : String(parseFloat(v.toPrecision(12)));

  function update() {
    let v;
    try { v = evaluate(input.value); } catch { v = undefined; }
    if (v === null) { out.textContent = "0"; out.classList.remove("err"); }
    else if (v === undefined) { out.textContent = "…"; out.classList.add("err"); }
    else { out.textContent = fmt(v); out.classList.remove("err"); }
    const isInt = typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
    // group binary in octets/nibbles for readability
    bin.textContent = isInt ? v.toString(2).replace(/\B(?=(\d{8})+(?!\d))/g, " ") : "—";
    hex.textContent = isInt ? v.toString(16).toUpperCase() : "—";
    return v;
  }

  function insert(t) {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, a) + t + input.value.slice(b);
    input.setSelectionRange(a + t.length, a + t.length);
    update();
  }
  function commit() {
    const v = update();
    if (typeof v === "number") { input.value = fmt(v); update(); }
  }

  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", String(open));
    fab.classList.toggle("on", open);
    try { localStorage.setItem(KEY, open ? "1" : ""); } catch { /* ignore */ }
    if (open && matchMedia("(pointer:fine)").matches) input.focus();
  }

  panel.addEventListener("click", e => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.dataset.k;
    if (k === "C") { input.value = ""; update(); }
    else if (k === "back") {
      const a = input.selectionStart, z = input.selectionEnd;
      if (a !== z) input.value = input.value.slice(0, a) + input.value.slice(z);
      else if (a > 0) { input.value = input.value.slice(0, a - 1) + input.value.slice(a); input.setSelectionRange(a - 1, a - 1); }
      update();
    }
    else if (k === "=") commit();
    else insert(k);
    if (matchMedia("(pointer:fine)").matches) input.focus();
  });
  input.addEventListener("input", update);
  input.addEventListener("keydown", e => {
    e.stopPropagation(); // never trigger quiz shortcuts while typing here
    if (e.key === "Enter" || e.key === "=") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); fab.focus(); }
  });
  fab.addEventListener("click", () => setOpen(panel.hidden));
  $("calcClose").addEventListener("click", () => setOpen(false));

  let initial = false;
  try { initial = localStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
  setOpen(initial);
  update();
})();
