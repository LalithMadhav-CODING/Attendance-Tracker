import React, { useState } from 'react';
import { Home, Calendar, CalendarOff, Settings } from 'lucide-react';
import { useLocalStorage } from './useLocalStorage';
import Dashboard from './views/Dashboard';
import Timetable from './views/Timetable';
import Absences from './views/Absences';
import SettingsView from './views/Settings';
import './index.css';

const TABS = {
  DASHBOARD: 'dashboard',
  TIMETABLE: 'timetable',
  ABSENCES: 'absences',
  SETTINGS: 'settings',
};

function App() {
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  
  // App State
  const [courses, setCourses] = useLocalStorage('at_courses', []);
  const [timetable, setTimetable] = useLocalStorage('at_timetable', []);
  const [plannedAbsences, setPlannedAbsences] = useLocalStorage('at_plannedAbsences', []);
  const [holidays, setHolidays] = useLocalStorage('at_holidays', []);
  const [settings, setSettings] = useLocalStorage('at_settings', { targetAttendance: 75, semesterEndDate: '' });
  const [attendanceLogs, setAttendanceLogs] = useLocalStorage('at_logs', {}); 
  // attendanceLogs: { 'YYYY-MM-DD': { timetableId: 'attended' | 'missed' } }

  const renderTab = () => {
    switch (activeTab) {
      case TABS.DASHBOARD:
        return <Dashboard 
          courses={courses} setCourses={setCourses}
          timetable={timetable}
          attendanceLogs={attendanceLogs} setAttendanceLogs={setAttendanceLogs}
          settings={settings}
          holidays={holidays}
        />;
      case TABS.TIMETABLE:
        return <Timetable 
          courses={courses} setCourses={setCourses}
          timetable={timetable} setTimetable={setTimetable}
        />;
      case TABS.ABSENCES:
        return <Absences 
          plannedAbsences={plannedAbsences} setPlannedAbsences={setPlannedAbsences}
          holidays={holidays} setHolidays={setHolidays}
          timetable={timetable} courses={courses} settings={settings}
        />;
      case TABS.SETTINGS:
        return <SettingsView 
          settings={settings} setSettings={setSettings}
        />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '90vh' }}>
      <header style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '36px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>ATTENDANCE TRACKER</h1>
      </header>
      
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        {renderTab()}
      </main>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        backgroundColor: 'var(--card-bg)', 
        borderTop: '2px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-around', padding: '15px 0',
        zIndex: 100
      }}>
        <TabButton icon={<Home size={28}/>} active={activeTab === TABS.DASHBOARD} onClick={() => setActiveTab(TABS.DASHBOARD)} />
        <TabButton icon={<Calendar size={28}/>} active={activeTab === TABS.TIMETABLE} onClick={() => setActiveTab(TABS.TIMETABLE)} />
        <TabButton icon={<CalendarOff size={28}/>} active={activeTab === TABS.ABSENCES} onClick={() => setActiveTab(TABS.ABSENCES)} />
        <TabButton icon={<Settings size={28}/>} active={activeTab === TABS.SETTINGS} onClick={() => setActiveTab(TABS.SETTINGS)} />
      </nav>
    </div>
  );
}

function TabButton({ icon, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}
    >
      {icon}
    </button>
  );
}

export default App;
