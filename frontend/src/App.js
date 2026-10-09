import { Route, Routes } from 'react-router-dom';
import './App.css';
import TopBar from './components/layout/TopBar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './components/layout/MainLayout';
import LiveScorePage from './components/livescore/LiveScore';
import LiveStreamPage from './components/livestream/LiveStreamList';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StreamPage from './pages/StreamPage';

import ProfilePage from './pages/ProfilePage';

import Error404Page from './pages/Error404Page';
import AboutPage from './pages/AboutPage';
import PolicyPage from './pages/PolicyPage';
import DisclaimerPage from './pages/DisclaimerPage';

import AdminLayout from './components/admin/AdminLayout';
import AdminAdsPage from './pages/admin/AdminAdsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStreamsPage from './pages/admin/AdminStreamsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminScrapePage from './pages/admin/AdminScrapePage';

function App() {
  return (
    <div className="App">
      <TopBar />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LiveStreamPage />} />
          <Route path="/schedule" element={<LiveScorePage />} />
          <Route path="/stream" element={<LiveStreamPage />} />
        </Route>

        <Route path="/stream/:id" element={<StreamPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute isAdminRoute={true} />}>
          <Route path="/xadmin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="streams" element={<AdminStreamsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ads" element={<AdminAdsPage />} />
            <Route path="scraper" element={<AdminScrapePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Error404Page />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;