import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { api } from '../services/api.js';
import { storageService } from '../services/storageService.js';
import { authService } from '../services/authService.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Information' },
  { id: 'stats', label: 'Study Statistics' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'history', label: 'Activity History' },
  { id: 'settings', label: 'Account Settings' },
  { id: 'privacy', label: 'Privacy & Security' }
];

const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfileData, refreshProfile, signOut } = useAuth();
  const { showToast } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Personal Info form states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [studyGoal, setStudyGoal] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Avatar upload
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email update
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Activity history
  const [activityHistory, setActivityHistory] = useState([]);

  // Fetch verified profile and real database stats
  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await api.get('/api/profile');
        if (res.success && res.data) {
          setProfileData(res.data.profile);
          setStatsData(res.data.stats);
          updateProfileData(res.data.profile);

          // Populate form fields
          const p = res.data.profile;
          setFullName(p.full_name || '');
          setUsername(p.username || '');
          setBio(p.bio || '');
          setPhone(p.phone || '');
          setCollege(p.college || '');
          setCourse(p.course || '');
          setDepartment(p.department || '');
          setSemester(p.semester || '');
          setAcademicYear(p.academic_year || '');
          setTimezone(p.timezone || 'UTC');
          setStudyGoal(p.study_goal || '');
        }

        // Fetch activity history
        const [tasksRes, sessRes] = await Promise.allSettled([
          api.get('/api/tasks'),
          api.get('/api/sessions?limit=20')
        ]);

        const historyItems = [];
        if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
          tasksRes.value.data
            .filter(t => t.status === 'Completed' && t.done_at)
            .forEach(t => {
              historyItems.push({
                type: 'task',
                title: `Completed task: ${t.title}`,
                category: t.category,
                timestamp: t.done_at
              });
            });
        }
        if (sessRes.status === 'fulfilled' && sessRes.value.success) {
          sessRes.value.data.forEach(s => {
            historyItems.push({
              type: 'session',
              title: `Finished ${s.duration_minutes} min focus session`,
              category: 'Study',
              timestamp: s.created_at || s.started_at
            });
          });
        }

        historyItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivityHistory(historyItems.slice(0, 30));
      } else {
        // Unauthenticated demo profile
        setProfileData({
          full_name: 'Guest Scholar',
          username: 'student_demo',
          email: 'demo@deadlinedost.app',
          email_confirmed: false,
          created_at: new Date().toISOString(),
          timezone: 'UTC'
        });
        setStatsData({
          total_tasks: 8,
          completed_tasks: 2,
          pending_tasks: 6,
          overdue_tasks: 1,
          total_study_hours: 4.5,
          weekly_study_hours: 3.0,
          weekly_target_hours: 10.0,
          weekly_productivity: 30,
          current_streak: 1,
          longest_streak: 3,
          total_xp: 220,
          level: 2,
          next_level_xp: 450,
          level_progress: 48,
          achievements_count: 2
        });
      }
    } catch (err) {
      console.error('[Profile] Error loading profile details:', err);
      showToast('Could not load profile statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [user]);

  // Handle avatar upload to Supabase Storage
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const { publicUrl } = await storageService.uploadAvatar(file, user.id);
      await api.patch('/api/profile', { avatar_url: publicUrl });
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      updateProfileData({ avatar_url: publicUrl });
      showToast('Profile photo updated successfully!');
    } catch (err) {
      console.error('[Avatar] Upload error:', err);
      showToast(err.message || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      await api.patch('/api/profile', { avatar_url: null });
      setProfileData(prev => ({ ...prev, avatar_url: null }));
      updateProfileData({ avatar_url: null });
      showToast('Profile photo removed.');
    } catch (err) {
      showToast(err.message || 'Could not remove avatar.');
    }
  };

  // Save personal info edits
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to update your profile in the cloud.');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const updates = {
        full_name: fullName.trim(),
        username: username.trim() || null,
        bio: bio.trim(),
        phone: phone.trim(),
        college: college.trim(),
        course: course.trim(),
        department: department.trim(),
        semester: semester.trim(),
        academic_year: academicYear.trim(),
        timezone,
        study_goal: studyGoal.trim()
      };

      const res = await api.patch('/api/profile', updates);
      if (res.success && res.data) {
        setProfileData(prev => ({ ...prev, ...res.data }));
        updateProfileData(res.data);
        setIsEditing(false);
        showToast('Personal information updated successfully!');
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  // Password update
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      await authService.updatePassword(newPassword);
      setPasswordMsg('Password changed successfully! Keep it safe.');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated.');
    } catch (err) {
      setPasswordError(err.message || 'Could not change password.');
    }
  };

  // Email update
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMsg('');
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      await authService.updateEmail(newEmail);
      setEmailMsg(`Verification email sent to ${newEmail}. Please confirm via the link in your inbox.`);
      setNewEmail('');
      showToast('Verification email sent.');
    } catch (err) {
      setEmailError(err.message || 'Could not update email.');
    }
  };

  // Data export
  const handleExportData = async () => {
    try {
      showToast('Generating your complete academic data export...');
      const res = await api.get('/api/export');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deadline-dost-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!');
    } catch (err) {
      showToast(err.message || 'Data export failed.');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await api.post('/api/profile/delete-account', { confirmText: 'DELETE' });
      if (res.success) {
        await signOut();
        showToast('Your account and all records have been permanently deleted.');
        navigate('/signup');
      }
    } catch (err) {
      setDeleteError(err.message || 'Could not delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user && !profileData) {
    return (
      <div className="card empty">
        <h2>Please Sign In</h2>
        <p className="mu mt">Sign in or create an account to view and manage your student profile.</p>
        <button className="btn mt" onClick={() => navigate('/signin')}>
          Sign In / Register
        </button>
      </div>
    );
  }

  const avatarUrl = profileData?.avatar_url;
  const initial = ((profileData?.full_name || user?.email || 'S')[0] || 'S').toUpperCase();

  return (
    <div>
      {/* =========================================================================
          SECTION 4.1: PROFILE HEADER
          ========================================================================= */}
      <section className="card mb" style={{ padding: '24px' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: '20px' }}>
          {/* Avatar with upload overlay */}
          <div style={{ position: 'relative', flex: 'none' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="av"
                style={{ width: '84px', height: '84px', borderRadius: '50%', boxShadow: '0 0 0 4px var(--glow)' }}
              />
            ) : (
              <div
                className="av"
                style={{ width: '84px', height: '84px', fontSize: '2.2rem', boxShadow: '0 0 0 4px var(--glow)' }}
              >
                {initial}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
            />
          </div>

          {/* User Info & Identity */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2>{profileData?.full_name || 'Student'}</h2>
                <p className="mu" style={{ margin: '3px 0 6px', fontSize: '0.9rem' }}>
                  @{profileData?.username || user?.email?.split('@')[0] || 'student'} •{' '}
                  <span style={{ color: 'var(--tx)' }}>{user?.email || profileData?.email}</span>
                </p>
              </div>

              <div className="row">
                {profileData?.email_confirmed || user?.email_confirmed_at ? (
                  <span className="b Completed" title="Email verified via Supabase Auth">
                    ✓ Verified Account
                  </span>
                ) : (
                  <span className="b Urgent" title="Email verification pending">
                    ⚠️ Unverified Email
                  </span>
                )}
                {user ? (
                  <button className="ghost" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <button className="btn" onClick={() => navigate('/signup')}>
                    Create Cloud Account
                  </button>
                )}
              </div>
            </div>

            {profileData?.bio && (
              <p style={{ margin: '8px 0', fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--tx)' }}>
                {profileData.bio}
              </p>
            )}

            {/* Avatar controls */}
            {user && (
              <div className="row mt" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="ghost"
                  style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Uploading Photo...' : '📷 Change Photo'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className="ghost danger"
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                    onClick={handleRemoveAvatar}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            )}

            {/* Quick Metadata Pill Highlights */}
            <div className="row mt" style={{ gap: '8px', flexWrap: 'wrap' }}>
              <span className="b">
                📅 Member since: {profileData?.created_at ? fD(profileData.created_at) : 'Today'}
              </span>
              <span className="b" style={{ background: 'var(--soft)' }}>
                🔥 Streak: <b>{statsData?.current_streak || 0} days</b>
              </span>
              <span className="b" style={{ background: 'var(--soft)' }}>
                ⚡ Level {statsData?.level || 1} ({statsData?.total_xp || 0} XP)
              </span>
              {profileData?.college && (
                <span className="b">🏫 {profileData.college}</span>
              )}
              {profileData?.course && (
                <span className="b">🎓 {profileData.course}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4.2: PROFILE NAVIGATION TABS
          ========================================================================= */}
      <div className="row mb" style={{ borderBottom: '1px solid var(--bd)', paddingBottom: '8px', gap: '6px', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className="ghost"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              background: activeTab === tab.id ? 'var(--soft)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--sec)' : 'transparent',
              color: activeTab === tab.id ? 'var(--tx)' : 'var(--tx2)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW (ALL REAL DATABASE STATISTICS)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid g3">
            <div className="card stat">
              <b>{statsData?.total_tasks || 0}</b>
              <span>Total Tasks</span>
            </div>
            <div className="card stat">
              <b>{statsData?.completed_tasks || 0}</b>
              <span>Completed Tasks</span>
            </div>
            <div className="card stat">
              <b>{statsData?.pending_tasks || 0}</b>
              <span>Pending Tasks</span>
            </div>
            <div className="card stat">
              <b style={{ color: (statsData?.overdue_tasks || 0) > 0 ? 'var(--err)' : 'var(--ok)' }}>
                {statsData?.overdue_tasks || 0}
              </b>
              <span>Overdue Tasks</span>
            </div>
            <div className="card stat">
              <b>{statsData?.total_study_hours || 0} h</b>
              <span>Total Study Hours</span>
            </div>
            <div className="card stat">
              <b>{statsData?.current_streak || 0} days</b>
              <span>Current Streak</span>
            </div>
            <div className="card stat">
              <b>{statsData?.longest_streak || 0} days</b>
              <span>Longest Streak</span>
            </div>
            <div className="card stat">
              <b>{statsData?.weekly_productivity || 0}%</b>
              <span>Weekly Target Reach</span>
            </div>
            <div className="card stat">
              <b>{statsData?.total_xp || 0}</b>
              <span>XP Earned</span>
            </div>
          </div>

          <div className="grid g2 mt">
            {/* Level & XP Progress Card */}
            <div className="card">
              <h2>Level Progression</h2>
              <div style={{ margin: '14px 0' }}>
                <div className="row between mb">
                  <b>Level {statsData?.level || 1} Scholar</b>
                  <span className="mu">
                    {statsData?.total_xp || 0} / {statsData?.next_level_xp || 100} XP
                  </span>
                </div>
                <div className="pb">
                  <i style={{ width: `${statsData?.level_progress || 0}%` }} />
                </div>
                <p className="mu mt" style={{ fontSize: '0.82rem' }}>
                  Earn 20 XP per completed task, 10 XP per 25-minute focus session, 50 XP per subject created, and 100 XP per achievement badge!
                </p>
              </div>
            </div>

            {/* Academic Focus & Goal Card */}
            <div className="card">
              <h2>Current Academic Goal</h2>
              {profileData?.study_goal ? (
                <div style={{ background: 'var(--soft)', padding: '14px', borderRadius: '12px', margin: '12px 0' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
                    “{profileData.study_goal}”
                  </p>
                </div>
              ) : (
                <p className="empty" style={{ padding: '16px 0' }}>
                  No study goal set yet. Click Edit Profile to set your semester target!
                </p>
              )}
              <div className="row between" style={{ fontSize: '0.85rem' }}>
                <span className="mu">Timezone: <b>{profileData?.timezone || 'UTC'}</b></span>
                <span className="mu">Achievements: <b>{statsData?.achievements_count || 0} unlocked</b></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PERSONAL INFORMATION (EDITABLE)
          ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="card">
          <div className="row between mb">
            <h2>Academic & Personal Profile Information</h2>
            {!isEditing && user && (
              <button className="btn" onClick={() => setIsEditing(true)}>
                Edit Details
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSavePersonalInfo} style={{ display: 'grid', gap: '14px' }}>
              <div className="grid g2" style={{ margin: 0 }}>
                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label>
                  Username (letters, numbers, underscores)
                  <input
                    type="text"
                    maxLength={30}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    maxLength={25}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label>
                  Location / Timezone
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Asia/Kolkata or UTC"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </label>

                <label>
                  College / University
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. National Institute of Technology"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </label>

                <label>
                  Course / Degree
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. B.Tech Computer Science"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  />
                </label>

                <label>
                  Department
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Dept. of Computer Science & Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </label>

                <label>
                  Semester
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="e.g. Semester 4"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                </label>

                <label>
                  Academic Year
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="e.g. 2024-2025"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </label>
              </div>

              <label>
                Bio / About Me
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Tell us about your academic pursuits..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>

              <label>
                Study Goal
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="What is your main target for this semester? e.g. Maintain a 9.0 GPA while building full-stack projects"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                />
              </label>

              {editError && <p className="err">{editError}</p>}

              <div className="row end mt">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={editSaving}>
                  {editSaving ? 'Saving to Database...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid g2" style={{ gap: '16px' }}>
              <div>
                <span className="mu">Full Name</span>
                <p><b>{profileData?.full_name || 'Not specified'}</b></p>
              </div>
              <div>
                <span className="mu">Username</span>
                <p><b>@{profileData?.username || 'Not set'}</b></p>
              </div>
              <div>
                <span className="mu">Email Address</span>
                <p><b>{user?.email || profileData?.email}</b></p>
              </div>
              <div>
                <span className="mu">Phone Number</span>
                <p><b>{profileData?.phone || 'Not provided'}</b></p>
              </div>
              <div>
                <span className="mu">College / University</span>
                <p><b>{profileData?.college || 'Not specified'}</b></p>
              </div>
              <div>
                <span className="mu">Course / Degree</span>
                <p><b>{profileData?.course || 'Not specified'}</b></p>
              </div>
              <div>
                <span className="mu">Department</span>
                <p><b>{profileData?.department || 'Not specified'}</b></p>
              </div>
              <div>
                <span className="mu">Semester & Academic Year</span>
                <p><b>{profileData?.semester || '—'} ({profileData?.academic_year || '—'})</b></p>
              </div>
              <div>
                <span className="mu">Timezone</span>
                <p><b>{profileData?.timezone || 'UTC'}</b></p>
              </div>
              <div>
                <span className="mu">Study Goal</span>
                <p><b>{profileData?.study_goal || 'No goal set yet'}</b></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: STUDY STATISTICS (DEEP DIVE)
          ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="grid g2">
          <div className="card">
            <h2>Focus Session Metrics</h2>
            <div style={{ margin: '14px 0', lineHeight: 2 }}>
              <div className="row between">
                <span className="mu">Total Focus Hours</span>
                <b>{statsData?.total_study_hours || 0} hrs</b>
              </div>
              <div className="row between">
                <span className="mu">Weekly Target</span>
                <b>{statsData?.weekly_target_hours || 10} hrs</b>
              </div>
              <div className="row between">
                <span className="mu">Weekly Study Logged</span>
                <b>{statsData?.weekly_study_hours || 0} hrs</b>
              </div>
              <div className="row between">
                <span className="mu">Target Completion</span>
                <b>{statsData?.weekly_productivity || 0}%</b>
              </div>
            </div>
            <div className="pb">
              <i style={{ width: `${statsData?.weekly_productivity || 0}%` }} />
            </div>
          </div>

          <div className="card">
            <h2>Task Completion Breakdown</h2>
            <div style={{ margin: '14px 0', lineHeight: 2 }}>
              <div className="row between">
                <span className="mu">Total Tasks Created</span>
                <b>{statsData?.total_tasks || 0}</b>
              </div>
              <div className="row between">
                <span className="mu">Finished & Verified</span>
                <b style={{ color: 'var(--ok)' }}>{statsData?.completed_tasks || 0}</b>
              </div>
              <div className="row between">
                <span className="mu">Pending Work</span>
                <b>{statsData?.pending_tasks || 0}</b>
              </div>
              <div className="row between">
                <span className="mu">Overdue Deadlines</span>
                <b style={{ color: (statsData?.overdue_tasks || 0) > 0 ? 'var(--err)' : 'var(--tx)' }}>
                  {statsData?.overdue_tasks || 0}
                </b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ACHIEVEMENTS
          ========================================================================= */}
      {activeTab === 'achievements' && (
        <div className="card">
          <div className="row between mb">
            <h2>Unlocked Badges & Honors</h2>
            <button className="ghost" onClick={() => navigate('/achievements')}>
              View Full Trophy Room →
            </button>
          </div>
          <p className="mu">
            You have unlocked <b>{statsData?.achievements_count || 0}</b> badges based on verified task completion and study sessions.
          </p>
          <div className="grid g3 mt">
            <div className="card" style={{ background: 'var(--soft)', padding: '12px' }}>
              <b>🎯 Task Master</b>
              <p className="mu" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Complete 10 tasks</p>
            </div>
            <div className="card" style={{ background: 'var(--soft)', padding: '12px' }}>
              <b>⚡ On a Roll</b>
              <p className="mu" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Maintain a 3 day streak</p>
            </div>
            <div className="card" style={{ background: 'var(--soft)', padding: '12px' }}>
              <b>⏱️ Focused Scholar</b>
              <p className="mu" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Finish 5 focus sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ACTIVITY HISTORY (REAL TIMELINE)
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="card">
          <h2>Activity History</h2>
          <p className="mu" style={{ margin: '4px 0 14px' }}>
            A verified timeline of your completed deadlines and finished focus sessions.
          </p>

          {activityHistory.length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {activityHistory.map((item, idx) => (
                <div key={idx} className="tr">
                  <span className={`b ${item.type === 'task' ? 'Completed' : 'High'}`} style={{ width: '80px', textAlign: 'center' }}>
                    {item.type === 'task' ? 'Task Done' : 'Focus'}
                  </span>
                  <span className="t">
                    <b>{item.title}</b>
                    <br />
                    <small className="mu">{fD(item.timestamp)} at {fT(item.timestamp)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No activity records yet. Complete tasks or run focus sessions to see your activity timeline.</p>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: ACCOUNT SETTINGS
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="grid g2">
          {/* Change Password Card */}
          <div className="card">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <label>
                New Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                />
              </label>

              {passwordError && <p className="err">{passwordError}</p>}
              {passwordMsg && <p style={{ color: 'var(--ok)', margin: 0, fontWeight: 600 }}>{passwordMsg}</p>}

              <button type="submit" className="btn mt">
                Update Password
              </button>
            </form>
          </div>

          {/* Update Email Card */}
          <div className="card">
            <h2>Update Email Address</h2>
            <p className="mu" style={{ margin: '4px 0 12px', fontSize: '0.85rem' }}>
              Current email: <b>{user?.email}</b>
              <br />
              Updating your email sends a verification link to your new address to confirm ownership.
            </p>

            <form onSubmit={handleUpdateEmail} style={{ display: 'grid', gap: '12px' }}>
              <label>
                New Email Address
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@university.edu"
                />
              </label>

              {emailError && <p className="err">{emailError}</p>}
              {emailMsg && <p style={{ color: 'var(--ok)', margin: 0, fontWeight: 600 }}>{emailMsg}</p>}

              <button type="submit" className="btn mt">
                Send Verification Email
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: PRIVACY AND SECURITY
          ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="grid g2">
          {/* Data Export & Sessions Card */}
          <div className="card">
            <h2>Data Ownership & Export</h2>
            <p className="mu" style={{ margin: '6px 0 14px', lineHeight: 1.6 }}>
              You own your academic records. Download a complete JSON snapshot of all your tasks, subtasks, subjects, study sessions, timetable, notes, and profile details anytime.
            </p>
            <button className="btn" onClick={handleExportData}>
              📥 Export My Personal Data (JSON)
            </button>

            <h3 className="mt" style={{ paddingTop: '14px', borderTop: '1px solid var(--bd)' }}>
              Active Sessions
            </h3>
            <p className="mu" style={{ fontSize: '0.85rem' }}>
              Authenticated via Supabase JWT token. Tokens refresh automatically and expire securely after inactivity.
            </p>
            <button className="ghost danger" onClick={signOut}>
              Sign Out of This Device
            </button>
          </div>

          {/* Delete Account Card */}
          <div className="card" style={{ borderColor: 'var(--err)' }}>
            <h2 style={{ color: 'var(--err)' }}>Danger Zone: Delete Account</h2>
            <p style={{ margin: '8px 0 14px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Permanently delete your Deadline Dost account and all cloud records.
              This removes your profile, tasks, subjects, sessions, timetable, and notes completely from PostgreSQL via cascade deletion.
            </p>
            <button
              className="btn danger"
              style={{ background: 'var(--err)', color: '#fff' }}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete My Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Explicit Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmationInput('');
          setDeleteError('');
        }}
        onConfirm={handleDeleteAccount}
        title="Permanently Delete Account?"
        message={
          <div>
            <p>
              This is an irreversible operation. All your academic progress, tasks, timetable entries, and study history will be permanently wiped from the database.
            </p>
            <label style={{ marginTop: '12px' }}>
              Type <b>DELETE</b> in all caps to confirm:
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                style={{ marginTop: '6px' }}
              />
            </label>
            {deleteError && <p className="err">{deleteError}</p>}
          </div>
        }
        confirmText={isDeleting ? 'Deleting...' : 'Delete Everything'}
      />
    </div>
  );
}
