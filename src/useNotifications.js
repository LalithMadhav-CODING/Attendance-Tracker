import { useEffect, useRef } from 'react';

export function useNotifications(timetable, extraClasses, holidays, settings, courses) {
  const timeoutsRef = useRef({});

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const offsetMinutes = settings.notificationOffset ?? 15;
    const offsetMs = offsetMinutes * 60 * 1000;

    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayDate = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    
    const dayOfWeek = today.getDay();
    const isHoliday = holidays.includes(todayDate);
    
    if (isHoliday) return;

    const todaysExtra = (extraClasses || []).filter(e => e.date === todayDate);
    const todaysClasses = [...timetable.filter(t => parseInt(t.dayOfWeek) === dayOfWeek), ...todaysExtra];

    todaysClasses.forEach(tClass => {
      const course = courses.find(c => c.id === tClass.courseId);
      if (!course) return;

      const [hours, minutes] = tClass.time.split(':').map(Number);
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      const targetTimeMs = classTime.getTime() - offsetMs;
      const timeToTarget = targetTimeMs - Date.now();

      if (timeToTarget > 0) {
        if (timeoutsRef.current[tClass.id]) {
          clearTimeout(timeoutsRef.current[tClass.id]);
        }

        const title = `Upcoming Class: ${course.name}`;
        const options = {
          body: `Starts at ${tClass.time} in ${tClass.classroom}`,
          icon: '/icon-512.png',
          tag: `class-${todayDate}-${tClass.id}`,
        };

        if ('showTrigger' in Notification.prototype && 'TimestampTrigger' in window) {
           if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then(registration => {
               registration.showNotification(title, {
                 ...options,
                 showTrigger: new window.TimestampTrigger(targetTimeMs)
               }).catch(e => console.error("Failed to schedule notification trigger:", e));
             });
           }
        } else {
           // Fallback for when the app is open
           timeoutsRef.current[tClass.id] = setTimeout(() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(title, options);
                });
              } else {
                new Notification(title, options);
              }
           }, timeToTarget);
        }
      }
    });

    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
    };

  }, [timetable, extraClasses, holidays, settings, courses]);
}
