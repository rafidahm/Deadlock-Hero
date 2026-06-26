# 🦸‍♂️ DeadLock Hero

**DeadLock Hero** is a comprehensive, interactive educational web application designed to simulate and visualize operating system deadlock scenarios. It simplifies complex OS concepts like the Banker's Algorithm and Resource Allocation Graphs (RAG) by providing an engaging, real-time client-side analysis tool. 

Whether you're a student learning about operating systems or an instructor demonstrating deadlocks, this tool provides a modern, intuitive, and highly visual way to understand resource allocation and process management.

---

## ✨ Features

- **🧠 Real-Time Deadlock Detection:** Instantly analyze resource allocation states to detect potential deadlock conditions and safe sequences.
- **⚡ Quick Mode (Algorithms):** Rapidly execute and step through classic deadlock algorithms like the **Banker's Algorithm** and **Resource Allocation Graphs (RAG)** to see how systems maintain safe states.
- **📊 Smart Mode (Visualizations):** Dive deep into resource utilization analysis with interactive charts and node-based visual graphs. 
- **📚 Integrated Learning Center:** Built-in educational content and definitions to help users understand the underlying theory behind deadlocks, mutual exclusion, hold and wait, no preemption, and circular wait.
- **🎨 Modern & Responsive UI:** A beautifully crafted interface using Tailwind CSS and Framer Motion, featuring smooth micro-animations, toast notifications, and responsive layouts that work across devices.

---

## 🛠️ Tech Stack

DeadLock Hero is built with modern web technologies:

- **Frontend Framework:** React 19 (using Vite for fast builds)
- **Styling:** Tailwind CSS (v4)
- **Animations:** Framer Motion
- **Visualizations & Charts:** 
  - `recharts` for data visualization and resource usage charts.
  - `@xyflow/react` (React Flow) for interactive node-based resource allocation graphs.
- **Routing:** React Router DOM
- **Icons & Notifications:** React Icons, React Hot Toast
- **Linter:** Oxlint for ultra-fast code linting

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rafidahm/Deadlock-Hero.git
   cd Deadlock-Hero
