import React, { useState } from 'react';
import { Trash2, Pencil, Check } from 'lucide-react';

export default function Timetable({ courses, setCourses, timetable, setTimetable }) {
  const [newCourseName, setNewCourseName] = useState('');
  const [initAttended, setInitAttended] = useState(0);
  const [initMissed, setInitMissed] = useState(0);
  const [initTotal, setInitTotal] = useState(0);

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editCourseData, setEditCourseData] = useState({ name: '', attended: 0, missed: 0, total: 0 });

  const [tDay, setTDay] = useState('1'); // Monday default
  const [tCourse, setTCourse] = useState('');
  const [tTime, setTTime] = useState('');
  const [tClassroom, setTClassroom] = useState('');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addCourse = (e) => {
    e.preventDefault();
    const cleanName = newCourseName.trim();
    if (!cleanName) return;
    
    if (courses.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("A course with this name already exists.");
      return;
    }
    
    const attended = Math.max(0, parseInt(initAttended) || 0);
    const missed = Math.max(0, parseInt(initMissed) || 0);
    const total = Math.max(0, parseInt(initTotal) || 0);
    
    if (attended + missed > total) {
      alert("Attended + Missed cannot exceed Total Classes.");
      return;
    }

    setCourses([...courses, {
      id: Date.now().toString(),
      name: cleanName,
      attended: attended,
      missed: missed,
      total: total
    }]);
    setNewCourseName('');
    setInitAttended(0);
    setInitMissed(0);
    setInitTotal(0);
  };

  const saveEditCourse = (id) => {
    const cleanName = editCourseData.name.trim();
    if (courses.some(c => c.id !== id && c.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("A course with this name already exists.");
      return;
    }

    const attended = Math.max(0, parseInt(editCourseData.attended) || 0);
    const missed = Math.max(0, parseInt(editCourseData.missed) || 0);
    const total = Math.max(0, parseInt(editCourseData.total) || 0);
    
    if (attended + missed > total) {
      alert("Attended + Missed cannot exceed Total Classes.");
      return;
    }

    setCourses(courses.map(c => c.id === id ? {
      ...c,
      name: cleanName,
      attended: attended,
      missed: missed,
      total: total
    } : c));
    setEditingCourseId(null);
  };

  const deleteCourse = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter(c => c.id !== id));
      setTimetable(timetable.filter(t => t.courseId !== id));
    }
  };

  const addTimetableEntry = (e) => {
    e.preventDefault();
    if (!tCourse || !tTime || !tClassroom) return;
    
    const dayInt = parseInt(tDay);

    if (timetable.some(t => t.dayOfWeek === dayInt && t.time === tTime && t.courseId === tCourse)) {
      alert("This exact class is already scheduled at this time.");
      return;
    }
    
    if (timetable.some(t => t.dayOfWeek === dayInt && t.time === tTime)) {
      if (!window.confirm("Another class is already scheduled at this time. Are you sure you want to add it?")) {
        return;
      }
    }

    setTimetable([...timetable, {
      id: Date.now().toString(),
      dayOfWeek: dayInt,
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
              <label style={{ fontSize: '16px' }}>Attended</label>
              <input type="number" min="0" value={initAttended} onChange={e => setInitAttended(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '16px' }}>Missed</label>
              <input type="number" min="0" value={initMissed} onChange={e => setInitMissed(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '16px' }}>Total Classes</label>
              <input type="number" min="0" value={initTotal} onChange={e => setInitTotal(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add Course</button>
        </form>

        {courses.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            {courses.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                {editingCourseId === c.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, marginRight: '10px' }}>
                    <input value={editCourseData.name} onChange={e => setEditCourseData({...editCourseData, name: e.target.value})} placeholder="Course Name" />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="number" min="0" placeholder="Attended" value={editCourseData.attended} onChange={e => setEditCourseData({...editCourseData, attended: e.target.value})} style={{ width: '33%' }} />
                      <input type="number" min="0" placeholder="Missed" value={editCourseData.missed} onChange={e => setEditCourseData({...editCourseData, missed: e.target.value})} style={{ width: '33%' }} />
                      <input type="number" min="0" placeholder="Total" value={editCourseData.total} onChange={e => setEditCourseData({...editCourseData, total: e.target.value})} style={{ width: '33%' }} />
                    </div>
                  </div>
                ) : (
                  <span>{c.name} ({c.attended}/{c.total})</span>
                )}
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {editingCourseId === c.id ? (
                    <button onClick={() => saveEditCourse(c.id)}><Check size={20} color="var(--btn-check)"/></button>
                  ) : (
                    <button onClick={() => {
                      setEditingCourseId(c.id);
                      setEditCourseData({ name: c.name, attended: c.attended, missed: c.missed || 0, total: c.total });
                    }}><Pencil size={20} color="var(--text-secondary)"/></button>
                  )}
                  <button onClick={() => deleteCourse(c.id)}><Trash2 size={20} color="var(--btn-cross)"/></button>
                </div>
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
