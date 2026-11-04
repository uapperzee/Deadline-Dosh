import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { api } from '../services/api.js';

const BADGE_DEFS = [
  { key: 'first_step', title: 'First step', description: 'Complete 1 task', goal: 1 },
  { key: 'task_master', title: 'Task master', description: 'Complete 10 tasks', goal: 10 },
  { key: 'deadline_hero', title: 'Deadline hero', description: 'Complete 25 tasks', goal: 25 },
  { key: 'on_a_roll', title: 'On a roll', description: 'Keep a 3 day streak', goal: 3 },
  { key: 'unstoppable', title: 'Unstoppable', description: 'Keep a 7 day streak', goal: 7 },
  { key: 'focused', title: 'Focused', description: 'Finish 5 focus sessions', goal: 5 },
  { key: 'deep_worker', title: 'Deep worker', description: 'Focus for 10 hours', goal: 10 },
  { key: 'organised', title: 'Organised', description: 'Add 3 subjects', goal: 3 },
  { key: 'timetable_builder', title: 'Timetable builder', description: 'Fill 10 timetable slots', goal: 10 }
];

const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export function Achievements() {
  const { user } = useAuth();
  const { tasks, sessions, subjects, timetable } = useData();

  const [badgeList, setBadgeList] = useState([]);
  const [xpData, setXpData] = useState(null);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/api/achievements')
        .then(res => {
          if (res.success && res.data) {
            setBadgeList(res.data.badges);
            setEarnedCount(res.data.earned_count);
            setXpData(res.data.xp);
          }
        })
        .catch(err => {
          console.warn('[Achievements] Error fetching:', err.message);
        });
    } else {
      // Local fallback calculation
      const done = tasks.filter(t => t.status === 'Completed').length;
      const sessCount = sessions.length;
      const totalMins = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const hours = Math.floor(totalMins / 60);
      const subjs = subjects.length;
      const ttFilled = Object.values(timetable || {}).filter(Boolean).length;

      const list = BADGE_DEFS.map(b => {
        let current = 0;
        if (b.key === 'first_step' || b.key === 'task_master' || b.key === 'deadline_hero') current = done;
        else if (b.key === 'on_a_roll' || b.key === 'unstoppable') current = 1;
        else if (b.key === 'focused') current = sessCount;
        else if (b.key === 'deep_worker') current = hours;
        else if (b.key === 'organised') current = subjs;
        else if (b.key === 'timetable_builder') current = ttFilled;

        const isEarned = current >= b.goal;
        return {
          ...b,
          current,
          percent: Math.min(100, Math.round((current / b.goal) * 100)),
          is_earned: isEarned,
          unlocked_at: isEarned ? new Date().toISOString() : null
        };
      });

      const earned = list.filter(b => b.is_earned).length;
      setBadgeList(list);
      setEarnedCount(earned);
      setXpData({
        totalXP: done * 20 + sessCount * 10 + subjs * 50 + earned * 100,
        level: Math.floor(Math.sqrt((done * 20 + sessCount * 10) / 50)) + 1,
        progressPercent: 40
      });
    }
  }, [user, tasks, sessions, subjects, timetable]);

  const totalBadges = badgeList.length || BADGE_DEFS.length;
  const overallPercent = totalBadges ? Math.round((earnedCount / totalBadges) * 100) : 0;

  return (
    <div>
      {/* Banner Card */}
      <div className="card mb">
        <div className="row between">
          <div>
            <h2>{earnedCount} of {totalBadges} Badges Earned</h2>
            <p className="mu" style={{ margin: '4px 0 0' }}>
              Level {xpData?.level || 1} Scholar • {xpData?.totalXP || 0} Total XP Earned
            </p>
          </div>
          <span className="b" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            {overallPercent}% Complete
          </span>
        </div>

        <div className="pb mt">
          <i style={{ width: `${overallPercent}%` }} />
        </div>

        <p className="mu mt" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
          A day counts toward your streak when you finish a genuine focus session or mark an active task complete. Opening the application or viewing sample data never counts, and earned badges stay earned permanently.
        </p>
      </div>

      {/* Badges Grid */}
      <div className="grid g2">
        {badgeList.map(b => (
          <div key={b.key || b.title} className={`card badge ${b.is_earned ? 'on' : ''}`}>
            <span className="medal" aria-hidden="true">
              {b.is_earned ? '★' : '☆'}
            </span>
            <div>
              <h3>{b.title}</h3>
              <p className="mu" style={{ margin: '2px 0 6px' }}>{b.description}</p>
              <div className="pb">
                <i style={{ width: `${b.percent}%` }} />
              </div>
              <small className="mu">
                {b.is_earned
                  ? `Earned ${b.unlocked_at ? fD(b.unlocked_at) : 'recently'}`
                  : `${Math.min(b.current, b.goal)} of ${b.goal} completed`}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
