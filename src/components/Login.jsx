import { useState } from 'react';
import { storage } from '../utils/storage';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [errorColor, setErrorColor] = useState('');

  const attemptLogin = () => {
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setError('❌ Please enter both username and password');
      setErrorColor('var(--red-delete)');
      return;
    }

    const stored = storage.get('lib_users_auth', []);
    const found = stored.find(x => x.username === u && x.password === p);

    if (found) {
      setError('');
      setErrorColor('');
      setUsername('');
      setPassword('');
      onLogin({ username: found.username, role: found.role });
    } else {
      setError('Invalid username or password');
      setErrorColor('var(--red-delete)');
    }
  };

  const registerUser = () => {
    const u = username.trim();
    const p = password.trim();

    setError('');
    setErrorColor('');

    if (!u || !p) {
      setError('Please enter both username and password');
      setErrorColor('var(--red-delete)');
      return;
    }
    if (u.length < 3) {
      setError('Username must be at least 3 characters');
      setErrorColor('var(--red-delete)');
      return;
    }
    if (p.length < 4) {
      setError('Password must be at least 4 characters');
      setErrorColor('var(--red-delete)');
      return;
    }

    const stored = storage.get('lib_users_auth', []);
    if (stored.find(x => x.username === u)) {
      setError('Username already exists. Please choose another.');
      setErrorColor('var(--red-delete)');
      return;
    }

    storage.set('lib_users_auth', [...stored, { username: u, password: p, role }]);

    setError('Account created successfully! You can now login.');
    setErrorColor('green');
    setUsername('');
    setPassword('');

    setTimeout(() => {
      setError('');
      setErrorColor('');
    }, 3000);
  };

  return (
    <div id="login-overlay">
      <div id="login-box">
        <h2>Library Login</h2>
        <div className="form-group">
          <label htmlFor="login-username">Username</label>
          <input
            type="text"
            id="login-username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-role">Role</label>
          <select id="login-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <button id="login-btn" className="btn btn-add" onClick={attemptLogin}>
          Sign In
        </button>
        <button id="register-btn" className="btn btn-update" onClick={registerUser}>
          Register New Account
        </button>
        {error && (
          <div id="login-error" style={{ color: errorColor }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}