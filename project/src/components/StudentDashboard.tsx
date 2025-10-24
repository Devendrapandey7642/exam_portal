import { useEffect, useState } from 'react';
import { supabase, Exam, ExamAttempt } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, Trophy, LogOut, History } from 'lucide-react';

interface StudentDashboardProps {
  onStartExam: (exam: Exam) => void;
  onViewHistory: () => void;
}

export default function StudentDashboard({ onStartExam, onViewHistory }: StudentDashboardProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, signOut } = useAuth();

  useEffect(() => {
    fetchExams();
    fetchAttempts();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('exam_id')
        .eq('student_id', profile?.id);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const hasAttempted = (examId: string) => {
    return attempts.some(attempt => attempt.exam_id === examId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Exam Portal</h1>
                <p className="text-xs text-gray-500">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <button
                onClick={onViewHistory}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Available Exams</h2>
          <p className="text-gray-600 text-sm sm:text-base">Select an exam to start</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No exams available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 sm:p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 truncate">{exam.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{exam.description}</p>
                  </div>
                  {hasAttempted(exam.id) && (
                    <span className="flex-shrink-0 ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Attempted
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                    <span>{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                    <span className="truncate">{exam.total_marks} marks (Pass: {exam.passing_marks})</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartExam(exam)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
