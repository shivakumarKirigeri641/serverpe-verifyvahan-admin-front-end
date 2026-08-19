import { useState } from 'react';
import Users from './Users.jsx';
import Vehicles from './Vehicles.jsx';

const TABS = [['users', '👤 Users'], ['vehicles', '🚗 Vehicles']];

export default function UsersVehicles() {
  const [tab, setTab] = useState('users');
  return (
    <>
      <div className="mb-5 inline-flex rounded-xl border border-line bg-white p-1">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-brand text-white' : 'text-body hover:bg-line/40'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'users' ? <Users /> : <Vehicles />}
    </>
  );
}
