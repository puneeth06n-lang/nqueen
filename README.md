# N-Queens Challenge — 11×11 Puzzle Web App

A frontend web application for a technical club event built around the classic N-Queens puzzle (placing 11 queens on an 11×11 chessboard so no two queens attack each other horizontally, vertically, or diagonally).

Features an event-branded, frontend-only glassmorphism login page with route guards and session management.

---

## Features

1. **Frontend-Only Login Page**:
   - Single input: **Team Name** (2–30 characters, letters/numbers/spaces/underscores/hyphens only).
   - "Start Challenge" button (disabled when input is invalid).
   - Real-time inline validation with error messages.
   - Enter key submission.
2. **Session Persistence & Route Guard**:
   - Saves team name to `localStorage` under key `teamName`.
   - Protects the game route (`/game`): unauthorized visits without a team name are redirected to `/`.
   - Displays active team badge in the header on the game page with a **"Logout / Change team"** button that clears the team name and returns to the login page.
3. **Themed Design & Glassmorphism**:
   - Fullscreen background using the event logo/artwork (`public/login-bg.jpg`) with dark overlay (`object-fit: cover, centered`).
   - Glassmorphism card with frosted blur, rounded corners, and glowing amber/gold accents.
   - ♛ Chess-queen emblem and typography using Google Fonts (Poppins & Inter).
   - Smooth card fade-in animation and interactive focus/hover glows.
4. **Responsive Layout**:
   - Optimized for mobile phones, tablets, and desktop displays.

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Setup Instructions

1. **Clone or open the repository**:
   ```bash
   cd /path/to/queen
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at the URL shown in your terminal (typically `http://localhost:3000` or `http://localhost:5173`).

4. **Production Build & Preview**:
   ```bash
   npm run build
   npm run preview
   ```

---

## Project Structure

```text
queen/
├── index.html                   # HTML entry point with Google Fonts (Inter & Poppins)
├── public/
│   ├── favicon.svg              # App icon
│   └── login-bg.jpg             # Event background artwork
├── src/
│   ├── assets/
│   │   └── login-bg.jpg         # Asset backup copy
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Route guard checking saved teamName in localStorage
│   │   └── ui/                  # Reusable UI components (badge, button, card, etc.)
│   ├── context/
│   │   └── TeamContext.tsx      # Global team state provider & localStorage sync
│   ├── pages/
│   │   ├── Login.tsx            # Frontend-only Login page with glassmorphism & validation
│   │   └── Home.tsx             # 11×11 N-Queens puzzle page with team header badge
│   ├── lib/                     # Utilities & API handlers
│   ├── App.tsx                  # React Router setup with default landing page at "/"
│   ├── main.tsx                 # React DOM root setup with QueryClient & BrowserRouter
│   └── index.css                # Tailwind CSS v4 styling & dark theme variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```
