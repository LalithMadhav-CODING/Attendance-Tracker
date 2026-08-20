import React from 'react';

export default function SettingsView({ settings, setSettings }) {
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const wipeData = () => {
    if (window.confirm("Are you sure you want to wipe all your attendance data? This cannot be undone.")) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Settings</h2>
      
      <div className="card">
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
          <span>Target Attendance (%)</span>
          <input 
            type="number" 
            min="1" max="100" 
            value={settings.targetAttendance || 75} 
            onChange={(e) => updateSetting('targetAttendance', parseInt(e.target.value))} 
          />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
          <span>Semester End Date</span>
          <input 
            type="date" 
            value={settings.semesterEndDate || ''} 
            onChange={(e) => updateSetting('semesterEndDate', e.target.value)} 
          />
        </label>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Notifications</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span>Enable Notifications</span>
            <button 
              onClick={() => {
                if (!settings.notificationsEnabled) {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        updateSetting('notificationsEnabled', true);
                      } else {
                        alert('Notification permission denied');
                      }
                    });
                  } else {
                    alert('Notifications are not supported in this browser');
                  }
                } else {
                  updateSetting('notificationsEnabled', false);
                }
              }}
              style={{
                backgroundColor: settings.notificationsEnabled ? 'var(--btn-check)' : 'transparent',
                border: '2px solid var(--btn-check)',
                color: settings.notificationsEnabled ? 'var(--bg-color)' : 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {settings.notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px', opacity: settings.notificationsEnabled ? 1 : 0.5 }}>
            <span>Notify before class (minutes)</span>
            <input 
              type="number" 
              min="1" max="120" 
              disabled={!settings.notificationsEnabled}
              value={settings.notificationOffset ?? 15} 
              onChange={(e) => updateSetting('notificationOffset', parseInt(e.target.value) || 0)} 
            />
          </label>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h3 style={{ color: 'var(--btn-cross)', marginBottom: '10px' }}>Danger Zone</h3>
          <button 
            onClick={wipeData}
            style={{ 
              backgroundColor: 'var(--btn-cross)', 
              color: 'var(--bg-color)', 
              padding: '10px', 
              borderRadius: '8px',
              width: '100%',
              fontWeight: 'bold',
              fontSize: '20px'
            }}
          >
            Wipe All Data
          </button>
        </div>
      </div>
    </div>
  );
}
