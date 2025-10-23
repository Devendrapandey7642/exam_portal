import { useEffect, useState } from 'react';
import { supabase, ExamAttempt } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ResultsHistoryProps {
  onBack: () => void;
}

export default function ResultsHistory({ onBack }: ResultsHistoryProps) {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exams(title, description, passing_marks)')
        .eq('student_id', profile?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (attempt: ExamAttempt) => {
    if (attempt.status === 'in_progress') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          In Progress
        </span>
      );
    }

    if (attempt.is_passed) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          Passed
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center">
        <XCircle className="w-4 h-4 mr-1" />
        Failed
      </span>
    );
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Exam History</h2>
          <p className="text-gray-600">View your past exam attempts and results</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No exam attempts yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Your exam history will appear here after you take your first exam
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {attempt.exams?.title}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(attempt.started_at)}</p>
                  </div>
                  {getStatusBadge(attempt)}
                </div>

                {attempt.status === 'submitted' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Score</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {attempt.score}/{attempt.total_marks}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Percentage</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {Math.round((attempt.score! / attempt.total_marks) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Passing Marks</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {attempt.exams?.passing_marks}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Result</p>
                      {attempt.is_passed ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {attempt.status === 'submitted' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          attempt.is_passed ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${(attempt.score! / attempt.total_marks) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
