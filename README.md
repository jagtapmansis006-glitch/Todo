# 🎨 Modern Pastel To-Do List Application

<p align="left">
  <img src="https://img.shields.io/badge/Status-Completed-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Focus-UX%2FUI%20Design-purple?style=for-the-badge" alt="Focus" />
  <img src="https://img.shields.io/badge/Storage-Client--Side%20(localStorage)-blue?style=for-the-badge" alt="Storage" />
  <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

> **CodeOrbit Tech Full-Stack Development Internship** — *Task 2: Persistent Web Application*  
> 🔗 **Live Demo:** [todo-ashy-pi.vercel.app](https://todo-ashy-pi.vercel.app/)

---

## ⚡ Key Features

- [x] **Full CRUD Lifecycle:** Add, update text inline, toggle completion, or remove tasks instantly.
- [x] **Zero-Latency Persistence:** State syncs directly to browser `localStorage` to retain data through hard reloads.
- [x] **Dynamic Metric Visualizer:** Real-time progress bar recalculates completion percentage dynamically.
- [x] **State Filter Tabs:** Instantly isolate tasks by `All`, `Active`, and `Done` states.
- [x] **Keyboard Efficiency:** Press `/` anywhere on the page to jump focus straight into the input field.
- [x] **Clean Pastel UI:** Minimalist rounded cards, subtle state transitions, and high-contrast typography.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph LR
    A[User Action / Keypress] --> B[DOM Event Listeners]
    B --> C[State Management Controller]
    C --> D[localStorage Persistence Layer]
    C --> E[Dynamic DOM Re-render]
