# Exam Portal Backend

Flask REST API for the Exam Management System.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Exams
- GET `/api/exams` - Get all active exams
- POST `/api/exams` - Create new exam (Admin only)
- PUT `/api/exams/<exam_id>` - Update exam (Admin only)
- DELETE `/api/exams/<exam_id>` - Delete exam (Admin only)

### Questions
- GET `/api/exams/<exam_id>/questions` - Get all questions for an exam
- POST `/api/questions` - Create new question (Admin only)
- PUT `/api/questions/<question_id>` - Update question (Admin only)
- DELETE `/api/questions/<question_id>` - Delete question (Admin only)

### Exam Attempts
- POST `/api/exams/<exam_id>/start` - Start an exam attempt
- POST `/api/attempts/<attempt_id>/submit-answer` - Submit answer for a question
- POST `/api/attempts/<attempt_id>/submit` - Submit complete exam
- GET `/api/my-attempts` - Get all attempts for logged-in user
- GET `/api/attempts/<attempt_id>` - Get attempt details with answers
