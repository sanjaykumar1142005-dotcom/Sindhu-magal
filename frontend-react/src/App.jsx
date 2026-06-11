import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Catering from './pages/Catering';
import CateringAdmin from './pages/CateringAdmin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/catering" element={<Catering />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/catering" element={<CateringAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;
