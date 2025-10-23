import { useEffect, useState } from 'react';
import { supabase, Exam, Question } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Edit, Trash2, Save } from 'lucide-react';

interface ManageExamProps {
  exam: Exam | null;
  onBack: () => void;
}

export default function ManageExam({ exam, onBack }: ManageExamProps) {
  const [title, setTitle] = useState(exam?.title || '');
  const [description, setDescription] = useState(exam?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(exam?.duration_minutes || 60);
  const [totalMarks, setTotalMarks] = useState(exam?.total_marks || 100);
  const [passingMarks, setPassingMarks] = useState(exam?.passing_marks || 40);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (exam) {
      fetchQuestions();
    }
  }, [exam]);

  const fetchQuestions = async () => {
    if (!exam) return;

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSaveExam = async () => {
    setSaving(true);
    try {
      const examData = {
        title,
        description,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        created_by: profile?.id,
      };

      if (exam) {
        const { error } = await supabase.from('exams').update(examData).eq('id', exam.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('exams').insert(examData).select().single();
        if (error) throw error;
        window.location.reload();
      }

      alert('Exam saved successfully!');
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {exam ? 'Edit Exam' : 'Create New Exam'}
          </h2>
          <p className="text-gray-600">Configure exam details and add questions</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Exam Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Mathematics Final Exam"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Brief description of the exam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Marks *
              </label>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                min="1"
                max={totalMarks}
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveExam}
              disabled={saving || !title}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Exam Details'}</span>
            </button>
          </div>
        </div>

        {exam && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Questions</h3>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQuestionForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add Question</span>
              </button>
            </div>

            {showQuestionForm && (
              <QuestionForm
                examId={exam.id}
                question={editingQuestion}
                onSave={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                  fetchQuestions();
                }}
                onCancel={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                }}
              />
            )}

            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No questions added yet. Click "Add Question" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          Q{index + 1}. {question.question_text}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">A. {question.option_a}</p>
                          <p className="text-gray-600">B. {question.option_b}</p>
                          <p className="text-gray-600">C. {question.option_c}</p>
                          <p className="text-gray-600">D. {question.option_d}</p>
                        </div>
                        <p className="text-green-600 text-sm mt-2">
                          Correct Answer: {question.correct_answer.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {question.marks} marks
                        </span>
                        <button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowQuestionForm(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface QuestionFormProps {
  examId: string;
  question: Question | null;
  onSave: () => void;
  onCancel: () => void;
}

function QuestionForm({ examId, question, onSave, onCancel }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [optionA, setOptionA] = useState(question?.option_a || '');
  const [optionB, setOptionB] = useState(question?.option_b || '');
  const [optionC, setOptionC] = useState(question?.option_c || '');
  const [optionD, setOptionD] = useState(question?.option_d || '');
  const [correctAnswer, setCorrectAnswer] = useState<'a' | 'b' | 'c' | 'd'>(
    question?.correct_answer || 'a'
  );
  const [marks, setMarks] = useState(question?.marks || 1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const questionData = {
        exam_id: examId,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        marks,
      };

      if (question) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert(questionData);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
      <h4 className="font-bold text-gray-800 mb-4">
        {question ? 'Edit Question' : 'New Question'}
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Option A *</label>
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Option B *</label>
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Option C *</label>
            <input
              type="text"
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Option D *</label>
            <input
              type="text"
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value as 'a' | 'b' | 'c' | 'd')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marks *</label>
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              min="1"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
