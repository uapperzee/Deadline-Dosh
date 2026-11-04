# 🎓 Deadline Dost — Complete Full-Stack Student Productivity Platform

> **Deadline Dost** is an all-in-one, multi-user student productivity and deadline management platform featuring cloud database persistence, email & password authentication, Google Sign-In, an editable student profile system, Pomodoro focus timer with stopwatch, weekly timetable, study planner, gamified XP & streak tracking, quick notes, and an AI-powered study assistant.

Built with **React (Vite)** on the frontend, **Node.js & Express** on the backend, and **PostgreSQL with Supabase Auth & Storage**. Styled in two themes only: **Mint Light** (soft mint-glass surfaces, emerald accents) and **Forest Dark** (deep forest green, glowing mint accents). Toggle from the header or Settings; the choice is remembered.

---

## 📑 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Project File Structure](#-project-file-structure)
3. [Prerequisites & System Requirements (Windows Setup)](#-prerequisites--system-requirements-windows-setup)
4. [Step-by-Step Local Setup Guide](#-step-by-step-local-setup-guide)
5. [Supabase Project Setup & Database Migrations](#-supabase-project-setup--database-migrations)
6. [Authentication Configuration](#-authentication-configuration)
   - [Email & Password Authentication](#email--password-authentication)
   - [Google OAuth Integration (Google Cloud Console + Supabase)](#google-oauth-integration)
   - [Profile Picture Storage Bucket (`avatars`)](#profile-picture-storage-bucket-avatars)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [Starting the Application](#-starting-the-application)
9. [Features Walkthrough](#-features-walkthrough)
10. [Local Storage to Cloud Migration Guide](#-local-storage-to-cloud-migration-guide)
11. [AI Study Assistant Configuration (Google Gemini / OpenAI)](#-ai-study-assistant-configuration)
12. [Running Tests](#-running-tests)
13. [Production Deployment Guide (Vercel + Render)](#-production-deployment-guide-vercel--render)
14. [Security & Access Control (RLS & JWT)](#-security--access-control-rls--jwt)

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    Client["React (Vite) Frontend\n(Port 5173 / Vercel)"] -->|User Auth & OAuth| SupabaseAuth["Supabase Auth\n(JWT & Google OAuth)"]
    Client -->|Avatar Uploads| SupabaseStorage["Supabase Storage\n(Bucket: avatars)"]
    Client -->|API Requests with Bearer JWT| Server["Node.js / Express Backend\n(Port 5000 / Render)"]
    Server -->|JWT Verification| SupabaseAuth
    Server -->|Authenticated SQL Queries\nScoped by auth.uid()| Postgres["PostgreSQL Database\n(10 Tables with RLS)"]
    Server -->|Contextual Workload Analysis| AIProvider["Google Gemini / OpenAI API\n(Server-side AI_API_KEY)"]
```

---

## 📁 Project File Structure

```
deadline-dost/
├── client/                               # Frontend Single-Page Application (React + Vite)
│   ├── public/
│   │   └── favicon.svg                  # Emerald checkmark icon
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── ConfirmDialog.jsx        # Safe confirmation modal
│   │   │   ├── Header.jsx               # Header with shortcuts (N, /) and theme toggle
│   │   │   ├── MigrationModal.jsx       # LocalStorage -> Cloud migration modal
│   │   │   ├── Modal.jsx                # Accessible animated modal dialog
│   │   │   ├── Sidebar.jsx              # Responsive navigation sidebar
│   │   │   ├── SubjectModal.jsx         # Add / edit academic subject modal
│   │   │   ├── TaskModal.jsx            # Add / edit task & subtasks modal
│   │   │   └── Toast.jsx                # Smooth notification toast
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Session & user state management
│   │   │   ├── DataContext.jsx          # Cloud & demo data store with optimistic UI
│   │   │   └── ThemeContext.jsx         # Two themes (Mint Light / Forest Dark) + reduce-motion
│   │   ├── pages/                       # Feature pages
│   │   │   ├── Achievements.jsx         # 9 productivity badges & XP levels
│   │   │   ├── Analytics.jsx            # 7 & 14-day study charts, on-time rate
│   │   │   ├── AuthCallback.jsx         # Supabase OAuth redirect & token exchange
│   │   │   ├── Calendar.jsx             # Month grid (42 days) & list view
│   │   │   ├── Dashboard.jsx            # Home greeting, schedule & study tip
│   │   │   ├── FocusRoom.jsx            # Pomodoro timer (25/5/15) & stopwatch
│   │   │   ├── ForgotPassword.jsx       # Password reset dispatch
│   │   │   ├── Profile.jsx              # 7-tab editable student profile
│   │   │   ├── QuickNotes.jsx           # Auto-saving quick scratchpad
│   │   │   ├── ResetPassword.jsx        # Password update page
│   │   │   ├── Settings.jsx             # Theme picker, motion, and timer prefs
│   │   │   ├── SignIn.jsx               # Email/Password + Google Sign-In
│   │   │   ├── SignUp.jsx               # Registration with email verification
│   │   │   ├── StudyAssistant.jsx       # AI Study Coach & context-aware assistant
│   │   │   ├── StudyPlanner.jsx         # Exam preparation schedule generator
│   │   │   ├── Subjects.jsx             # Subject management & progress bars
│   │   │   └── Tasks.jsx                # Task filters, sorting, and Kanban board
│   │   ├── services/
│   │   │   ├── api.js                   # Authenticated API client
│   │   │   ├── authService.js           # Supabase Auth client methods
│   │   │   ├── storageService.js        # Avatar upload to Supabase Storage
│   │   │   └── supabase.js              # Supabase browser client initialization
│   │   ├── styles/
│   │   │   └── main.css                 # Mint Light + Forest Dark design tokens & styles
│   │   ├── utils/
│   │   ├── App.jsx                      # Main router & modal wrapper
│   │   └── main.jsx                     # React entrypoint
│   ├── .env.example                     # Client environment template
│   ├── index.html                       # HTML5 root with DM Sans & Manrope fonts
│   ├── package.json                     # Client dependencies & build scripts
│   └── vite.config.js                   # Vite config with proxy & vendor chunking
│
├── server/                              # Backend REST API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                   # Validated environment configuration
│   │   │   └── supabase.js              # Supabase Admin & scoped client factory
│   │   ├── controllers/
│   │   │   ├── achievementController.js # Real badge unlocking & XP computation
│   │   │   ├── aiController.js          # AI chat, history, and study plan generator
│   │   │   ├── analyticsController.js   # 7/14 day metrics, on-time calculation
│   │   │   ├── authController.js        # /api/auth/me user verification
│   │   │   ├── exportController.js      # Complete JSON data snapshot export
│   │   │   ├── migrationController.js   # LocalStorage data importer
│   │   │   ├── noteController.js        # Quick notes controller
│   │   │   ├── profileController.js     # Profile CRUD, preferences, account deletion
│   │   │   ├── sessionController.js     # Study sessions logger
│   │   │   ├── subjectController.js     # Subject CRUD & task integrity check
│   │   │   ├── taskController.js        # Task & subtask CRUD, completion toggle
│   │   │   └── timetableController.js   # Weekly timetable slot management
│   │   ├── middleware/
│   │   │   ├── auth.js                  # Bearer JWT verification via Supabase
│   │   │   ├── errorHandler.js          # Standardized JSON error response handler
│   │   │   ├── rateLimiter.js           # Express rate limiters (standard & strict)
│   │   │   └── validator.js             # Zod request validation middleware
│   │   ├── routes/                      # Express route endpoints
│   │   │   ├── achievements.js
│   │   │   ├── ai.js
│   │   │   ├── analytics.js
│   │   │   ├── auth.js
│   │   │   ├── export.js
│   │   │   ├── health.js
│   │   │   ├── migration.js
│   │   │   ├── notes.js
│   │   │   ├── profiles.js
│   │   │   ├── sessions.js
│   │   │   ├── subjects.js
│   │   │   ├── tasks.js
│   │   │   └── timetable.js
│   │   ├── services/
│   │   │   ├── aiService.js             # Gemini & LLM contextual integration
│   │   │   └── statsService.js          # Streak, XP, Level, and badge calculations
│   │   ├── validators/
│   │   │   └── schemas.js               # Strict Zod schemas for all input
│   │   ├── app.js                       # Express app with CORS, Helmet, routes
│   │   └── server.js                    # Server startup and graceful shutdown
│   ├── tests/
│   │   └── server.test.js               # Node.js test suite (14 passing tests)
│   ├── .env.example                     # Server environment template
│   └── package.json                     # Server dependencies & test script
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # Complete schema, triggers, RLS & storage
│   └── seed/
│       └── 001_seed_sample_data.sql     # Optional test seed data
│
├── .gitignore                           # Git ignore rules
├── package.json                         # Monorepo root scripts
└── README.md                            # Comprehensive documentation
```

---

## 💻 Prerequisites & System Requirements (Windows Setup)

### 1. Install Node.js
1. Go to [https://nodejs.org](https://nodejs.org) and download the **LTS (Long Term Support)** installer for Windows (Node.js 18.0.0 or higher; v20.x recommended).
2. Run the `.msi` installer and follow the wizard (keep default checkboxes checked).
3. Open PowerShell or Command Prompt and verify:
   ```powershell
   node -v
   npm -v
   ```

### 2. Install Visual Studio Code
1. Download from [https://code.visualstudio.com/](https://code.visualstudio.com/).
2. Recommended extensions for this project:
   - **ESLint**
   - **Prettier - Code formatter**
   - **Tailwind CSS / PostCSS Language Support** (optional)

---

## 🚀 Step-by-Step Local Setup Guide

### 1. Open the Project in VS Code
Open PowerShell and navigate to the project directory:
```powershell
cd "C:\Users\Shreel Patel\.gemini\antigravity\scratch\deadline-dost"
code .
```

### 2. Install Dependencies
Run the installation for both backend and frontend:
```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

---

## 🗄️ Supabase Project Setup & Database Migrations

### 1. Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose an organization, enter a name (e.g. `deadline-dost`), select a strong database password, and pick a region close to you (e.g. `ap-south-1` for India).
4. Click **Create new project** and wait 1–2 minutes for the database cluster to provision.

### 2. Run Database Migrations
1. In your Supabase dashboard, click **SQL Editor** on the left menu.
2. Click **New Query**.
3. Open the file `database/migrations/001_initial_schema.sql` from your project in VS Code, copy all its contents, and paste them into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl + Enter`).
5. You will see `Success. No rows returned`. This creates:
   - The `profiles` table (linked to `auth.users`)
   - The `subjects` table
   - The `tasks` table with foreign key to subjects
   - The `subtasks` table with cascading delete
   - The `study_sessions` table
   - The `timetable_entries` table with unique constraint on `(user_id, slot_row, day_col)`
   - The `notes` table
   - The `user_preferences` table
   - The `user_achievements` table
   - The `ai_chat_history` table
   - All performance indexes
   - Row Level Security (RLS) policies on all tables so **User A can NEVER access or edit User B's records**
   - The `avatars` storage bucket with upload and read policies
   - The `on_auth_user_created` trigger that automatically initializes a profile and preferences upon signup!

---

## 🔐 Authentication Configuration

### Email & Password Authentication
1. In your Supabase dashboard, go to **Authentication** -> **Providers** -> **Email**.
2. Ensure **Enable Email provider** is turned **ON**.
3. For local testing without an external SMTP service:
   - You can toggle **Confirm email** on or off. When ON, Supabase sends a real verification email.
4. Under **Authentication** -> **URL Configuration**:
   - Set **Site URL** to `http://localhost:5173`
   - Under **Redirect URLs**, add:
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/auth/reset-password`
     - `https://your-production-app.vercel.app/auth/callback` (when deploying)
     - `https://your-production-app.vercel.app/auth/reset-password` (when deploying)

### Google OAuth Integration
To enable **Continue with Google**:

#### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project called `Deadline Dost`.
3. Go to **APIs & Services** -> **OAuth consent screen**:
   - Choose **External**, then click **Create**.
   - App name: `Deadline Dost`
   - User support email: Select your email.
   - Developer contact email: Enter your email.
   - Click **Save and Continue**.
4. Go to **APIs & Services** -> **Credentials**:
   - Click **+ CREATE CREDENTIALS** -> **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Deadline Dost Web Client`.
   - Under **Authorized redirect URIs**, add your Supabase Callback URL:
     ```
     https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback
     ```
     *(Find your exact callback URL in Supabase -> Authentication -> Providers -> Google)*.
   - Click **Create**.
   - Copy the **Client ID** and **Client Secret**.

#### Step 2: Supabase Google Provider
1. In your Supabase dashboard, go to **Authentication** -> **Providers** -> **Google**.
2. Toggle Google to **Enabled**.
3. Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
4. Click **Save**.

### Profile Picture Storage Bucket (`avatars`)
1. In Supabase, go to **Storage**.
2. If the `avatars` bucket is not already listed, click **New Bucket**:
   - Name: `avatars`
   - Public bucket: **ON** (so profile pictures can be viewed via public URLs)
3. The RLS policies created in `001_initial_schema.sql` ensure students can only upload and delete files inside their own `avatars/<user_id>/` folder!

---

## 🔑 Environment Variables Reference

### Backend (`server/.env`)
Create a file named `.env` inside the `server/` directory:
```ini
# Server Network Configuration
PORT=5000
NODE_ENV=development

# Supabase Credentials (from Supabase Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Client URL (for CORS validation)
CLIENT_URL=http://localhost:5173

# AI Study Assistant Provider Configuration
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-or-openai-api-key-here
AI_MODEL=gemini-1.5-flash
```

> **Security Rule**: The `SUPABASE_SERVICE_ROLE_KEY` must **ONLY** live on the server and must **NEVER** be committed to Git or exposed in the frontend.

### Frontend (`client/.env`)
Create a file named `.env` inside the `client/` directory:
```ini
# Supabase URL (from Supabase Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Public Key (safe to expose in client)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Backend API Base URL (Leave empty in local dev to use Vite proxy, or set server URL in production)
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🏃 Starting the Application

### Option A: Running with Monorepo Commands
From the project root `deadline-dost/`:
```powershell
# In Terminal 1 - Start the backend server:
npm run dev:server

# In Terminal 2 - Start the frontend:
npm run dev:client
```

### Option B: Running Separately
```powershell
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser. The backend API is accessible at `http://localhost:5000/api/health`.

---

## ✨ Features Walkthrough

### 1. Authentication Experience
- **Sign Up**: Clean form with validation, password confirmation check, show/hide password toggle, and terms acceptance. On submission, sends a real verification email via Supabase Auth.
- **Sign In**: Email & password authentication with "Remember Me", forgot password recovery, and single-click **Continue with Google**.
- **Password Recovery**: Secure password reset email dispatch and new password form.

### 2. My Profile Dashboard (7 Comprehensive Tabs)
Navigate to **My Profile** via the sidebar or by clicking your avatar in the top right:
1. **Overview**: Live database statistics — total tasks, completed, pending, overdue, total study hours, current streak, longest streak, weekly target percentage, XP earned, and current level.
2. **Personal Information**: Edit your full name, username, bio, phone number, college/university, degree/course, department, semester, academic year, timezone, and study goal.
3. **Study Statistics**: In-depth focus session metrics, weekly study targets, and completion rates.
4. **Achievements**: Your unlocked badges and progress towards upcoming honors.
5. **Activity History**: Verified reverse-chronological timeline of completed tasks and finished focus sessions.
6. **Account Settings**: Update your password or request an email address change.
7. **Privacy & Security**: Download an immediate JSON export of all your student records, manage active sessions, or permanently delete your account with double confirmation.

### 3. Profile Picture Storage
- Upload profile photos directly to Supabase Storage (`avatars` bucket).
- File size is validated (max 2MB) and restricted to image formats (JPEG, PNG, WebP, GIF).
- Includes instant preview and one-click photo removal.

### 4. Tasks & Kanban Board
- Organize deadlines by Subject, Category (Assignment, Exam, Lecture, Study, Reminder), Priority (Low, Medium, High, Urgent), and Status (To Do, In Progress, Completed).
- Add subtasks to any assignment and check off individual steps.
- Toggle between **List View** and **Kanban Board** with one click.
- Keyboard shortcut `N` opens the quick add task dialog from any page.

### 5. Calendar
- 42-day month grid and alternate month list view.
- Filter event chips by category.
- Click any day to see scheduled deadlines or schedule new events.

### 6. Timetable
- Visual weekly timetable spanning 8:00 AM to 5:00 PM across Monday to Saturday.
- Highlights today's day column automatically.
- Inline editing that automatically saves as you type.

### 7. Study Planner
- Select an academic subject, enter your exam date, and set daily study availability.
- Generates a customized spaced-repetition plan.
- Click **Add Selected to Calendar** to automatically create study tasks in your database.

### 8. Focus Room (Pomodoro + Stopwatch)
- Pomodoro timer: Focus (25m), Short Break (5m), Long Break (15m) with animated circular SVG countdown ring.
- Links focus sessions to active tasks.
- Auto-starts breaks if enabled.
- Built-in open-ended **Stopwatch** for untimed deep-work blocks.

### 9. Quick Notes
- Distraction-free scratchpad with live word count and auto-saving indicator.

### 10. AI Study Assistant
- Powered by the backend server with access to the authenticated student's active tasks, overdue items, upcoming exams, and subjects.
- Generates exam revision schedules, study techniques, and deadline risk analyses.
- Persists chat history in the `ai_chat_history` database table.

### 11. Achievements & Gamification
- Real XP and level system: Level = floor(sqrt(totalXP / 50)) + 1.
- 9 Badges: *First step*, *Task master*, *Deadline hero*, *On a roll*, *Unstoppable*, *Focused*, *Deep worker*, *Organised*, and *Timetable builder*.
- Only genuine completed tasks and completed focus sessions count toward streaks and XP.

### 12. Theme Customization
- Two themes: **Mint Light** and **Forest Dark** (toggle in the header or Settings; first visit follows your OS preference).
- Reduced-motion accessibility setting.

---

## 🔄 Local Storage to Cloud Migration Guide

If you previously used Deadline Dost in local demo mode:
1. When you sign in or create an account, the application automatically detects existing `dd_data` in your browser.
2. An **Import Local Data** dialog will appear displaying a breakdown:
   - Number of tasks & subtasks
   - Number of subjects
   - Number of focus sessions
   - Number of timetable entries
3. Click **Import to My Account**:
   - The client sends the payload to `/api/migrate`.
   - The backend maps local IDs to PostgreSQL UUIDs, validates constraints, and inserts the records into your account.
   - Your local browser copy is safely preserved as a backup.

---

## 🤖 AI Study Assistant Configuration

The assistant uses server-side API keys and never exposes them to the browser:

1. Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. In `server/.env`, set:
   ```ini
   AI_PROVIDER=gemini
   AI_API_KEY=your_actual_gemini_api_key_here
   AI_MODEL=gemini-1.5-flash
   ```
3. Restart the backend server (`npm run dev:server`).
4. If no API key is set, the assistant operates in smart local advisor mode, informing the student how to configure the key while still analyzing their active deadlines and workload.

---

## 🧪 Running Tests

The backend includes a comprehensive automated test suite testing health checks, RLS security enforcement, unauthenticated request rejection (401), Zod validation schemas, XP calculation, level curves, and streak algorithms:

```powershell
cd server
npm test
```

Expected output:
```
TAP version 13
ok 1 - Health check endpoint returns 200, healthy status, and platform metadata
ok 2 - Unauthenticated request to /api/tasks returns 401 Unauthorized
ok 3 - Unauthenticated request to /api/profile returns 401 Unauthorized
ok 4 - Unauthenticated request to /api/subjects returns 401 Unauthorized
ok 5 - Unauthenticated request to /api/ai/chat returns 401 Unauthorized
ok 6 - Unauthenticated request to /api/export returns 401 Unauthorized
ok 7 - Non-existent endpoint returns 404 Not Found JSON response
ok 8 - taskCreateSchema validation accepts valid task and rejects missing required fields
ok 9 - subjectCreateSchema validation enforces color hex regex and name constraints
ok 10 - sessionCreateSchema validation enforces duration bounds
ok 11 - profileUpdateSchema validation restricts username characters
ok 12 - calculateXP produces accurate XP, levels, and breakdown
ok 13 - calculateStreaks handles active sessions and completed tasks accurately
ok 14 - BADGE_DEFINITIONS includes all 9 required productivity badges
1..14
# pass 14
# fail 0
```

To test the frontend production build:
```powershell
cd client
npm run build
```

---

## 🌐 Production Deployment Guide (Vercel + Render)

### Backend Deployment (Render)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following build and start settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. In the **Environment Variables** section, add:
   - `PORT`: `5000` (or leave default)
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://deadline-dost.vercel.app`)
   - `AI_PROVIDER`: `gemini`
   - `AI_API_KEY`: Your Gemini API key
6. Click **Deploy Web Service** and note your Render service URL (e.g. `https://deadline-dost-api.onrender.com`).

### Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Select your repository.
3. Configure project settings:
   - **Root Directory**: Select `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key
   - `VITE_API_BASE_URL`: Your Render backend URL (e.g. `https://deadline-dost-api.onrender.com`)
5. Click **Deploy**.
6. After deployment:
   - Copy your Vercel URL (e.g. `https://deadline-dost.vercel.app`).
   - Add it to `server/.env` as `CLIENT_URL`.
   - Add it to Supabase under **Authentication** -> **URL Configuration** -> **Redirect URLs** (`https://your-app.vercel.app/auth/callback` and `https://your-app.vercel.app/auth/reset-password`).

---

## 🛡️ Security & Access Control (RLS & JWT)

Deadline Dost implements bank-grade multi-tenant security principles:
1. **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer. Even if an attacker knew another student's UUID, queries to `tasks`, `subjects`, `study_sessions`, `timetable_entries`, `notes`, or `profiles` return **0 rows** unless `auth.uid() = user_id`.
2. **Server-Side Token Verification**: The backend API verifies the cryptographic signature of the Bearer JWT with Supabase on every request. Client-supplied user IDs in request bodies are ignored.
3. **Storage Isolation**: Students can only read, upload, and delete avatar files within their personal folder (`avatars/{user_id}/`).
4. **Secret Protection**: `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` are only configured on the server and are never sent to the client.
5. **Rate Limiting & Protection**: Protected by `helmet` headers, CORS whitelisting, and strict rate limiters on AI and authentication endpoints.

---

## 📄 License
This project is licensed under the MIT License. Built with ❤️ for students worldwide.
