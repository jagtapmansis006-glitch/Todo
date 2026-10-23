"use strict";

const isReduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================
   Storage layer (tasks, theme, filter)
   ========================================================== */
const Storage = {
  TASKS_KEY: "pastel-todo.tasks.v1",
  THEME_KEY: "pastel-todo.theme",
  FILTER_KEY: "pastel-todo.filter",

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Could not save to localStorage:", err);
    }
  },

  loadTasks() {
    const tasks = this.read(this.TASKS_KEY, []);
    return Array.isArray(tasks) ? tasks : [];
  },

  saveTasks(tasks) {
    this.write(this.TASKS_KEY, tasks);
  },
};

/* ==========================================================
   State
   ========================================================== */
const FILTERS = ["all", "active", "done"];
const savedFilter = Storage.read(Storage.FILTER_KEY, "all");

const state = {
  tasks: Storage.loadTasks(),
  filter: FILTERS.includes(savedFilter) ? savedFilter : "all",
  editingId: null,
  fx: { enterId: null, doneId: null }, // one-shot animation flags
  undo: null,
};

let staggerNext = true; // Stagger list items on first load / filter change

/* ==========================================================
   DOM references
   ========================================================== */
const $ = (id) => document.getElementById(id);

const els = {
  greeting: $("greeting"),
  form: $("task-form"),
  input: $("task-input"),
  list: $("task-list"),
  empty: $("empty-state"),
  emptyText: $("empty-text"),
  count: $("task-count"),
  progress: $("progress"),
  progressBar: $("progress-bar"),
  filters: $("filters"),
  itemsLeft: $("items-left"),
  clearBtn: $("clear-completed"),
  toast: $("toast"),
  toastText: $("toast-text"),
  toastUndo: $("toast-undo"),
  themeToggle: $("theme-toggle"),
  themeIcon: $("theme-icon"),
};

/* ==========================================================
   Helpers
   ========================================================== */
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text; // textContent avoids XSS
  return el;
}

function commit() {
  Storage.saveTasks(state.tasks);
  render();
}

/** Plays the slide-out animation on one or more items, then executes done(). */
function animateOut(ids, done) {
  const list = Array.isArray(ids) ? ids : [ids];
  let found = false;
  list.forEach((id) => {
    const li = els.list.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.classList.add("task-item--leaving");
      found = true;
    }
  });
  if (found && !isReduceMotion()) {
    setTimeout(done, 260);
  } else {
    done();
  }
}

function visibleTasks() {
  if (state.filter === "active") return state.tasks.filter((t) => !t.completed);
  if (state.filter === "done") return state.tasks.filter((t) => t.completed);
  return state.tasks;
}

/* ==========================================================
   Actions (CRUD + extras)
   ========================================================== */
const Actions = {
  add(text) {
    const title = text.trim();
    if (!title) return false; // Ignore empty task
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    state.tasks.unshift({ id, text: title, completed: false });
    state.fx.enterId = id;
    commit();
    return true;
  },

  toggle(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    const apply = () => {
      task.completed = !task.completed;
      if (task.completed) state.fx.doneId = id;
      commit();
    };

    // Item will disappear from the current filter view, animate out first
    const willLeave =
      (state.filter === "active" && !task.completed) ||
      (state.filter === "done" && task.completed);

    if (willLeave) {
      animateOut(id, apply);
    } else {
      apply();
    }
  },

  startEdit(id) {
    state.editingId = id;
    render();
  },

  saveEdit(id, text) {
    const title = text.trim();
    const task = state.tasks.find((t) => t.id === id);
    if (task && title) {
      task.text = title;
    }
    state.editingId = null;
    commit();
  },

  cancelEdit() {
    state.editingId = null;
    render();
  },

  remove(id) {
    animateOut(id, () => {
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index === -1) return;
      const [task] = state.tasks.splice(index, 1);
      Undo.show("Task deleted", [{ task, index }]);
      commit();
    });
  },

  clearCompleted() {
    const ids = state.tasks.filter((t) => t.completed).map((t) => t.id);
    if (!ids.length) return;
    animateOut(ids, () => {
      const removed = [];
      state.tasks = state.tasks.filter((task, index) => {
        if (task.completed) {
          removed.push({ task, index });
          return false;
        }
        return true;
      });
      Undo.show(
        `${removed.length} completed task${removed.length > 1 ? "s" : ""} cleared`,
        removed
      );
      commit();
    });
  },

  setFilter(filter) {
    if (!FILTERS.includes(filter) || filter === state.filter) return;
    state.filter = filter;
    state.editingId = null;
    Storage.write(Storage.FILTER_KEY, filter);
    staggerNext = true;
    render();
  },
};

