# Pastel To-Do App: Handover

A simple, clean to-do list web app. Add, edit, complete and delete tasks. Tasks are saved in the browser with `localStorage`, so they stay after a reload.

Built with plain HTML, CSS and JavaScript. No frameworks, no build step, no backend.

---

## 1. Project files

| # | File | Purpose |
|---|------|---------|
| 1 | `index.html` | Page structure and links to the CSS and JS |
| 2 | `styles.css` | Pastel design tokens, layout, animations, dark mode |
| 3 | `app.js` | Task logic, localStorage, filters, undo, confetti, theme |
| 4 | `HANDOVER.md` | This file |

Keep all files in the same folder. `index.html` loads the other two by name.

---

## 2. Features

| # | Feature | How it works |
|---|---------|--------------|
| 1 | Add task | Type and press Enter or click Add |
| 2 | Edit task | Click Edit or double-click the text. Enter saves, Esc cancels |
| 3 | Complete task | Click the round checkbox |
| 4 | Delete task | Click Delete. An Undo toast shows for 5 seconds |
| 5 | Clear completed | Removes all done tasks, with Undo |
| 6 | Filters | All, Active, Done |
| 7 | Progress bar | Shows the completion percentage |
| 8 | Dark mode | Moon/sun button. Choice is remembered |
| 9 | Persistence | Tasks, filter and theme are saved in localStorage |
| 10 | Shortcut | Press `/` to jump to the input |

---

## 3. Run locally

1. Unzip the project.
2. Double-click `index.html`.
3. It opens in your browser. No install needed.

---

## 4. Deploy (pick one)

### Option A: GitHub Pages (recommended, free)

| # | Step | Action |
|---|------|--------|
| 1 | Create a repo | On github.com, click New repository. Name it `pastel-todo`. Keep it Public |
| 2 | Open a terminal | Go inside the project folder |
| 3 | Run the commands below | Replace `YOUR-USERNAME` |
| 4 | Turn on Pages | Repo, Settings, Pages |
| 5 | Choose the source | Deploy from a branch, branch `main`, folder `/ (root)`, Save |
| 6 | Wait 1 to 2 minutes | Refresh the Pages screen |
| 7 | Open the live link | `https://YOUR-USERNAME.github.io/pastel-todo/` |

```bash
git init
git add .
git commit -m "Pastel To-Do app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pastel-todo.git
git push -u origin main
```

To update later, run `git add .`, then `git commit -m "update"`, then `git push`.

### Option B: Netlify Drop (fastest, no Git)

| # | Step | Action |
|---|------|--------|
| 1 | Open | app.netlify.com/drop |
| 2 | Drag | Drag the whole project folder onto the page |
| 3 | Done | Netlify gives you a live link right away |

### Option C: Vercel

| # | Step | Action |
|---|------|--------|
| 1 | Push the project to GitHub (Option A, steps 1 to 3) |
| 2 | Open vercel.com, then Add New, then Project |
| 3 | Import the repo |
| 4 | Framework preset: Other. Leave build settings empty. Click Deploy |

---

## 5. Test after deploying

| # | Check | Expected |
|---|-------|----------|
| 1 | Open the live link | Page loads with the pastel design |
| 2 | Add a task | It appears in the list |
| 3 | Edit the task | New text is saved |
| 4 | Complete the task | Checkbox animates, text is struck through, progress bar moves |
| 5 | Delete the task | Task slides out and the Undo toast appears |
| 6 | Click Undo | Task comes back |
| 7 | Refresh the page | Tasks are still there |
| 8 | Toggle dark mode, then refresh | Theme is remembered |
| 9 | Open on a phone | Layout fits the screen |

---

## 6. Things to know

| # | Note |
|---|------|
| 1 | Tasks are stored per browser and per website address. A different browser, device or domain starts with an empty list |
| 2 | Clearing browser site data deletes the tasks |
| 3 | The Poppins font loads from Google Fonts. Offline, it falls back to the system font |
| 4 | localStorage keys: `pastel-todo.tasks.v1`, `pastel-todo.theme`, `pastel-todo.filter` |
| 5 | If the app is hosted in a subfolder (GitHub Pages), the links are relative, so it still works |

---

## 7. Where to extend later

| # | Idea | Where to change |
|---|------|-----------------|
| 1 | New colors or spacing | `:root` variables at the top of `styles.css` |
| 2 | New task actions (due date, priority) | Add a function to `Actions` in `app.js`, then update `createTaskItem()` |
| 3 | New filter | Add to `FILTERS` and `visibleTasks()` in `app.js`, plus a button in `index.html` |
| 4 | Sync across devices | Replace the `Storage` object in `app.js` with API calls to a backend |

---

## 8. Code structure (`app.js`)

| # | Block | Job |
|---|-------|-----|
| 1 | `Storage` | Reads and writes localStorage safely |
| 2 | `state` | Tasks, current filter, edit mode |
| 3 | `Actions` | add, toggle, edit, remove, clearCompleted, setFilter |
| 4 | `Undo` | Toast and restore for deleted tasks |
| 5 | `Confetti` | Canvas particle effects |
| 6 | `Theme` | Light and dark mode |
| 7 | `render()` | Draws the list and updates the header |
| 8 | Event listeners | Click, keyboard and form handling |

---

## 9. Checklist before submitting

| # | Item | Done |
|---|------|------|
| 1 | Files tested locally in a browser | [ ] |
| 2 | Pushed to GitHub | [ ] |
| 3 | Live link opens and works | [ ] |
| 4 | Screenshot added to the repo (optional) | [ ] |
| 5 | Live link and repo link saved for submission | [ ] |
