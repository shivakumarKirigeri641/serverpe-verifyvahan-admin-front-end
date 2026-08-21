import { useEffect, useState } from 'react';
import { getToken, clearToken, setUnauthorizedHandler } from './lib/api';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Today from './pages/Today.jsx';
import LiveActivity from './pages/LiveActivity.jsx';
import UsersVehicles from './pages/UsersVehicles.jsx';
import Watch from './pages/Watch.jsx';
import Finance from './pages/Finance.jsx';
import Gst from './pages/Gst.jsx';
import Tickets from './pages/Tickets.jsx';
import Inbox from './pages/Inbox.jsx';
import Users from './pages/Users.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Visitors from './pages/Visitors.jsx';
import Broadcast from './pages/Broadcast.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import Invoices from './pages/Invoices.jsx';
import Logins from './pages/Logins.jsx';
import Legal from './pages/Legal.jsx';
import ApiHealth from './pages/ApiHealth.jsx';
import Settings from './pages/Settings.jsx';
import Premium from './pages/Premium.jsx';
import Game from './pages/Game.jsx';
import Templates from './pages/Templates.jsx';
import Lookup from './pages/Lookup.jsx';
import Fleet from './pages/Fleet.jsx';
import Toaster from './components/Toaster.jsx';

const PAGES = {
  dashboard: Dashboard, today: Today, liveactivity: LiveActivity, usersvehicles: UsersVehicles,
  watch: Watch, finance: Finance, gst: Gst, tickets: Tickets, inbox: Inbox, users: Users,
  vehicles: Vehicles, visitors: Visitors, analytics: Analytics, reports: Reports, invoices: Invoices,
  logins: Logins, legal: Legal, broadcast: Broadcast, apihealth: ApiHealth, settings: Settings,
  premium: Premium, game: Game, templates: Templates, lookup: Lookup, fleet: Fleet,
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
