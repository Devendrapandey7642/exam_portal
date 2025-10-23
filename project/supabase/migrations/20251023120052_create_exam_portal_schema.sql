/*
  # Exam Portal Database Schema

  ## Overview
  Complete database schema for an online exam management system with user authentication,
  exam management, question bank, and result tracking.

  ## Tables Created

  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'student' or 'admin'
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. exams
  Stores exam/test information
  - `id` (uuid, primary key) - Unique exam identifier
  - `title` (text) - Exam title/name
  - `description` (text) - Exam description
  - `duration_minutes` (integer) - Exam duration in minutes
  - `total_marks` (integer) - Total marks for the exam
  - `passing_marks` (integer) - Minimum marks to pass
  - `is_active` (boolean) - Whether exam is currently active
  - `created_by` (uuid) - Admin who created the exam
  - `created_at` (timestamptz) - Exam creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. questions
  Stores MCQ questions for exams
  - `id` (uuid, primary key) - Unique question identifier
  - `exam_id` (uuid) - Foreign key to exams table
  - `question_text` (text) - The question content
  - `option_a` (text) - First option
  - `option_b` (text) - Second option
  - `option_c` (text) - Third option
  - `option_d` (text) - Fourth option
  - `correct_answer` (text) - Correct answer (a, b, c, or d)
  - `marks` (integer) - Marks for this question
  - `created_at` (timestamptz) - Question creation timestamp

  ### 4. exam_attempts
  Tracks student exam attempts
  - `id` (uuid, primary key) - Unique attempt identifier
  - `exam_id` (uuid) - Foreign key to exams table
  - `student_id` (uuid) - Foreign key to profiles table
  - `started_at` (timestamptz) - When exam was started
  - `submitted_at` (timestamptz, nullable) - When exam was submitted
  - `score` (integer, nullable) - Final score achieved
  - `total_marks` (integer) - Total marks for the exam
  - `is_passed` (boolean, nullable) - Whether student passed
  - `status` (text) - Attempt status: 'in_progress', 'submitted', 'expired'

  ### 5. student_answers
  Stores individual answers submitted by students
  - `id` (uuid, primary key) - Unique answer identifier
  - `attempt_id` (uuid) - Foreign key to exam_attempts table
  - `question_id` (uuid) - Foreign key to questions table
  - `selected_answer` (text) - Student's selected answer (a, b, c, or d)
  - `is_correct` (boolean) - Whether answer is correct
  - `marks_obtained` (integer) - Marks obtained for this answer
  - `answered_at` (timestamptz) - When answer was submitted

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Students can only view their own attempts and answers
  - Admins can manage exams, questions, and view all results
  - Public can register as students
  - Authenticated users can view active exams

  ## Indexes
  - Foreign key indexes for optimal query performance
  - Index on exam_attempts for student history queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  total_marks integer NOT NULL DEFAULT 100,
  passing_marks integer NOT NULL DEFAULT 40,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  marks integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  score integer,
  total_marks integer NOT NULL,
  is_passed boolean,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  UNIQUE(exam_id, student_id, started_at)
);

ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Create student_answers table
CREATE TABLE IF NOT EXISTS student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct boolean NOT NULL,
  marks_obtained integer NOT NULL DEFAULT 0,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can create a profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for exams table
CREATE POLICY "Anyone authenticated can view active exams"
  ON exams FOR SELECT
  TO authenticated
  USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Admins can create exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update their own exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete their own exams"
  ON exams FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for questions table
CREATE POLICY "Students can view questions for active exams"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND exams.is_active = true
    )
  );

CREATE POLICY "Admins can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for exam_attempts table
CREATE POLICY "Students can view their own attempts"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create their own attempts"
  ON exam_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own attempts"
  ON exam_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can view all attempts"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for student_answers table
CREATE POLICY "Students can view their own answers"
  ON student_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = student_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can create their own answers"
  ON student_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = student_answers.attempt_id
      AND exam_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all answers"
  ON student_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );