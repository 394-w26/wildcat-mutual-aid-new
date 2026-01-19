import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utilities/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import CreateProfile from './components/CreateProfile';
import ProfileSettings from './components/ProfileSettings';
import NotificationsPage from './components/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-settings" element={<ProfileSettings />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
