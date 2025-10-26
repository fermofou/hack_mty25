import { BrowserRouter, Route, Routes } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import LoginPage from './pages/LoginPage';
import LoginPageAdmin from './pages/LoginPageAdmin';
import UserDashboard from './pages/UserDashboard';
import CreditsDashboard from './pages/CreditsDashboard';
import AdminPage from './pages/AdminPage';
import ApplyCreditPage from './pages/ApplyCreditPage';
import AdminCredits from './pages/AdminCredits';
import AdminAnalisis from './pages/AdminAnalisis';
import CreditDetailPage from './pages/CreditDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
  <Toaster position="top-left" />
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/admin' element={<LoginPageAdmin />} />
          <Route path='/admin/dashboard' element={<AdminPage />} />
          <Route path='/admin/credits' element={<AdminCredits />} />
          <Route path='/admin/analysis' element={<AdminAnalisis />} />
          <Route path='/user/dashboard' element={<UserDashboard />} />
          <Route path='/user/credits' element={<CreditsDashboard />} />
          <Route
            path='/user/credits/details/:id'
            element={<CreditDetailPage />}
          />
          <Route path='/user/credits/apply' element={<ApplyCreditPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
