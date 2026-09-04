import React, { useState } from 'react';
import { sendNotification } from '../useNotifications';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsView({ settings, setSettings }) {
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const wipeData = () => {
    setConfirmState({
      isOpen: true,
      message: "Are you sure you want to wipe all your attendance data?\n\nThis cannot be undone.",
      onConfirm: () => {
        window.localStorage.clear();
        window.location.reload();
      }
    });
  };

  const exportData = () => {
    const data = {
      at_courses: localStorage.getItem('at_courses'),
      at_timetable: localStorage.getItem('at_timetable'),
      at_plannedAbsences: localStorage.getItem('at_plannedAbsences'),
      at_holidays: localStorage.getItem('at_holidays'),
      at_settings: localStorage.getItem('at_settings'),
      at_logs: localStorage.getItem('at_logs'),
      at_extraClasses: localStorage.getItem('at_extraClasses'),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setConfirmState({
      isOpen: true,
      message: "Are you sure you want to import this backup? It will OVERWRITE all your existing attendance data.",
      onConfirm: () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            const keys = ['at_courses', 'at_timetable', 'at_plannedAbsences', 'at_holidays', 'at_settings', 'at_logs', 'at_extraClasses'];
            
            let valid = false;
            keys.forEach(key => {
              if (data[key] !== undefined && data[key] !== null) {
                localStorage.setItem(key, data[key]);
                valid = true;
              }
            });

            if (valid) {
              window.location.reload();
            } else {
              alert('Invalid backup file.');
            }
          } catch (err) {
            alert('Error parsing backup file.');
          }
        };
        reader.readAsText(file);
      }
    });
    // clear input so the same file can be selected again
    event.target.value = '';
  };

  const triggersSupported = typeof window !== 'undefined' && 'Notification' in window && 'showTrigger' in Notification.prototype && 'TimestampTrigger' in window;

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
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
            <span>Semester Start Date</span>
            <input 
              type="date" 
              value={settings.semesterStartDate || ''} 
              onChange={(e) => {
                if (settings.semesterEndDate && e.target.value && e.target.value > settings.semesterEndDate) {
                  alert("Semester Start Date cannot be after the End Date.");
                } else {
                  updateSetting('semesterStartDate', e.target.value);
                }
              }} 
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
            <span>Semester End Date</span>
            <input 
              type="date" 
              value={settings.semesterEndDate || ''} 
              onChange={(e) => {
                if (settings.semesterStartDate && e.target.value && e.target.value < settings.semesterStartDate) {
                  alert("Semester End Date cannot be before the Start Date.");
                } else {
                  updateSetting('semesterEndDate', e.target.value);
                }
              }} 
            />
          </label>
        </div>

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

          {settings.notificationsEnabled && !triggersSupported && (
            <div style={{ 
              backgroundColor: 'rgba(255, 165, 0, 0.1)', 
              border: '1px solid orange', 
              color: 'orange', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              <strong>Note:</strong> Offline notifications when the app is completely closed require an experimental browser feature. 
              On Android Chrome, copy and paste this into your URL bar to enable it:<br />
              <code style={{ display: 'block', marginTop: '8px', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px', wordBreak: 'break-all' }}>chrome://flags/#enable-experimental-web-platform-features</code>
            </div>
          )}

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
          <h3 style={{ marginBottom: '15px' }}>Data Management</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportData}
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
              Export Backup
            </button>
            <label
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Import Backup
              <input 
                type="file" 
                accept=".json" 
                style={{ display: 'none' }} 
                onChange={importData} 
              />
            </label>
          </div>
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
      
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />
    </div>
  );
}
