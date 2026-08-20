import React from 'react';

export default function Logs({ attendanceLogs, timetable, extraClasses, courses }) {
  const missedClasses = [];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  Object.entries(attendanceLogs).forEach(([dateStr, logs]) => {
    Object.entries(logs).forEach(([classId, status]) => {
      if (status === 'missed') {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = days[dateObj.getDay()];

        // Find class in timetable or extraClasses
        let classDetails = timetable.find(t => t.id === classId) || extraClasses.find(e => e.id === classId);
        
        if (classDetails) {
          const course = courses.find(c => c.id === classDetails.courseId);
          if (course) {
            missedClasses.push({
              date: dateStr,
              day: dayOfWeek,
              courseName: course.name,
              time: classDetails.time,
              classroom: classDetails.classroom
            });
          }
        }
      }
    });
  });

  // Sort missed classes by date descending
  missedClasses.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Missed Classes Record</h2>
      
      {missedClasses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-secondary)' }}>
          <h3>No missed classes! Great job!</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {missedClasses.map((item, index) => (
            <div key={index} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{item.courseName}</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {item.date} ({item.day})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>{item.time}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{item.classroom}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
