# Exam Portal - Full Stack Application

A comprehensive online exam management system built with React.js and Flask, featuring role-based access control, timed exams, and automatic grading.

## Features

### Student Features
- 🔐 User registration and authentication
- 📝 Browse available exams
- ⏱️ Take timed exams with auto-submit
- ✅ Real-time answer saving
- 📊 View exam results and history
- 🏆 Pass/fail status with detailed scoring

### Admin Features
- 👤 Admin dashboard
- ➕ Create and manage exams
- ❓ Add, edit, and delete questions
- 🔄 Toggle exam active/inactive status
- 📋 Configure exam duration, marks, and passing criteria
- 🗑️ Delete exams and questions

### Technical Features
- Real-time countdown timer with auto-submit
- Multiple choice questions (MCQ) support
- Secure authentication with Supabase
- Row Level Security (RLS) for data protection
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Tech Stack

### Frontend
- React.js 18
- TypeScript
- Tailwind CSS
- Vite (build tool)
- Supabase Client
- Lucide React (icons)

### Backend
- Python Flask
- Flask-CORS
- Supabase (PostgreSQL database)
- JWT Authentication

### Database
- Supabase (PostgreSQL)
- Row Level Security enabled
- Real-time capabilities

## Project Structure

```
exam-portal/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Backend environment variables
│   └── README.md          # Backend documentation
├── src/
│   ├── components/
│   │   ├── Login.tsx           # Authentication component
│   │   ├── StudentDashboard.tsx # Student home page
│   │   ├── AdminDashboard.tsx   # Admin home page
│   │   ├── ExamTaking.tsx       # Exam interface with timer
│   │   ├── ManageExam.tsx       # Exam and question management
│   │   └── ResultsHistory.tsx   # Results and history view
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   └── supabase.ts        # Supabase client and types
│   ├── App.tsx               # Main application component
│   └── main.tsx             # Application entry point
├── supabase/
│   └── migrations/          # Database migrations
└── package.json            # Node dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Supabase account (database is already configured)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. The environment variables are already configured in `.env`

3. Start the development server (this runs automatically):
```bash
npm run dev
```

The application will be available at the local development URL.

### Backend Setup (Optional)

The frontend communicates directly with Supabase, but if you want to use the Flask backend:

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The API will run on http://localhost:5000

## Database Schema

### Tables

**profiles** - Extended user information
- Links to Supabase auth.users
- Stores role (student/admin) and full name

**exams** - Exam information
- Title, description, duration
- Total marks and passing marks
- Active/inactive status

**questions** - MCQ questions
- Question text and four options
- Correct answer and marks
- Linked to exams

**exam_attempts** - Student exam sessions
- Start and submit timestamps
- Score and pass/fail status
- Linked to students and exams

**student_answers** - Individual answers
- Selected answer and correctness
- Marks obtained per question
- Linked to attempts and questions

## Usage Guide

### For Students

1. **Register/Login**: Create an account with student role or login
2. **Browse Exams**: View all available active exams on the dashboard
3. **Start Exam**: Click "Start Exam" to begin a timed test
4. **Answer Questions**: Select answers for each question (saves automatically)
5. **Navigate**: Use Previous/Next buttons or question numbers to navigate
6. **Submit**: Click "Submit Exam" when finished or wait for auto-submit
7. **View Results**: Check your score, percentage, and pass/fail status
8. **History**: Access past exam attempts and results

### For Admins

1. **Register/Login**: Create an account with admin role or login
2. **Create Exam**: Click "Create New Exam" and fill in details
3. **Add Questions**: After creating exam, add MCQ questions with options
4. **Edit Questions**: Modify existing questions or delete them
5. **Manage Status**: Toggle exams between active and inactive
6. **Delete**: Remove exams or questions as needed

## Security Features

- Row Level Security (RLS) on all database tables
- Students can only access their own data
- Admins can only manage their own exams
- Authentication required for all operations
- Secure password handling with Supabase Auth
- Protected API endpoints

## Features in Detail

### Exam Timer
- Countdown timer visible during exam
- Warning when less than 5 minutes remain
- Automatic submission when time expires
- Timer persists across question navigation

### Auto-Save
- Answers saved immediately when selected
- No data loss if browser closes
- Resume capability (for future enhancement)

### Instant Grading
- Automatic scoring on submission
- Correct/incorrect answer tracking
- Pass/fail determination based on criteria

### Responsive Design
- Mobile-friendly interface
- Tablet and desktop optimized
- Consistent experience across devices

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (backend/.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FLASK_ENV=development
```

## Future Enhancements

- [ ] Essay/subjective question types
- [ ] Question bank and random question selection
- [ ] Detailed answer explanations
- [ ] Performance analytics and charts
- [ ] Exam scheduling with start/end dates
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Bulk question import (CSV/Excel)
- [ ] Question categories and difficulty levels
- [ ] Practice mode (non-graded)

## License

MIT License

## Support

For issues or questions, please refer to the documentation or contact the development team.
