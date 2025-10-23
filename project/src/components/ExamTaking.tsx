import { useEffect, useState } from 'react';
import { supabase, Exam, Question, ExamAttempt } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface ExamTakingProps {
  exam: Exam;
  onComplete: () => void;
}

export default function ExamTaking({ exam, onComplete }: ExamTakingProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>({});
  const [attemptId, setAttemptId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    startExam();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const startExam = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: exam.id,
          student_id: profile?.id,
          total_marks: exam.total_marks,
          status: 'in_progress',
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attemptData.id);
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionId: string, answer: 'a' | 'b' | 'c' | 'd') => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correct_answer === answer;
    const marksObtained = isCorrect ? question.marks : 0;

    try {
      await supabase
        .from('student_answers')
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_answer: answer,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
        });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: answersData } = await supabase
        .from('student_answers')
        .select('marks_obtained')
        .eq('attempt_id', attemptId);

      const totalScore = answersData?.reduce((sum, ans) => sum + ans.marks_obtained, 0) || 0;
      const isPassed = totalScore >= exam.passing_marks;

      await supabase
        .from('exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          score: totalScore,
          is_passed: isPassed,
          status: 'submitted',
        })
        .eq('id', attemptId);

      onComplete();
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Answered</p>
                <p className="text-lg font-bold text-gray-800">
                  {answeredCount}/{questions.length}
                </p>
              </div>
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex-1">
                  {currentQuestion.question_text}
                </h2>
                <span className="flex-shrink-0 ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {['a', 'b', 'c', 'd'].map((option) => {
                const optionText = currentQuestion[`option_${option}` as keyof Question] as string;
                const isSelected = answers[currentQuestion.id] === option;

                return (
                  <button
                    key={option}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.id, option as 'a' | 'b' | 'c' | 'd')
                    }
                    className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 text-gray-400'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700 mr-2">
                          {option.toUpperCase()}.
                        </span>
                        <span className="text-gray-800">{optionText}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-lg font-semibold transition ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[questions[index].id]
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Next
                </button>
              )}
            </div>

            {answeredCount < questions.length && currentQuestionIndex === questions.length - 1 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800 text-sm">
                  You have unanswered questions. Review your answers before submitting.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
