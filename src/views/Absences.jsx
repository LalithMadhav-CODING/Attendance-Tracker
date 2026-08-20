import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Absences({ plannedAbsences, setPlannedAbsences, holidays, setHolidays, timetable, courses, settings }) {
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const addAbsence = (e) => {
    e.preventDefault();
    if (!absenceStartDate) return;

    let curr = new Date(absenceStartDate + 'T00:00:00');
    let end = new Date((absenceEndDate || absenceStartDate) + 'T00:00:00');
    
    if (end < curr) {
      alert("End date cannot be before start date");
      return;
    }

    const newAbsences = new Set(plannedAbsences);
    let hasClassesToSkip = false;
    
    while (curr <= end) {
      const offset = curr.getTimezoneOffset();
      const dateStr = new Date(curr.getTime() - (offset*60*1000)).toISOString().split('T')[0];
      
      if (holidays.some(h => h.date === dateStr)) {
        alert(`Cannot add absence on ${dateStr} as it is already a holiday.`);
        return;
      }
      
      if (timetable.some(t => parseInt(t.dayOfWeek) === curr.getDay())) {
        hasClassesToSkip = true;
      }
      
      newAbsences.add(dateStr);
      curr.setDate(curr.getDate() + 1);
    }
    
    if (!hasClassesToSkip) {
      alert("You have no classes scheduled on the selected date(s). No absence needed!");
      return;
    }
    
    setPlannedAbsences(Array.from(newAbsences).sort());
    setAbsenceStartDate('');
    setAbsenceEndDate('');
  };

  const removeAbsence = (date) => {
    setPlannedAbsences(plannedAbsences.filter(d => d !== date));
  };

  const addHoliday = (e) => {
    e.preventDefault();
    if (!holidayStartDate) return;

    let curr = new Date(holidayStartDate + 'T00:00:00');
    let end = new Date((holidayEndDate || holidayStartDate) + 'T00:00:00');
    
    if (end < curr) {
      alert("End date cannot be before start date");
      return;
    }

    const newHolidaysMap = new Map();
    holidays.forEach(h => newHolidaysMap.set(h.date, h));
    
    while (curr <= end) {
      const offset = curr.getTimezoneOffset();
      const dateStr = new Date(curr.getTime() - (offset*60*1000)).toISOString().split('T')[0];
      
      if (plannedAbsences.includes(dateStr)) {
        alert(`Cannot add holiday on ${dateStr} as it is marked as a planned absence. Please remove the absence first.`);
        return;
      }

      newHolidaysMap.set(dateStr, { date: dateStr, name: holidayName.trim() });
      curr.setDate(curr.getDate() + 1);
    }
    
    setHolidays(Array.from(newHolidaysMap.values()).sort((a,b) => a.date.localeCompare(b.date)));
    setHolidayStartDate('');
    setHolidayEndDate('');
    setHolidayName('');
  };

  const removeHoliday = (date) => {
    setHolidays(holidays.filter(h => h.date !== date));
  };

  // Projection Logic
  const getWarnings = () => {
    if (!settings.semesterStartDate || !settings.semesterEndDate) {
      return ["Please set both Semester Start and End Dates in Settings to see warnings."];
    }
    
    const warnings = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(settings.semesterStartDate);
    const end = new Date(settings.semesterEndDate);
    
    if (end < start) return ["Semester End Date cannot be before Start Date."];
    if (end < today) return ["Semester End Date is in the past."];

    const evaluationStart = today < start ? start : today;
    const target = (settings.targetAttendance || 75) / 100;
    
    // Now calculate impact of planned absences
    courses.forEach(c => {
      let finalTotal = c.total;
      // If perfect attendance from now on, final attended is total - what they already missed
      let finalAttended = c.total - (c.missed || 0);
      
      // Subtract absences
      plannedAbsences.forEach(dateStr => {
        const d = new Date(dateStr);
        if (d >= evaluationStart && d <= end && !holidays.some(h => h.date === dateStr)) {
          const dayOfWeek = d.getDay();
          const missedClasses = timetable.filter(t => parseInt(t.dayOfWeek) === dayOfWeek && t.courseId === c.id);
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
        <form onSubmit={addAbsence} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>From</div>
            <input type="date" value={absenceStartDate} onChange={e => setAbsenceStartDate(e.target.value)} style={{ width: '100%' }} required />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>To (Optional)</div>
            <input type="date" value={absenceEndDate} onChange={e => setAbsenceEndDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px', height: '45px' }}>Add</button>
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
        <form onSubmit={addHoliday} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>From</div>
            <input type="date" value={holidayStartDate} onChange={e => setHolidayStartDate(e.target.value)} style={{ width: '100%' }} required />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>To (Optional)</div>
            <input type="date" value={holidayEndDate} onChange={e => setHolidayEndDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>Name (Optional)</div>
            <input placeholder="e.g. Thanksgiving" value={holidayName} onChange={e => setHolidayName(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '8px', height: '45px' }}>Add</button>
        </form>
        <div style={{ marginTop: '10px' }}>
          {holidays.map(h => (
            <div key={h.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{h.date} {h.name ? `- ${h.name}` : ''}</span>
              <button onClick={() => removeHoliday(h.date)}><Trash2 size={20} color="var(--btn-cross)"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
