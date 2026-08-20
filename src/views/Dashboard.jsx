import React, { useState } from 'react';
import { Check, X, MoreVertical, Plus } from 'lucide-react';

export default function Dashboard({ courses, setCourses, timetable, attendanceLogs, setAttendanceLogs, settings, holidays, extraClasses, setExtraClasses }) {
  const [todayDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0];
  });
  
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [calMonth, setCalMonth] = useState(parseInt(todayDate.split('-')[1]) - 1);
  const [calYear, setCalYear] = useState(parseInt(todayDate.split('-')[0]));
  
  const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay(); 
  
  const isHoliday = holidays.includes(selectedDate);
  
  const todaysExtra = (extraClasses || []).filter(e => e.date === selectedDate);
  const todaysClasses = [...timetable.filter(t => parseInt(t.dayOfWeek) === dayOfWeek), ...todaysExtra]
    .sort((a,b) => a.time.localeCompare(b.time));

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [eCourse, setECourse] = useState('');
  const [eTime, setETime] = useState('');
  const [eClassroom, setEClassroom] = useState('');

  if (isHoliday) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Enjoy your holiday!</h2></div>;
  }

  const markAttendance = (timetableItem, courseId, status) => {
    const currentLog = attendanceLogs[selectedDate]?.[timetableItem.id];
    if (currentLog === status) return;

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        let newAttended = c.attended;
        let newTotal = c.total;
        let newMissed = c.missed || 0;
        
        if (currentLog === 'attended') { newAttended--; }
        if (currentLog === 'cancelled') { newTotal++; }
        if (currentLog === 'missed') { newMissed--; }

        if (status === 'attended') { newAttended++; }
        if (status === 'cancelled') { newTotal--; }
        if (status === 'missed') { newMissed++; }

        return { ...c, attended: newAttended, total: newTotal, missed: newMissed };
      }
      return c;
    }));

    setAttendanceLogs(prev => {
      const newLogs = {
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          [timetableItem.id]: status
        }
      };
      if (status === 'none') {
        delete newLogs[selectedDate][timetableItem.id];
      }
      return newLogs;
    });
  };

  const addExtraClass = (e) => {
    e.preventDefault();
    if(!eCourse || !eTime || !eClassroom) return;
    setExtraClasses([...(extraClasses || []), {
      id: 'ext_' + Date.now(),
      date: selectedDate,
      courseId: eCourse,
      time: eTime,
      classroom: eClassroom
    }]);
    
    setCourses(prev => prev.map(c => {
      if (c.id === eCourse) return { ...c, total: c.total + 1 };
      return c;
    }));

    setShowExtraModal(false);
    setECourse('');
    setETime('');
    setEClassroom('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{selectedDate === todayDate ? "Today's Classes" : `Classes for ${selectedDate}`}</h2>
        <button 
          onClick={() => setShowExtraModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'var(--border-color)', padding: '8px 12px', borderRadius: '8px' }}
        >
          <Plus size={18} /> Extra Class
        </button>
      </div>

      {showExtraModal && (
        <div className="card" style={{ marginBottom: '20px', border: '2px dashed var(--border-color)' }}>
          <form onSubmit={addExtraClass} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Add Extra Class Today</h3>
            <select value={eCourse} onChange={e => setECourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="time" value={eTime} onChange={e => setETime(e.target.value)} required />
            <input placeholder="Classroom" value={eClassroom} onChange={e => setEClassroom(e.target.value)} required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add</button>
              <button type="button" onClick={() => setShowExtraModal(false)} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {todaysClasses.length === 0 && !showExtraModal && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>No classes today!</h2></div>
      )}

      {todaysClasses.map(tClass => {
        const course = courses.find(c => c.id === tClass.courseId);
        if (!course) return null;
        
        const log = attendanceLogs[selectedDate]?.[tClass.id];
        const isCancelled = log === 'cancelled';
        const percent = course.total === 0 ? 0 : Math.round((course.attended / course.total) * 100);
        const target = (settings.targetAttendance || 75) / 100;
        
        let statusText = '';
        if (course.total > 0) {
          const requiredAttended = Math.ceil(target * course.total);
          const remainingNeeded = requiredAttended - course.attended;
          
          if (remainingNeeded > 0) {
            statusText = `You must attend\n${remainingNeeded} class${remainingNeeded !== 1 ? 'es' : ''}`;
          } else {
            statusText = `Goal reached!\nYou may skip the rest`;
          }
        } else {
          statusText = "No classes recorded yet";
        }

        return (
          <div key={tClass.id} className="card" style={{ opacity: isCancelled ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '32px', margin: 0 }}>{course.name}</h1>
                {isCancelled && <span style={{ backgroundColor: 'var(--btn-cross)', padding: '2px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>CANCELLED</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{tClass.time}</div>
                <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{tClass.classroom}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div>
                <div>CLASSES LEFT: {Math.max(0, course.total - (course.attended + (course.missed || 0)))}</div>
                <div>ATTENDED: {course.attended}</div>
                <div>MISSED: {course.missed || 0}</div>
                <div style={{ borderBottom: '2px solid var(--btn-check)', display: 'inline-block', marginBottom: '10px' }}>
                  TOTAL: {course.total}
                </div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '20px' }}>{statusText}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '120px' }}>
                <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--progress-bg)', borderRadius: '5px', overflow: 'hidden', marginBottom: '5px' }}>
                  <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--progress-fill)', transition: 'width 0.5s ease' }}></div>
                </div>
                <h1 style={{ fontSize: '42px', margin: '0 0 10px 0' }}>{percent}%</h1>
                <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                  <button 
                    onClick={() => markAttendance(tClass, course.id, 'attended')}
                    disabled={isCancelled}
                    style={{ 
                      backgroundColor: log === 'attended' ? 'var(--btn-check)' : 'transparent',
                      border: '2px solid var(--btn-check)',
                      borderRadius: '50%', width: '40px', height: '40px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      opacity: isCancelled ? 0.5 : 1,
                      cursor: isCancelled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Check size={24} />
                  </button>
                  <button 
                    onClick={() => markAttendance(tClass, course.id, 'missed')}
                    disabled={isCancelled}
                    style={{ 
                      backgroundColor: log === 'missed' ? 'var(--btn-cross)' : 'transparent',
                      border: '2px solid var(--btn-cross)',
                      borderRadius: '50%', width: '40px', height: '40px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      opacity: isCancelled ? 0.5 : 1,
                      cursor: isCancelled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <X size={24} />
                  </button>
                  
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setMenuOpenId(menuOpenId === tClass.id ? null : tClass.id)}
                      style={{ padding: '8px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <MoreVertical size={24} />
                    </button>
                    {menuOpenId === tClass.id && (
                      <div style={{ 
                        position: 'absolute', right: 0, top: '40px', 
                        backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                        padding: '5px', borderRadius: '8px', zIndex: 10, width: '140px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                        <button 
                          onClick={() => { 
                            markAttendance(tClass, course.id, isCancelled ? 'none' : 'cancelled'); 
                            setMenuOpenId(null); 
                          }}
                          style={{ width: '100%', padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: isCancelled ? 'var(--text-primary)' : 'var(--btn-cross)' }}
                        >
                          {isCancelled ? 'Undo Cancel' : 'Cancel Class'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '30px', paddingBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '24px' }}>Calendar</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => { if(calMonth === 0) { setCalMonth(11); setCalYear(calYear-1); } else { setCalMonth(calMonth-1); } }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '24px', cursor: 'pointer' }}>&lt;</button>
            <span style={{ fontSize: '18px', width: '140px', textAlign: 'center' }}>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][calMonth]} {calYear}
            </span>
            <button onClick={() => { if(calMonth === 11) { setCalMonth(0); setCalYear(calYear+1); } else { setCalMonth(calMonth+1); } }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '24px', cursor: 'pointer' }}>&gt;</button>
          </div>
        </div>
        <div className="calendar-grid">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={`h-${i}`} className="calendar-header-cell">{d}</div>)}
          {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-cell empty"></div>
          ))}
          {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
            const dateStr = `${calYear}-${String(calMonth+1).padStart(2, '0')}-${String(i+1).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayDate;
            const hasClasses = timetable.some(t => parseInt(t.dayOfWeek) === new Date(dateStr + 'T00:00:00').getDay());
            
            let classNames = 'calendar-cell';
            if (isSelected) classNames += ' selected';
            if (isToday) classNames += ' today';
            if (hasClasses) classNames += ' has-classes';
            else classNames += ' no-classes';

            return (
              <div 
                key={i} 
                className={classNames}
                onClick={() => setSelectedDate(dateStr)}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
