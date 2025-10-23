from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "message": "Exam Portal API is running"})

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        role = data.get('role', 'student')

        if not email or not password or not full_name:
            return jsonify({"error": "Missing required fields"}), 400

        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })

        if auth_response.user:
            profile_data = {
                "id": auth_response.user.id,
                "email": email,
                "full_name": full_name,
                "role": role
            }
            supabase.table('profiles').insert(profile_data).execute()

            return jsonify({
                "message": "Registration successful",
                "user": {
                    "id": auth_response.user.id,
                    "email": email,
                    "full_name": full_name,
                    "role": role
                }
            }), 201
        else:
            return jsonify({"error": "Registration failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if auth_response.user:
            profile = supabase.table('profiles').select('*').eq('id', auth_response.user.id).single().execute()

            return jsonify({
                "message": "Login successful",
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token
                },
                "user": profile.data
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/api/exams', methods=['GET'])
def get_exams():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        supabase.auth.set_session(token, token)
        response = supabase.table('exams').select('*').eq('is_active', True).execute()

        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams', methods=['POST'])
def create_exam():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        user = supabase.auth.get_user(token)

        exam_data = {
            "title": data.get('title'),
            "description": data.get('description'),
            "duration_minutes": data.get('duration_minutes', 60),
            "total_marks": data.get('total_marks', 100),
            "passing_marks": data.get('passing_marks', 40),
            "is_active": data.get('is_active', True),
            "created_by": user.user.id
        }

        response = supabase.table('exams').insert(exam_data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/<exam_id>', methods=['PUT'])
def update_exam(exam_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        response = supabase.table('exams').update(data).eq('id', exam_id).execute()

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/<exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        supabase.table('exams').delete().eq('id', exam_id).execute()
        return jsonify({"message": "Exam deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/<exam_id>/questions', methods=['GET'])
def get_questions(exam_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        response = supabase.table('questions').select('*').eq('exam_id', exam_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questions', methods=['POST'])
def create_question():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        response = supabase.table('questions').insert(data).execute()

        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questions/<question_id>', methods=['PUT'])
def update_question(question_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        response = supabase.table('questions').update(data).eq('id', question_id).execute()

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questions/<question_id>', methods=['DELETE'])
def delete_question(question_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        supabase.table('questions').delete().eq('id', question_id).execute()
        return jsonify({"message": "Question deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/<exam_id>/start', methods=['POST'])
def start_exam(exam_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        user = supabase.auth.get_user(token)
        exam = supabase.table('exams').select('*').eq('id', exam_id).single().execute()

        attempt_data = {
            "exam_id": exam_id,
            "student_id": user.user.id,
            "total_marks": exam.data['total_marks'],
            "status": "in_progress"
        }

        response = supabase.table('exam_attempts').insert(attempt_data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/attempts/<attempt_id>/submit-answer', methods=['POST'])
def submit_answer(attempt_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        question_id = data.get('question_id')
        selected_answer = data.get('selected_answer')

        question = supabase.table('questions').select('*').eq('id', question_id).single().execute()
        is_correct = question.data['correct_answer'] == selected_answer
        marks_obtained = question.data['marks'] if is_correct else 0

        answer_data = {
            "attempt_id": attempt_id,
            "question_id": question_id,
            "selected_answer": selected_answer,
            "is_correct": is_correct,
            "marks_obtained": marks_obtained
        }

        response = supabase.table('student_answers').upsert(answer_data).execute()
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/attempts/<attempt_id>/submit', methods=['POST'])
def submit_exam(attempt_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        answers = supabase.table('student_answers').select('marks_obtained').eq('attempt_id', attempt_id).execute()
        total_score = sum(answer['marks_obtained'] for answer in answers.data)

        attempt = supabase.table('exam_attempts').select('*, exams(passing_marks)').eq('id', attempt_id).single().execute()
        passing_marks = attempt.data['exams']['passing_marks']
        is_passed = total_score >= passing_marks

        update_data = {
            "submitted_at": datetime.utcnow().isoformat(),
            "score": total_score,
            "is_passed": is_passed,
            "status": "submitted"
        }

        response = supabase.table('exam_attempts').update(update_data).eq('id', attempt_id).execute()
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/my-attempts', methods=['GET'])
def get_my_attempts():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        user = supabase.auth.get_user(token)
        response = supabase.table('exam_attempts').select('*, exams(title, description)').eq('student_id', user.user.id).order('started_at', desc=True).execute()

        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/attempts/<attempt_id>', methods=['GET'])
def get_attempt_details(attempt_id):
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        attempt = supabase.table('exam_attempts').select('*').eq('id', attempt_id).single().execute()
        answers = supabase.table('student_answers').select('*, questions(question_text, option_a, option_b, option_c, option_d, correct_answer)').eq('attempt_id', attempt_id).execute()

        return jsonify({
            "attempt": attempt.data,
            "answers": answers.data
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
