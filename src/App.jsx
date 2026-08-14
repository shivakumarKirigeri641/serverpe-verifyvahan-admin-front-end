import { useEffect, useState } from 'react';
import { getToken, clearToken, setUnauthorizedHandler } from './lib/api';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Finance from './pages/Finance.jsx';
import Gst from './pages/Gst.jsx';
import Tickets from './pages/Tickets.jsx';
import Inbox from './pages/Inbox.jsx';
import Users from './pages/Users.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Visitors from './pages/Visitors.jsx';
import Broadcast from './pages/Broadcast.jsx';
import Settings from './pages/Settings.jsx';
import Toaster from './components/Toaster.jsx';

const PAGES = {
  dashboard: Dashboard, finance: Finance, gst: Gst, tickets: Tickets, inbox: Inbox, users: Users,
  vehicles: Vehicles, visitors: Visitors, broadcast: Broadcast, settings: Settings,
};

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false));
  }, []);

  const Page = PAGES[page] || Dashboard;
  const logout = () => { clearToken(); setAuthed(false); };

  return (
    <>
      {authed
        ? <Layout page={page} setPage={setPage} onLogout={logout}><Page /></Layout>
        : <Login onAuthed={() => setAuthed(true)} />}
      <Toaster />
    </>
  );
}
