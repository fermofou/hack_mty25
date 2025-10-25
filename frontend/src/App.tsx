import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./pages/LoginPage";
import LoginPageAdmin from "./pages/LoginPageAdmin";
import UserDashboard from "./pages/UserDashboard";
import CreditsDashboard from "./pages/CreditsDashboard";
import AdminPage from "./pages/AdminPage";
import ApplyCreditPage from "./pages/ApplyCreditPage";
//import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<LoginPageAdmin />} />
          <Route path="/admin/dashboard" element={<AdminPage />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/credits" element={<CreditsDashboard />} />
          <Route path="/user/credits/apply" element={<ApplyCreditPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
