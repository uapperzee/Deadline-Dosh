import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { Toast } from './components/Toast.jsx';
import { TaskModal } from './components/TaskModal.jsx';
import { SubjectModal } from './components/SubjectModal.jsx';
import { MigrationModal } from './components/MigrationModal.jsx';

// Pages
import { Dashboard } from './pages/Dashboard.jsx';
import { Tasks } from './pages/Tasks.jsx';
import { Calendar } from './pages/Calendar.jsx';
import { Timetable } from './pages/Timetable.jsx';
import { StudyPlanner } from './pages/StudyPlanner.jsx';
import { FocusRoom } from './pages/FocusRoom.jsx';
import { QuickNotes } from './pages/QuickNotes.jsx';
import { StudyAssistant } from './pages/StudyAssistant.jsx';
import { Subjects } from './pages/Subjects.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Achievements } from './pages/Achievements.jsx';
import { Profile } from './pages/Profile.jsx';
import { Settings } from './pages/Settings.jsx';
import { SignIn } from './pages/SignIn.jsx';
import { SignUp } from './pages/SignUp.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';
import { ResetPassword } from './pages/ResetPassword.jsx';
import { AuthCallback } from './pages/AuthCallback.jsx';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tasks': 'My Tasks',
  '/calendar': 'Calendar',
  '/timetable': 'Timetable',
  '/planner': 'Study Planner',
  '/focus': 'Focus Room',
  '/notes': 'Quick Notes',
  '/assistant': 'Study Assistant',
  '/subjects': 'Subjects',
  '/analytics': 'Analytics',
  '/achievements': 'Achievements',
  '/profile': 'My Profile',
  '/settings': 'Settings',
  '/signin': 'Sign In',
  '/signup': 'Create Account',
  '/forgot-password': 'Password Recovery',
  '/auth/reset-password': 'Set New Password',
  '/auth/callback': 'Authenticating...'
};

export function App() {
  const location = useLocation();

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [initialTaskDate, setInitialTaskDate] = useState('');

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState(null);

  const handleOpenNewTask = (task = null, dateStr = '') => {
    setTaskToEdit(task);
    setInitialTaskDate(dateStr);
    setTaskModalOpen(true);
  };

  const handleOpenNewSubject = (subject = null) => {
    setSubjectToEdit(subject);
    setSubjectModalOpen(true);
  };

  const isAuthRoute = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/auth/reset-password',
    '/auth/callback'
  ].includes(location.pathname);

  const currentTitle = PAGE_TITLES[location.pathname] || 'Deadline Dost';

  if (isAuthRoute) {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
        <Toast />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main">
        <Header
          title={currentTitle}
          onNewTask={() => handleOpenNewTask()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="view-container">
          <Routes>
            <Route path="/" element={<Dashboard onNewTask={handleOpenNewTask} />} />
            <Route
              path="/tasks"
              element={
                <Tasks
                  onEditTask={(t) => handleOpenNewTask(t)}
                  onNewTask={handleOpenNewTask}
                  searchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <Calendar
                  onNewTask={(t, date) => handleOpenNewTask(t, date)}
                  onEditTask={(t) => handleOpenNewTask(t)}
                />
              }
            />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/focus" element={<FocusRoom />} />
            <Route path="/notes" element={<QuickNotes />} />
            <Route path="/assistant" element={<StudyAssistant />} />
            <Route
              path="/subjects"
              element={
                <Subjects
                  onEditSubject={(s) => handleOpenNewSubject(s)}
                  onNewSubject={() => handleOpenNewSubject()}
                />
              }
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard onNewTask={handleOpenNewTask} />} />
          </Routes>
        </div>
      </main>

      {/* Modals and notifications */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        initialDate={initialTaskDate}
      />

      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        subjectToEdit={subjectToEdit}
      />

      <MigrationModal />
      <Toast />
    </div>
  );
}
export default App;
