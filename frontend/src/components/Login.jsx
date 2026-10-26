import { useState } from 'react';
import { apiRequest, setAccessToken } from '../utils/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [errorColor, setErrorColor] = useState('');

  const attemptLogin = async () => {
    const u = username.trim();
    const p = password;

    if (!u || !p) {
      setError('❌ Please enter both username and password');
      setErrorColor('var(--red-delete)');
      return;
    }
    if (!/^[\p{L} ]+$/u.test(username)) {
      setError('Username can contain letters and spaces only.');
      setErrorColor('var(--red-delete)');
      return;
    }

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p })
      });
      if (role === 'admin' && result.user.role !== 'admin') {
        setError('This account is not an administrator. Choose User to sign in.');
        setErrorColor('var(--red-delete)');
        return;
      }
      if (role === 'user' && result.user.role === 'admin') {
        setError('This is an administrator account. Choose Admin to sign in.');
        setErrorColor('var(--red-delete)');
        return;
      }
      setAccessToken(result.token);
      setError('');
      setErrorColor('');
      setUsername('');
      setPassword('');
      await onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
      setErrorColor('var(--red-delete)');
    }
  };

  const registerUser = async () => {
    const u = username.trim();
    const p = password;

    setError('');
    setErrorColor('');

    if (!u || !p) {
      setError('Please enter both username and password');
      setErrorColor('var(--red-delete)');
      return;
    }
    if (!/^[\p{L} ]+$/u.test(username)) {
      setError('Username can contain letters and spaces only.');
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
    if (role === 'admin') {
      setError('New accounts receive user access. Ask an administrator for admin access.');
      setErrorColor('var(--red-delete)');
      return;
    }

    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p, role })
      });
      setError(result.message);
      setErrorColor('green');
      setUsername('');
      setPassword('');
    } catch (requestError) {
      setError(requestError.message);
      setErrorColor('var(--red-delete)');
    }
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
            maxLength={100}
            pattern="[\p{L} ]+"
            title="Use letters and spaces only"
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