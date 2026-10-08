import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages (will implement soon)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import WorkoutPlan from './pages/WorkoutPlan';
import WorkoutLogger from './pages/WorkoutLogger';
import Coverage from './pages/Coverage';
import Body from './pages/Body';
import Nutrition from './pages/Nutrition';
import Coach from './pages/Coach';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="plan" element={<WorkoutPlan />} />
          <Route path="workout" element={<WorkoutLogger />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="body" element={<Body />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="coach" element={<Coach />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
