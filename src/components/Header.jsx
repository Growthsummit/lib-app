export default function Header({ currentUser, onLogout }) {
  return (
    <header>
      <h1>Community Library Management System</h1>
      <div id="user-info">
        <span>{currentUser.username} ({currentUser.role})</span>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}