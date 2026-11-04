-- ==============================================================================
-- DEADLINE DOST - SAMPLE SEED DATA SCRIPT
-- Seed: 001_seed_sample_data.sql
-- Description: Provides sample academic data (subjects, tasks, sessions)
--              for testing when a demo or test user account is created.
-- ==============================================================================

-- Replace 'YOUR_USER_ID_HERE' with an actual user UUID from auth.users or profiles
DO $$
DECLARE
    target_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Substitute with actual user UUID
    subj_ds UUID := gen_random_uuid();
    subj_ma UUID := gen_random_uuid();
    subj_ec UUID := gen_random_uuid();
    subj_hs UUID := gen_random_uuid();
    task_1 UUID := gen_random_uuid();
    task_2 UUID := gen_random_uuid();
BEGIN
    -- Verify user exists before seeding
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN

        -- Seed Subjects
        INSERT INTO public.subjects (id, user_id, name, code, color, teacher, semester, target_grade)
        VALUES
            (subj_ds, target_user_id, 'Data Structures', 'CS201', '#6F8F72', 'Prof. Sharma', 'Semester 3', 'A'),
            (subj_ma, target_user_id, 'Engineering Maths', 'MA102', '#B88A3B', 'Dr. Verma', 'Semester 3', 'A+'),
            (subj_ec, target_user_id, 'Digital Electronics', 'EC110', '#5E8CA8', 'Prof. Nair', 'Semester 3', 'B+'),
            (subj_hs, target_user_id, 'Communication Skills', 'HS101', '#A06C8C', 'Dr. Sen', 'Semester 3', 'A')
        ON CONFLICT DO NOTHING;

        -- Seed Tasks
        INSERT INTO public.tasks (id, user_id, subject_id, title, description, category, due_date, priority, status, estimated_minutes)
        VALUES
            (task_1, target_user_id, subj_ds, 'Linked list assignment', 'Implement insert, delete and reverse functions with test cases', 'Assignment', NOW() + INTERVAL '1 day', 'High', 'In Progress', 120),
            (task_2, target_user_id, subj_ma, 'Maths mid-semester exam', 'Covers Differential Calculus, Linear Algebra, and Fourier Transforms', 'Exam', NOW() + INTERVAL '5 days', 'Urgent', 'To Do', 180),
            (gen_random_uuid(), target_user_id, subj_ds, 'Lecture: trees and graphs', 'Review lecture recording and prepare summary notes', 'Lecture', NOW() + INTERVAL '2 hours', 'Medium', 'To Do', 60),
            (gen_random_uuid(), target_user_id, subj_ec, 'Digital electronics lab record', 'Complete circuit diagrams and truth tables for experiment 4', 'Assignment', NOW() + INTERVAL '12 hours', 'High', 'To Do', 90),
            (gen_random_uuid(), target_user_id, subj_hs, 'Presentation slides', 'Prepare 10 slides on technical communication ethics', 'Assignment', NOW() + INTERVAL '3 days', 'Medium', 'To Do', 60),
            (gen_random_uuid(), target_user_id, subj_ma, 'Revise unit 2 notes', 'Focus on eigenvalue proofs and matrix diagonalization', 'Study', NOW() + INTERVAL '8 hours', 'Low', 'To Do', 45)
        ON CONFLICT DO NOTHING;

        -- Seed Subtasks for Task 1
        INSERT INTO public.subtasks (task_id, user_id, title, is_completed, position)
        VALUES
            (task_1, target_user_id, 'Implement insert and delete', TRUE, 0),
            (task_1, target_user_id, 'Write test cases', FALSE, 1),
            (task_1, target_user_id, 'Format report & submit PDF', FALSE, 2)
        ON CONFLICT DO NOTHING;

        -- Seed Study Sessions
        INSERT INTO public.study_sessions (user_id, task_id, duration_minutes, session_type, created_at)
        VALUES
            (target_user_id, task_1, 50, 'focus', NOW() - INTERVAL '1 day'),
            (target_user_id, task_1, 25, 'focus', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'),
            (target_user_id, task_2, 75, 'focus', NOW() - INTERVAL '2 days'),
            (target_user_id, task_2, 50, 'focus', NOW() - INTERVAL '3 days')
        ON CONFLICT DO NOTHING;

        -- Seed Timetable
        INSERT INTO public.timetable_entries (user_id, slot_row, day_col, content)
        VALUES
            (target_user_id, 0, 0, 'CS201 Lecture'),
            (target_user_id, 1, 0, 'MA102 Tutorial'),
            (target_user_id, 2, 1, 'EC110 Lab'),
            (target_user_id, 3, 2, 'CS201 Lab'),
            (target_user_id, 1, 3, 'HS101 Seminar')
        ON CONFLICT (user_id, slot_row, day_col) DO UPDATE SET content = EXCLUDED.content;

    END IF;
END $$;
