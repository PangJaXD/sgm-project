import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import CompanyDashboard from "./Pages/company/CompanyDashboard";
import HeadGuardDashboard from "./Pages/headguard/HeadGuardDashboard";
import AdminDashboard from "./Pages/admin/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard */}
        <Route path="/company" element={<CompanyDashboard />} />

        <Route path="/headguard" element={<HeadGuardDashboard />} />

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
