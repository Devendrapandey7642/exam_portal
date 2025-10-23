import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ExamTaking from './components/ExamTaking';
import ManageExam from './components/ManageExam';
import ResultsHistory from './components/ResultsHistory';
import { Exam } from './lib/supabase';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam' | 'manage' | 'history'>('dashboard');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (currentView === 'exam' && selectedExam) {
    return (
      <ExamTaking
        exam={selectedExam}
        onComplete={() => {
          setCurrentView('history');
          setSelectedExam(null);
        }}
      />
    );
  }

  if (currentView === 'manage') {
    return (
      <ManageExam
        exam={selectedExam}
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedExam(null);
        }}
      />
    );
  }

  if (currentView === 'history') {
    return <ResultsHistory onBack={() => setCurrentView('dashboard')} />;
  }

  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        onManageExam={(exam) => {
          setSelectedExam(exam);
          setCurrentView('manage');
        }}
      />
    );
  }

  return (
    <StudentDashboard
      onStartExam={(exam) => {
        setSelectedExam(exam);
        setCurrentView('exam');
      }}
      onViewHistory={() => setCurrentView('history')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
