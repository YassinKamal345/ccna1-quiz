<h1 align="center">🧠 CCNA 1 · ITN Practice Exam</h1>

<p align="center">
  Interactive quiz to prepare the <b>CCNA 1 – Introduction to Networks (ITN v7)</b> exam.
</p>

<p align="center">
  <a href="https://yassinkamal345.github.io/ccna1-quiz/" target="_blank">
    <img src="https://img.shields.io/badge/▶_Try_it_live-0a7cc2?style=for-the-badge" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/questions-204-14883e?style=for-the-badge" />
  &nbsp;
  <img src="https://img.shields.io/badge/modules-17-5b6b82?style=for-the-badge" />
</p>

---

## ✨ Features

- **204 original multiple-choice questions** covering all 17 ITN modules, with extra weight on IPv4 subnetting and IPv6
- **CLI exhibits** like in the real exam: `show ip route`, `show ip interface brief`, `ping`, `ipconfig`
- **Random batches** of 10 / 20 / 40 / 60 questions; answer options are shuffled every time
- **Exam mode** (graded at the end) or **practice mode** (instant feedback + explanation)
- **Results screen**: score (% and /10), per-module breakdown, and a full review showing your answer, the correct one and **why**
- **Review wrong answers**: remembers the questions you missed until you get them right
- **Side calculator** with live result and **binary / hex** view — handy for subnetting (`2^5-2`, `256-224`…)
- Keyboard shortcuts (`1-4` / `A-D`, `←` `→`, `Enter`), dark mode, mobile-friendly
- 100% static: no server, no build step, works offline

## 📚 Modules covered

| # | Module | # | Module |
|---|--------|---|--------|
| 1 | Networking Today | 10 | Basic Router Configuration |
| 2 | Basic Switch & End Device Config | 11 | IPv4 Addressing |
| 3 | Protocols and Models | 12 | IPv6 Addressing |
| 4 | Physical Layer | 13 | ICMP |
| 5 | Number Systems | 14 | Transport Layer |
| 6 | Data Link Layer | 15 | Application Layer |
| 7 | Ethernet Switching | 16 | Network Security Fundamentals |
| 8 | Network Layer | 17 | Build a Small Network |
| 9 | Address Resolution | | |

## 🗂️ Project structure

```
index.html     → layout (home, quiz, results, calculator)
style.css      → styles (light/dark, responsive)
app.js         → quiz logic, scoring, review, progress (localStorage)
calc.js        → side calculator (safe expression parser, no eval)
questions.js   → question bank
```

## ➕ Add your own questions

Edit `questions.js`. The **first option is always the correct one** (the app shuffles them):

```js
{m:11, q:"Question text?", o:["Correct answer","Wrong 1","Wrong 2","Wrong 3"], e:"Explanation", c:"optional CLI exhibit"}
```

## 💻 Run locally

Just open `index.html` in your browser.

---

<p align="center"><sub>Original study material based on the public ITN v7 syllabus. Not affiliated with or endorsed by Cisco.</sub></p>
