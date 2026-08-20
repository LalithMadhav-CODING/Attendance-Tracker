import React from 'react';
import { sendNotification } from '../useNotifications';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Target Attendance</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {settings.targetAttendance ?? 75}%
            </span>
          </div>
          <input 
            type="range" 
            min="1" max="100" 
            value={settings.targetAttendance ?? 75} 
            onChange={(e) => updateSetting('targetAttendance', parseInt(e.target.value))} 
            style={{ 
              width: '100%', 
              accentColor: 'var(--btn-cross)', 
              cursor: 'pointer',
              padding: '6px 0',
              background: 'transparent',
              border: 'none'
            }} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: 'var(--text-secondary)' }}>
            <span>1%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
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

          {settings.notificationsEnabled && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={async () => {
                  const success = await sendNotification("Test Alert 🔔", {
                    body: "Attendance Tracker notifications are working properly!",
                    tag: `test-alert-${Date.now()}`
                  });
                  if (!success) {
                    alert("Could not trigger notification. Please check browser permissions.");
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Send Test Alert
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('at_notified_classes');
                  alert('Notification history reset. Today\'s classes can be notified again.');
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reset Alert History
              </button>
            </div>
          )}
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
