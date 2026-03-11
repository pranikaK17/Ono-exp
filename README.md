# 🌌 Oneiros Experience (Ono-exp)

![Oneiros Aesthetic](https://img.shields.io/badge/Aesthetic-Cyberpunk-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

An immersive, interactive 3D map environment designed for the **Oneiros 2026** festival. Explore a neon-lit digital twin of the campus, interact with venue pins, and experience the nebula-inspired atmosphere.

---

## ✨ Key Features

*   **🎮 Smooth 3D Navigation:** Third-person character controller with collision detection and terrain following.
*   **🌃 Atmospheric Visuals:**
    *   Custom **Neon Grid** floor with pulse effects.
    *   **Night Sky** system with procedural stars and nebula clouds.
    *   **Bokeh Lights** and fireflies for a magical, lively environment.
    *   Dynamic building outlines and glowing interaction pins.
*   **📱 Platform Optimized:** 
    *   Full desktop support (WASD/Mouse).
    *   Native-feeling mobile joystick and pinch-to-zoom support.
    *   Performance-optimized rendering with DRACO compression.
*   **📍 Interactive Venues:** Clickable pins that navigate to specific event pages (AB1, Football Ground, Grand Stairs, etc.).

---

## 🛠️ Tech Stack

- **Core:** [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Graphics:** [Three.js](https://threejs.org/) (WebGL)
- **Asset Loading:** [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) + [DRACO](https://google.github.io/draco/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **UI:** Custom CSS with [Outfit](https://fonts.google.com/specimen/Outfit) and [Orbitron](https://fonts.google.com/specimen/Orbitron) typography.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd ono-exp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

---

## 🎮 Controls

### Desktop
| Action | Key / Input |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Sprint** | `Shift` |
| **Orbit Camera** | Left Mouse Drag / Mouse Wheel |
| **Interact** | `E` or Click Pin |
| **Zoom** | Scroll Wheel |

### Mobile
| Action | Input |
| :--- | :--- |
| **Move** | Left-side Virtual Joystick |
| **Sprint** | Push joystick to the outer edge |
| **Orbit Camera** | Swipe on screen |
| **Interact** | Tap interact prompt or Tap Pin |
| **Zoom** | Pinch with two fingers |

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── map/
│   │   ├── Map.tsx                # Main 3D Stage & Scene setup
│   │   ├── CharacterController.ts # Logic for movement & camera
│   │   ├── collision.ts           # XZ and Ground collision system
│   │   ├── Input.ts               # Keyboard & Joystick handlers
│   │   ├── Config.ts              # Global parameters (speeds, colors)
│   │   ├── NightSky.ts            # Nebula & Star shader logic
│   │   └── ... (Visual modules: Fireflies, Neon, Forest)
│   └── pages/                     # Routed pages for venues
├── App.tsx                        # Main application entry
└── main.tsx                       # React DOM mounting
```

---

## 🎨 Visual Design

The project uses a **dark-nebula aesthetic** with high-contrast neon highlights. Key visual constants (like `0x02020b` for backgrounds and `0x4dd8e6` for UI) are managed in `src/components/map/Config.ts` to ensure consistency.

---

<p align="center">
  Built with ❤️ for Oneiros 2026.
</p>
