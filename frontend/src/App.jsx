import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest, clearAccessToken, getAccessToken } from './utils/api';
import Login from './components/Login';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookManagement from './components/BookManagement';
import Transactions from './components/Transactions';
import UserManagement from './components/UserManagement';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';

  const isAdmin = () => currentUser?.role === 'admin';

  const refreshTransactions = useCallback(async () => {
    const transactionData = await apiRequest('/transactions');
    setLogs(transactionData.map((item) => item.message));
  }, []);

  const loadLibraryData = useCallback(async (user) => {
    const [bookData, userData, transactionData] = await Promise.all([
      apiRequest('/books'),
      user?.role === 'admin' ? apiRequest('/users') : Promise.resolve([]),
      apiRequest('/transactions')
    ]);
    setBooks(bookData);
    setUsers(userData);
    setLogs(transactionData.map((item) => item.message));
  }, []);

  const handleLogin = useCallback(async (user) => {
    try {
      await loadLibraryData(user);
      setCurrentUser(user);
    } catch (error) {
      clearAccessToken();
      throw error;
    }
  }, [loadLibraryData]);

  useEffect(() => {
    if (!getAccessToken()) return;

    let active = true;
    apiRequest('/auth/me')
      .then(async (user) => {
        await loadLibraryData(user);
        if (active) setCurrentUser(user);
      })
      .catch((error) => {
        clearAccessToken();
        if (active) window.alert(`Unable to restore your session: ${error.message}`);
      });

    return () => { active = false; };
  }, [loadLibraryData]);

  const skipPageFetch = useRef(true);
  useEffect(() => {
    if (!currentUser) {
      skipPageFetch.current = true;
      return;
    }
    if (skipPageFetch.current) {
      skipPageFetch.current = false;
      return;
    }

    let active = true;
    loadLibraryData(currentUser).catch((error) => {
      if (active) window.alert(`Unable to load library data: ${error.message}`);
    });
    return () => { active = false; };
  }, [activePage, currentUser, loadLibraryData]);

  const logout = () => {
    clearAccessToken();
    setCurrentUser(null);
    setBooks([]);
    setUsers([]);
    setLogs([]);
    navigate('/dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Header currentUser={currentUser} onLogout={logout} />
      <Navbar activePage={activePage} onNavigate={(page) => navigate(`/${page}`)} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <div className="page active">
              <h2>Library Dashboard</h2>
              <Dashboard books={books} />
            </div>
          } />
          <Route path="books" element={
            <div className="page active">
              <h2>Book Management</h2>
              <BookManagement
                books={books}
                setBooks={setBooks}
                isAdmin={isAdmin()}
                onTransactionsChanged={refreshTransactions}
              />
            </div>
          } />
          <Route path="transactions" element={
            <div className="page active">
              <h2>Book Transactions</h2>
              <Transactions
                books={books} setBooks={setBooks}
                logs={logs} setLogs={setLogs}
                isAdmin={isAdmin()} currentUser={currentUser}
              />
            </div>
          } />
          <Route path="users" element={
            <div className="page active">
              <h2>User Management</h2>
              <UserManagement users={users} setUsers={setUsers} isAdmin={isAdmin()} />
            </div>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}