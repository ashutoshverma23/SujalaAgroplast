import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import AdminLayout from './layouts/AdminLayout';
import DealerLayout from './layouts/DealerLayout';
import StaffLayout from './layouts/StaffLayout';
import OrganizationLayout from './layouts/OrganizationLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>} />
        <Route path="/dealer" element={<ProtectedRoute role="DEALER"><DealerLayout /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute role="STAFF"><StaffLayout /></ProtectedRoute>} /> 
        <Route path="/org" element={<ProtectedRoute role="ORGANIZATION"><OrganizationLayout /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
