import { AuthProvider, useAuth } from './utilities/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

const AppContent = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthPage />;
  }

  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
