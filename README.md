# CCNA 1 · ITN Practice Exam

Interactive quiz to prepare the **CCNA 1 – Introduction to Networks (ITN v7)** final exam.

- 200+ original multiple-choice questions covering all 17 ITN modules (extra weight on IPv4 subnetting and IPv6)
- Random batches of 20 questions (10/20/40/60 selectable), options shuffled every time
- Exam mode (results at the end) or practice mode (instant feedback)
- Final score, per-module breakdown and full review with the explanation of every answer
- "Review wrong answers" mode — remembers the questions you failed (stored in your browser)
- Works offline, no server, no build step

## Use it locally

Open `index.html` in your browser. That's it.

## Add your own questions

Edit `questions.js`. Each question follows this format (the **first option is always the correct one**; the app shuffles them):

```js
{m:11, q:"Question text?", o:["Correct answer","Wrong 1","Wrong 2","Wrong 3"], e:"Explanation", c:"optional CLI exhibit"}
```

## Publish on GitHub Pages

1. Create an empty repository on GitHub (e.g. `ccna1-quiz`).
2. Push this folder:
   ```bash
   git remote add origin https://github.com/<your-user>/ccna1-quiz.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After ~1 minute the app is live at `https://<your-user>.github.io/ccna1-quiz/`.

---
Original study material based on the public ITN v7 syllabus. Not affiliated with or endorsed by Cisco.
