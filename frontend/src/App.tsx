import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './context/AuthProvider';
import LoginPage from './pages/LoginPage';
import LoginPageAdmin from './pages/LoginPageAdmin';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/admin' element={<LoginPageAdmin />} />
          <Route path='/user/dashboard' element={<UserDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
