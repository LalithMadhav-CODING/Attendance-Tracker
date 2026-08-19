import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Timetable({ courses, setCourses, timetable, setTimetable }) {
  const [newCourseName, setNewCourseName] = useState('');
  const [initAttended, setInitAttended] = useState(0);
  const [initTotal, setInitTotal] = useState(0);

  const [tDay, setTDay] = useState('1'); // Monday default
  const [tCourse, setTCourse] = useState('');
  const [tTime, setTTime] = useState('');
  const [tClassroom, setTClassroom] = useState('');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    setCourses([...courses, {
      id: Date.now().toString(),
      name: newCourseName,
      attended: parseInt(initAttended) || 0,
      total: parseInt(initTotal) || 0
    }]);
    setNewCourseName('');
    setInitAttended(0);
    setInitTotal(0);
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
    setTimetable(timetable.filter(t => t.courseId !== id));
  };

  const addTimetableEntry = (e) => {
    e.preventDefault();
    if (!tCourse || !tTime || !tClassroom) return;
    setTimetable([...timetable, {
      id: Date.now().toString(),
      dayOfWeek: parseInt(tDay),
      courseId: tCourse,
      time: tTime,
      classroom: tClassroom
    }]);
    setTTime('');
    setTClassroom('');
  };

  const deleteTimetableEntry = (id) => {
    setTimetable(timetable.filter(t => t.id !== id));
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Manage Courses</h2>
      <div className="card">
        <form onSubmit={addCourse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="Course Name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} required />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '16px' }}>Initial Attended</label>
              <input type="number" value={initAttended} onChange={e => setInitAttended(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '16px' }}>Initial Total</label>
              <input type="number" value={initTotal} onChange={e => setInitTotal(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add Course</button>
        </form>

        {courses.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            {courses.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{c.name} ({c.attended}/{c.total})</span>
                <button onClick={() => deleteCourse(c.id)}><Trash2 size={20} color="var(--btn-cross)"/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ margin: '30px 0 20px', textAlign: 'center' }}>Weekly Timetable</h2>
      <div className="card">
        <form onSubmit={addTimetableEntry} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={tDay} onChange={e => setTDay(e.target.value)}>
            {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select value={tCourse} onChange={e => setTCourse(e.target.value)} required>
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="time" value={tTime} onChange={e => setTTime(e.target.value)} required />
          <input placeholder="Classroom" value={tClassroom} onChange={e => setTClassroom(e.target.value)} required />
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add Class</button>
        </form>
      </div>

      {days.map((day, i) => {
        const classes = timetable.filter(t => t.dayOfWeek === i).sort((a,b) => a.time.localeCompare(b.time));
        if (classes.length === 0) return null;
        return (
          <div key={i} className="card" style={{ padding: '10px 20px' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>{day}</h3>
            {classes.map(t => {
              const c = courses.find(cx => cx.id === t.courseId);
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <div>
                    <span style={{ display: 'inline-block', width: '60px' }}>{t.time}</span>
                    <span>{c?.name}</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '10px', fontSize: '18px' }}>({t.classroom})</span>
                  </div>
                  <button onClick={() => deleteTimetableEntry(t.id)}><Trash2 size={18} color="var(--btn-cross)"/></button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
