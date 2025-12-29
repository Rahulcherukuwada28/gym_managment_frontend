import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/owner/Login';
import Dashboard from './pages/owner/Dashboard';
import MembersList from './pages/owner/MembersList';
import AddMember from './pages/owner/AddMember';
import QRPage from './pages/public/QRPage';
import ArchivedMembers from './pages/owner/ArchivedMembers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* New Routes */}
        <Route path="/members" element={<MembersList />} />
        <Route path="/members/add" element={<AddMember />} />
        
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/members/archived" element={<ArchivedMembers />} />

        <Route path="/qr" element={<QRPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;