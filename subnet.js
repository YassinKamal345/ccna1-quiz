// Infinite IPv4 subnetting question generator. Produces questions in the same format as questions.js
// (o[0] = correct), flagged with gen:true so they are not tracked in the "wrong answers" list.
window.SubnetGen = (() => {
  "use strict";
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const toIp = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join(".");
  const maskOf = p => (p <= 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
  const fmtN = n => n.toLocaleString("en-US");
  // prefixes that are not on an octet boundary (the ones that require real calculation)
  const prefixIn = (lo, hi) => { let p; do { p = rnd(lo, hi); } while (p % 8 === 0); return p; };

  function randomHost() {
    const kind = rnd(0, 3);
    let ip, p;
    if (kind === 0) { ip = [10, rnd(0, 255), rnd(0, 255), rnd(0, 255)]; p = prefixIn(9, 30); }
    else if (kind === 1) { ip = [172, rnd(16, 31), rnd(0, 255), rnd(0, 255)]; p = prefixIn(17, 30); }
    else if (kind === 2) { ip = [192, 168, rnd(0, 255), rnd(0, 255)]; p = prefixIn(20, 30); }
    else { ip = [rnd(1, 223), rnd(0, 255), rnd(0, 255), rnd(0, 255)]; p = prefixIn(16, 30); }
    const n = ip.reduce((a, o) => ((a << 8) | o) >>> 0, 0);
    const m = maskOf(p), net = (n & m) >>> 0, bc = (net | (~m >>> 0)) >>> 0;
    if (n === net || n === bc || ip[0] === 127) return randomHost(); // must be a usable host
    return { n, p, m, net, bc, size: 2 ** (32 - p), hosts: 2 ** (32 - p) - 2 };
  }

  // Explanation of the "magic number" method in the interesting octet
  function explain(x) {
    const k = Math.floor(x.p / 8);                     // 0-based interesting octet
    const mo = (x.m >>> (24 - 8 * k)) & 255, block = 256 - mo;
    const ipo = (x.n >>> (24 - 8 * k)) & 255, neto = (x.net >>> (24 - 8 * k)) & 255;
    return `Máscara /${x.p} = ${toIp(x.m)}. El octeto interesante es el ${k + 1}.º (${mo}), con saltos de 256 − ${mo} = ${block}. ` +
      `${ipo} cae en el bloque ${neto}–${neto + block - 1}, así que: red ${toIp(x.net)}, broadcast ${toIp(x.bc)}, ` +
      `hosts útiles ${toIp(x.net + 1)} – ${toIp(x.bc - 1)} (2^${32 - x.p} − 2 = ${fmtN(x.hosts)}).`;
  }

  // correct + up to 3 unique distractors; tops up with `extra()` if needed
  function options(correct, cands, extra) {
    const set = [correct];
    for (const c of cands) if (c != null && !set.includes(c) && set.length < 4) set.push(c);
    let guard = 0;
    while (set.length < 4 && guard++ < 50) { const c = extra(); if (!set.includes(c)) set.push(c); }
    return set;
  }

  const T = {
    network() {
      const x = randomHost();
      const dotted = Math.random() < 0.35;
      return {
        q: dotted ? `What is the network address of the host ${toIp(x.n)} with subnet mask ${toIp(x.m)}?`
                  : `What is the network address of the host ${toIp(x.n)}/${x.p}?`,
        o: options(toIp(x.net), [toIp(x.net + x.size), toIp(x.net - x.size), toIp(x.bc), toIp((x.n & maskOf(Math.floor(x.p / 8) * 8)) >>> 0)],
          () => toIp(x.net + x.size * rnd(2, 4))),
        e: explain(x)
      };
    },
    broadcast() {
      const x = randomHost();
      return {
        q: `What is the broadcast address of the subnet that contains the host ${toIp(x.n)}/${x.p}?`,
        o: options(toIp(x.bc), [toIp(x.bc - x.size), toIp(x.bc + x.size), toIp(x.net), toIp(x.bc - 1)],
          () => toIp(x.bc + x.size * rnd(2, 4))),
        e: explain(x)
      };
    },
    range() {
      const x = randomHost();
      const r = (a, b) => `${toIp(a)} - ${toIp(b)}`;
      return {
        q: `What is the range of usable host addresses in the subnet that contains ${toIp(x.n)}/${x.p}?`,
        o: options(r(x.net + 1, x.bc - 1), [r(x.net, x.bc), r(x.net + 1, x.bc), r(x.net + x.size + 1, x.bc + x.size - 1), r(x.net - x.size + 1, x.net - 2)],
          () => r(x.net + 2, x.bc - 2)),
        e: explain(x)
      };
    },
    hosts() {
      const p = prefixIn(17, 30), h = 32 - p;
      const c = [2 ** h, 2 ** h - 1, 2 ** (h - 1) - 2, 2 ** (h + 1) - 2].filter(v => v > 0).map(fmtN);
      return {
        q: `How many usable host addresses are available in a /${p} subnet?`,
        o: options(fmtN(2 ** h - 2), c, () => fmtN(2 ** (h + 2) - 2)),
        e: `/${p} deja ${h} bits de host (32 − ${p}). Direcciones totales: 2^${h} = ${fmtN(2 ** h)}. Se restan la dirección de red y la de broadcast: ${fmtN(2 ** h)} − 2 = ${fmtN(2 ** h - 2)} hosts útiles.`
      };
    },
    mask() {
      const p = prefixIn(9, 30);
      return {
        q: `Which subnet mask in dotted decimal corresponds to the prefix /${p}?`,
        o: options(toIp(maskOf(p)), [p - 1, p + 1, p + 2, p - 2].filter(v => v > 8 && v < 32).map(v => toIp(maskOf(v))), () => toIp(maskOf(rnd(9, 30)))),
        e: `/${p} = ${p} bits a 1. Octetos completos a 255 y, en el octeto parcial, los ${p % 8} primeros bits a 1 = ${(maskOf(p) >>> (24 - 8 * Math.floor(p / 8))) & 255}. Tabla útil: 128, 192, 224, 240, 248, 252, 254. Resultado: ${toIp(maskOf(p))}.`
      };
    },
    forHosts() {
      const h = rnd(2, 10), N = rnd(2 ** (h - 1) - 1, 2 ** h - 2), p = 32 - h;
      const f = v => `${toIp(maskOf(v))} (/${v})`;
      return {
        q: `A subnet must support ${N} hosts. Which subnet mask provides enough addresses while wasting the fewest?`,
        o: options(f(p), [f(p + 1), f(p - 1), f(p - 2)].filter((_, i) => p + 1 <= 30 || i > 0), () => f(p - 3)),
        e: `Busca el menor n tal que 2^n − 2 ≥ ${N}. Con ${h - 1} bits: 2^${h - 1} − 2 = ${2 ** (h - 1) - 2} (no llega). Con ${h} bits: 2^${h} − 2 = ${2 ** h - 2} (suficiente). ` +
           `Así que hay ${h} bits de host → /${p} = ${toIp(maskOf(p))}. Una máscara más corta (/${p - 1}) también sirve, pero desperdicia más direcciones.`
      };
    },
    validHost() {
      const x = randomHost();
      const valid = x.net + rnd(1, x.hosts);
      return {
        q: `Which address can be assigned to a host in the network ${toIp(x.net)}/${x.p}?`,
        o: options(toIp(valid), [toIp(x.bc), toIp(x.net), toIp(x.bc + 1 + rnd(1, Math.max(1, x.hosts - 1))), toIp(x.net - 1)],
          () => toIp(x.bc + x.size + 1)),
        e: explain(x) + ` La dirección de red y la de broadcast no se pueden asignar, y las que están fuera de ese rango pertenecen a otras subredes.`
      };
    }
  };
  const TYPES = Object.keys(T);

  function generate(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const q = T[TYPES[i % TYPES.length]]();
      out.push({ m: 11, gen: true, ...q });
    }
    return out;
  }
  return { generate };
})();