/* ==========================================================
   Undo Toast (5 seconds)
   ========================================================== */
const Undo = {
  timer: null,

  show(message, items) {
    state.undo = items;
    els.toastText.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 5000);
  },

  hide() {
    clearTimeout(this.timer);
    els.toast.classList.remove("is-visible");
    state.undo = null;
  },

  restore() {
    const items = state.undo;
    if (!items || !items.length) return;
    [...items]
      .sort((a, b) => a.index - b.index)
      .forEach(({ task, index }) => {
        state.tasks.splice(Math.min(index, state.tasks.length), 0, task);
      });
    state.fx.enterId = items[items.length - 1].task.id;
    this.hide();
    commit();
  },
};

/* ==========================================================
   Confetti (Lightweight canvas particles)
   ========================================================== */
const Confetti = {
  canvas: $("confetti"),
  ctx: null,
  particles: [],
  running: false,
  colors: ["#cdbff2", "#8f75d6", "#bfe9d8", "#5fc79d", "#fcd5de", "#e5879d", "#ffe49e"],

  init() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  burst(x, y, count = 28, power = 1) {
    if (isReduceMotion() || !this.ctx) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2.5 + Math.random() * 5.5) * power;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.8,
        size: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        round: Math.random() < 0.45,
        life: 0,
        ttl: 65 + Math.random() * 35,
      });
    }
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.tick());
    }
  },

  celebrate() {
    if (isReduceMotion()) return;
    [0.2, 0.4, 0.6, 0.8].forEach((fraction, i) => {
      setTimeout(() => {
        this.burst(window.innerWidth * fraction, window.innerHeight * 0.35, 42, 1.4);
      }, i * 130);
    });
  },

  tick() {
    if (!this.ctx) return;
    const { ctx } = this;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.particles = this.particles.filter((p) => p.life < p.ttl);

    for (const p of this.particles) {
      p.vy += 0.18;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }

    if (this.particles.length) {
      requestAnimationFrame(() => this.tick());
    } else {
      this.running = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  },
};

/* ==========================================================
   Theme (Dark / Light)
   ========================================================== */
const Theme = {
  init() {
    const saved = Storage.read(Storage.THEME_KEY, null);
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.apply(saved || (prefersDark ? "dark" : "light"));
  },

  apply(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    els.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  },

  toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    this.apply(next);
    Storage.write(Storage.THEME_KEY, next);
  },
};

/* ==========================================================
   Rendering
   ========================================================== */
