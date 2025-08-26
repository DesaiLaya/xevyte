function NotificationsPage() {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    fetch('/claims/notifications')
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(console.error);
  }, []);

  return (
    <div className="claims-container">
      <div className="sidebar">{/* sidebar */}
      </div>
      <div className="main-area">
        <div className="main-topbar">{/* topbar */}</div>
        <main className="claims-dashboard">
          <h2 className="title">Notifications</h2>
          <ul className="notif-list">
            {notes.map(n => <li key={n.id}>{n.message} <br/><small>{new Date(n.date).toLocaleString()}</small></li>)}
          </ul>
          {notes.length === 0 && <p>No notifications.</p>}
        </main>
      </div>
    </div>
  );
}
