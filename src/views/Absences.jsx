import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Absences({ plannedAbsences, setPlannedAbsences, holidays, setHolidays, timetable, courses, settings }) {
  const [absenceDate, setAbsenceDate] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const addAbsence = (e) => {
    e.preventDefault();
    if (!absenceDate || plannedAbsences.includes(absenceDate)) return;
    setPlannedAbsences([...plannedAbsences, absenceDate].sort());
    setAbsenceDate('');
  };

  const removeAbsence = (date) => {
    setPlannedAbsences(plannedAbsences.filter(d => d !== date));
  };

  const addHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate || holidays.includes(holidayDate)) return;
    setHolidays([...holidays, holidayDate].sort());
    setHolidayDate('');
  };

  const removeHoliday = (date) => {
    setHolidays(holidays.filter(d => d !== date));
  };

  // Projection Logic
  const getWarnings = () => {
    if (!settings.semesterEndDate) return ["Please set Semester End Date in Settings to see warnings."];
    
    const warnings = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(settings.semesterEndDate);
    
    if (end < today) return ["Semester End Date is in the past."];

    const target = (settings.targetAttendance || 75) / 100;
    
    // Calculate remaining classes
    const remainingClasses = {}; // courseId -> count
    courses.forEach(c => remainingClasses[c.id] = 0);

    let curr = new Date(today);
    curr.setDate(curr.getDate() + 1); // Start from tomorrow

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayOfWeek = curr.getDay();
      
      if (!holidays.includes(dateStr)) {
        const classesThatDay = timetable.filter(t => t.dayOfWeek === dayOfWeek);
        classesThatDay.forEach(t => {
          if (remainingClasses[t.courseId] !== undefined) {
            remainingClasses[t.courseId]++;
          }
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    // Now calculate impact of planned absences
    courses.forEach(c => {
      let finalTotal = c.total + remainingClasses[c.id];
      let finalAttended = c.attended + remainingClasses[c.id];
      
      // Subtract absences
      plannedAbsences.forEach(dateStr => {
        const d = new Date(dateStr);
        if (d > today && d <= end && !holidays.includes(dateStr)) {
          const dayOfWeek = d.getDay();
          const missedClasses = timetable.filter(t => t.dayOfWeek === dayOfWeek && t.courseId === c.id);
          finalAttended -= missedClasses.length;
        }
      });

      if (finalTotal > 0) {
        const finalPercent = finalAttended / finalTotal;
        if (finalPercent < target) {
          warnings.push(`Warning: ${c.name} will drop to ${Math.round(finalPercent * 100)}% by end of semester.`);
        }
      }
    });

    if (warnings.length === 0) return ["No warnings! You are on track."];
    return warnings;
  };

  const warnings = getWarnings();

  return (
    <div>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Planned Absences</h2>
      
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>Projection Warnings</h3>
        <ul style={{ paddingLeft: '20px', color: warnings[0].startsWith('Warning') ? 'var(--btn-cross)' : 'var(--text-primary)' }}>
          {warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '10px' }}>Skip Days</h3>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Select days you plan to be absent. These will count as missed classes.</p>
        <form onSubmit={addAbsence} style={{ display: 'flex', gap: '10px' }}>
          <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} style={{ flex: 1 }} required />
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add</button>
        </form>
        <div style={{ marginTop: '10px' }}>
          {plannedAbsences.map(d => (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{d}</span>
              <button onClick={() => removeAbsence(d)}><Trash2 size={20} color="var(--btn-cross)"/></button>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ margin: '30px 0 20px', textAlign: 'center' }}>Holidays</h2>
      <div className="card">
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Select official holidays. Classes on these days won't be counted.</p>
        <form onSubmit={addHoliday} style={{ display: 'flex', gap: '10px' }}>
          <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} style={{ flex: 1 }} required />
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px' }}>Add</button>
        </form>
        <div style={{ marginTop: '10px' }}>
          {holidays.map(d => (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{d}</span>
              <button onClick={() => removeHoliday(d)}><Trash2 size={20} color="var(--btn-cross)"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