function createTaskItem(task, index) {
  const li = createElement("li", "task-item" + (task.completed ? " task-item--done" : ""));
  li.dataset.id = task.id;

  if (state.fx.doneId === task.id) {
    li.classList.add("task-item--just-done");
  }

  if (state.fx.enterId === task.id) {
    li.classList.add("task-item--enter");
  } else if (staggerNext) {
    li.classList.add("task-item--enter");
    li.style.setProperty("--delay", `${Math.min(index, 8) * 45}ms`);
  }

  const checkbox = createElement("input", "task-item__checkbox");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark "${task.text}" as complete`);
  checkbox.dataset.action = "toggle";
  li.appendChild(checkbox);

  if (state.editingId === task.id) {
    const body = createElement("span", "task-item__body");
    const input = createElement("input", "task-item__edit-input");
    input.type = "text";
    input.value = task.text;
    input.maxLength = 120;
    input.dataset.role = "edit-input";
    input.setAttribute("aria-label", "Edit task description");
    body.appendChild(input);
    li.appendChild(body);

    const actions = createElement("div", "task-item__actions");
    const save = createElement("button", "icon-btn icon-btn--save", "Save");
    save.type = "button";
    save.dataset.action = "save";
    save.setAttribute("aria-label", "Save edits");

    const cancel = createElement("button", "icon-btn icon-btn--delete", "Cancel");
    cancel.type = "button";
    cancel.dataset.action = "cancel";
    cancel.setAttribute("aria-label", "Cancel editing");

    actions.append(save, cancel);
    li.appendChild(actions);
  } else {
    const body = createElement("span", "task-item__body");
    const text = createElement("span", "task-item__text", task.text);
    text.title = "Double-click to edit";
    body.appendChild(text);
    li.appendChild(body);

    const actions = createElement("div", "task-item__actions");
    const edit = createElement("button", "icon-btn icon-btn--edit", "Edit");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.setAttribute("aria-label", `Edit task "${task.text}"`);

    const del = createElement("button", "icon-btn icon-btn--delete", "Delete");
    del.type = "button";
    del.dataset.action = "delete";
    del.setAttribute("aria-label", `Delete task "${task.text}"`);

    actions.append(edit, del);
    li.appendChild(actions);
  }

  return li;
}

function emptyMessage() {
  if (!state.tasks.length) return "Nothing here yet. Add your first task above ✨";
  if (state.filter === "active") return "Nothing left to do. Enjoy the calm 🌿";
  return "No completed tasks yet. You've got this 💪";
}

function updateHeader() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.completed).length;
  const left = total - done;
  const percent = total ? Math.round((done / total) * 100) : 0;

  if (!total) {
    els.count.textContent = "0 of 0 completed";
  } else if (done === total) {
    els.count.textContent = `${done} of ${total} completed · All done! 🎉`;
  } else {
    els.count.textContent = `${done} of ${total} completed`;
  }

  els.progressBar.style.width = `${percent}%`;
  els.progress.setAttribute("aria-valuenow", String(percent));

  els.itemsLeft.textContent = total ? `${left} task${left === 1 ? "" : "s"} left` : "";
  els.clearBtn.hidden = done === 0;
}

function updateFilters() {
  els.filters.style.setProperty("--i", String(FILTERS.indexOf(state.filter)));
  els.filters.querySelectorAll("[data-filter]").forEach((btn) => {
    const active = btn.dataset.filter === state.filter;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function render() {
  const visible = visibleTasks();
  els.list.replaceChildren(...visible.map(createTaskItem));

  els.empty.hidden = visible.length > 0;
  if (!visible.length) {
    els.emptyText.textContent = emptyMessage();
  }

  updateHeader();
  updateFilters();

  // Reset one-shot animation flags
  state.fx.enterId = null;
  state.fx.doneId = null;
  staggerNext = false;

  const editInput = els.list.querySelector('[data-role="edit-input"]');
  if (editInput) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}

function setGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const date = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  els.greeting.textContent = `${part} · ${date}`;
}

/* ==========================================================
   Event handling
   ========================================================= */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const added = Actions.add(els.input.value);
  if (added) {
    els.input.value = "";
  } else {
    // Shake animation on empty input submit
    els.form.classList.remove("is-shaking");
    void els.form.offsetWidth; // restart keyframe animation
    els.form.classList.add("is-shaking");
  }
  els.input.focus();
});

els.list.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const item = target.closest(".task-item");
  if (!item) return;
  const id = item.dataset.id;

  switch (target.dataset.action) {
    case "toggle": {
      const task = state.tasks.find((t) => t.id === id);
      const completing = task && !task.completed;
      const rect = target.getBoundingClientRect();
      Actions.toggle(id);
      if (completing) {
        Confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const allDone = state.tasks.length > 0 && state.tasks.every((t) => t.completed);
        if (allDone) Confetti.celebrate();
      }
      break;
    }
    case "edit":
      Actions.startEdit(id);
      break;
    case "delete":
      Actions.remove(id);
      break;
    case "cancel":
      Actions.cancelEdit();
      break;
    case "save": {
      const editInput = item.querySelector('[data-role="edit-input"]');
      if (editInput) {
        Actions.saveEdit(id, editInput.value);
      }
      break;
    }
  }
});

// Double click task text to edit
els.list.addEventListener("dblclick", (e) => {
  const text = e.target.closest(".task-item__text");
  if (!text) return;
  const item = text.closest(".task-item");
  if (item) Actions.startEdit(item.dataset.id);
});

els.list.addEventListener("keydown", (e) => {
  if (e.target.dataset.role !== "edit-input") return;
  const item = e.target.closest(".task-item");
  if (!item) return;
  const id = item.dataset.id;

  if (e.key === "Enter") {
    e.preventDefault();
    Actions.saveEdit(id, e.target.value);
  } else if (e.key === "Escape") {
    e.preventDefault();
    Actions.cancelEdit();
  }
});

// Filter navigation
els.filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (btn) Actions.setFilter(btn.dataset.filter);
});

els.clearBtn.addEventListener("click", () => Actions.clearCompleted());
els.toastUndo.addEventListener("click", () => Undo.restore());
els.themeToggle.addEventListener("click", () => Theme.toggle());

// Global "/" shortcut to focus the task input
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "");
  if (e.key === "/" && !typing) {
    e.preventDefault();
    els.input.focus();
  }
});

/* ==========================================================
   Initialization
   ========================================================== */
Theme.init();
Confetti.init();
setGreeting();
render();
