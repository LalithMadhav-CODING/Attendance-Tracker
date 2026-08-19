import React from 'react';
import { Check, X } from 'lucide-react';

export default function Dashboard({ courses, setCourses, timetable, attendanceLogs, setAttendanceLogs, settings, holidays }) {
  const today = new Date();
  // We use local time for the date string. 
  // Ensure we get YYYY-MM-DD
  const offset = today.getTimezoneOffset()
  const todayDate = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0]
  
  const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  
  const isHoliday = holidays.includes(todayDate);
  const todaysClasses = timetable.filter(t => parseInt(t.dayOfWeek) === dayOfWeek).sort((a,b) => a.time.localeCompare(b.time));

  if (isHoliday) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Enjoy your holiday!</h2></div>;
  }

  if (todaysClasses.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>No classes today!</h2></div>;
  }

  const markAttendance = (timetableItem, courseId, status) => {
    // status: 'attended' | 'missed'
    const currentLog = attendanceLogs[todayDate]?.[timetableItem.id];
    if (currentLog === status) return; // already marked

    // update global course count
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        let newAttended = c.attended;
        let newTotal = c.total;
        
        // revert previous if any
        if (currentLog === 'attended') { newAttended--; newTotal--; }
        else if (currentLog === 'missed') { newTotal--; }

        // apply new
        if (status === 'attended') { newAttended++; newTotal++; }
        else if (status === 'missed') { newTotal++; }

        return { ...c, attended: newAttended, total: newTotal };
      }
      return c;
    }));

    setAttendanceLogs(prev => ({
      ...prev,
      [todayDate]: {
        ...(prev[todayDate] || {}),
        [timetableItem.id]: status
      }
    }));
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Today's Classes</h2>
      {todaysClasses.map(tClass => {
        const course = courses.find(c => c.id === tClass.courseId);
        if (!course) return null;
        
        const log = attendanceLogs[todayDate]?.[tClass.id];
        const percent = course.total === 0 ? 0 : Math.round((course.attended / course.total) * 100);
        const target = (settings.targetAttendance || 75) / 100;
        
        let statusText = '';
        if (course.total > 0) {
          const currentRatio = course.attended / course.total;
          if (currentRatio >= target) {
            const m = Math.floor((course.attended - target * course.total) / target);
            statusText = `You may leave\n${m} class${m !== 1 ? 'es' : ''}`;
          } else {
            const n = Math.ceil((target * course.total - course.attended) / (1 - target));
            statusText = `You must attend\n${n} class${n !== 1 ? 'es' : ''}`;
          }
        } else {
          statusText = "No classes recorded yet";
        }

        return (
          <div key={tClass.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 style={{ fontSize: '32px' }}>{course.name}</h1>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{tClass.time}</div>
                <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{tClass.classroom}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <div>ATTENDED: {course.attended}</div>
                <div style={{ borderBottom: '2px solid var(--btn-check)', display: 'inline-block', marginBottom: '10px' }}>
                  TOTAL: {course.total}
                </div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '20px' }}>{statusText}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '120px' }}>
                <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--progress-bg)', borderRadius: '5px', overflow: 'hidden', marginBottom: '5px' }}>
                  <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--progress-fill)', transition: 'width 0.5s ease' }}></div>
                </div>
                <h1 style={{ fontSize: '42px', marginBottom: '10px' }}>{percent}%</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => markAttendance(tClass, course.id, 'attended')}
                    style={{ 
                      backgroundColor: log === 'attended' ? 'var(--btn-check)' : 'transparent',
                      border: '2px solid var(--btn-check)',
                      borderRadius: '50%', width: '40px', height: '40px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                  >
                    <Check size={24} />
                  </button>
                  <button 
                    onClick={() => markAttendance(tClass, course.id, 'missed')}
                    style={{ 
                      backgroundColor: log === 'missed' ? 'var(--btn-cross)' : 'transparent',
                      border: '2px solid var(--btn-cross)',
                      borderRadius: '50%', width: '40px', height: '40px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
