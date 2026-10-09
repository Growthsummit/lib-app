import { useState, useEffect, useCallback } from 'react';
import { storage } from './utils/storage';
import Login from './components/Login';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookManagement from './components/BookManagement';
import Transactions from './components/Transactions';
import UserManagement from './components/UserManagement';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  const [books, setBooks] = useState(() => storage.get('lib_books', [
    { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', isbn: '9780743273565', quantity: 5 },
    { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', isbn: '9780061120084', quantity: 1 }
  ]));

  const [users, setUsers] = useState(() => storage.get('lib_users', [
    { id: '1', name: 'Alice Smith', memberId: 'LIB-001', role: 'Librarian' },
    { id: '2', name: 'Bob Jones', memberId: 'LIB-002', role: 'Member' }
  ]));

  const [logs, setLogs] = useState(() => storage.get('lib_logs', []));

  // Seed default admin on first run
  useEffect(() => {
    const stored = storage.get('lib_users_auth', null);
    if (!stored) {
      storage.set('lib_users_auth', [
        { username: 'admin', password: 'admin123', role: 'admin' }
      ]);
    }
  }, []);

  // Persistence
  useEffect(() => { storage.set('lib_books', books); }, [books]);
  useEffect(() => { storage.set('lib_users', users); }, [users]);
  useEffect(() => { storage.set('lib_logs', logs); }, [logs]);

  const isAdmin = () => currentUser?.role === 'admin';

  const addLog = useCallback((msg) => {
    const stamp = new Date().toLocaleString();
    setLogs(prev => {
      const next = [...prev, `[${stamp}] ${msg}`];
      if (next.length > 100) next.shift();
      return next;
    });
  }, []);

  const logout = () => setCurrentUser(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <>
      <Header currentUser={currentUser} onLogout={logout} />
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      <div className="container">
        <div className={`page ${activePage === 'dashboard' ? 'active' : ''}`}>
          <h2>Library Dashboard</h2>
          <Dashboard books={books} />
        </div>
        <div className={`page ${activePage === 'books' ? 'active' : ''}`}>
          <h2>Book Management</h2>
          <BookManagement books={books} setBooks={setBooks} isAdmin={isAdmin()} addLog={addLog} />
        </div>
        <div className={`page ${activePage === 'transactions' ? 'active' : ''}`}>
          <h2>Book Transactions</h2>
          <Transactions
            books={books} setBooks={setBooks}
            logs={logs} setLogs={setLogs}
            isAdmin={isAdmin()} currentUser={currentUser} addLog={addLog}
          />
        </div>
        <div className={`page ${activePage === 'users' ? 'active' : ''}`}>
          <h2>User Management</h2>
          <UserManagement users={users} setUsers={setUsers} isAdmin={isAdmin()} addLog={addLog} />
        </div>
      </div>
    </>
  );
}