export default function Navbar({ activePage, onNavigate }) {
  const links = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'books', label: 'Books' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <nav>
      {links.map(({ id, label }) => (
        <button
          key={id}
          className={`nav-btn ${activePage === id ? 'active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}