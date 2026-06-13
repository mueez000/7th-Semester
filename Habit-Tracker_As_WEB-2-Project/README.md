# HabitFlow

A fully functional, streamlined personal habit tracking application designed for a single user to maintain personal records for prayers, work sessions, custom habits, and exercises seamlessly. Built with a React single-page app frontend and a fast Node.js/MongoDB backend.

## Core Features
1. **Dashboard Overview**: Highly visual layout calculating daily streaks.
2. **Namaz Tracker**: Five daily prayers tracker with visual streak representation.
3. **Work Timer**: In-built focus timer targeting deep work sessions seamlessly.
4. **Exercise Logger**: Track and categorize physical exercises.
5. **Analytics Engine**: Central visual dashboard using Recharts for comprehensive dynamic comparisons.

## Tech Stack
- **Frontend**: React 19 + Vite, TailwindCSS v4, Recharts.
- **Backend**: Express + SQLite (`better-sqlite3`).
- **Database**: Single, zero-dependency embedded database file (`habitflow.db`).

## Quick Start (Local Setup)

1. **Clone the Repository** and open the folder.

2. **Install Dependencies**
   From the root folder, run:
   ```bash
   npm install
   ```
   Then install the backend dependencies:
   ```bash
   cd api
   npm install
   cd ..
   ```

3. **Configure Environment Variables**
   The root directory has an `.env.example` file. Duplicate it and rename it to `.env`. Ensure it reads:
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret_key
   DATABASE_PATH=./api/habitflow.db
   RUN_LOCAL=true
   ```

4. **Start the Engine**
   Run the full-stack concurrently from the root directory:
   ```bash
   npm run dev
   ```

5. **Start Using the App**
   Open your browser and navigate to `http://localhost:5173`. Register an account and let HabitFlow manage your productivity!

## Deployment (Vercel)
The backend is completely modular and built to run on **Vercel's Serverless Engine**. Refer to `DEPLOYMENT.md` for specific instructions on how to push this repository and connect your `.tmp` ephemeral database routing.
