import { useEffect } from 'react';

export async function sendNotification(title, options = {}) {
  const defaultOptions = {
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    renotify: true,
    vibrate: [200, 100, 200],
    ...options
  };

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  // 1. Try Service Worker registration first (standard for Android / PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    } catch (e) {
      console.warn('ServiceWorker showNotification failed, trying fallback:', e);
    }
  }

  // 2. Fallback to Window Notification object (Desktop / non-PWA)
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (e) {
    console.error('Notification constructor error:', e);
  }
  return false;
}

export function useNotifications(timetable, extraClasses, holidays, settings, courses) {
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkAndNotify = () => {
      const offsetMinutes = Number(settings.notificationOffset) || 15;
      const offsetMs = offsetMinutes * 60 * 1000;

      const now = new Date();
      const offset = now.getTimezoneOffset();
      const todayDate = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
      
      const dayOfWeek = now.getDay();
      const isHoliday = (holidays || []).some(h => h.date === todayDate);
      if (isHoliday) return;

      const todaysExtra = (extraClasses || []).filter(e => e.date === todayDate);
      const todaysClasses = [
        ...(timetable || []).filter(t => parseInt(t.dayOfWeek) === dayOfWeek),
        ...todaysExtra
      ];

      // Read notified log from localStorage
      let notifiedLog = {};
      let scheduledTriggers = {};
      try {
        notifiedLog = JSON.parse(localStorage.getItem('at_notified_classes') || '{}');
      } catch {
        notifiedLog = {};
      }
      try {
        scheduledTriggers = JSON.parse(localStorage.getItem('at_scheduled_triggers') || '{}');
      } catch {
        scheduledTriggers = {};
      }

      // Cleanup old scheduled triggers (older than 24h)
      const currentMs = Date.now();
      let triggersCleaned = false;
      Object.keys(scheduledTriggers).forEach(key => {
        if (scheduledTriggers[key] < currentMs - (24 * 60 * 60 * 1000)) {
          delete scheduledTriggers[key];
          triggersCleaned = true;
        }
      });
      if (triggersCleaned) {
        localStorage.setItem('at_scheduled_triggers', JSON.stringify(scheduledTriggers));
      }

      todaysClasses.forEach(tClass => {
        const course = (courses || []).find(c => c.id === tClass.courseId);
        if (!course) return;

        const [hours, minutes] = tClass.time.split(':').map(Number);
        const classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        const classTimeMs = classDate.getTime();
        const notifyTargetMs = classTimeMs - offsetMs;

        const logKey = `${todayDate}_${tClass.id}_${tClass.time}`;

        // If we are within the window (between notification target and class start + 5 minutes grace)
        // and have not notified for this exact class/time today yet
        if (currentMs >= notifyTargetMs && currentMs <= classTimeMs + (5 * 60 * 1000)) {
          if (!notifiedLog[logKey]) {
            sendNotification(`Upcoming Class: ${course.name}`, {
              body: `Starts at ${tClass.time} in ${tClass.classroom || 'Classroom'}`,
              tag: `class-${logKey}`,
              renotify: true,
              data: { classId: tClass.id, url: '/' }
            });
            notifiedLog[logKey] = currentMs;
            localStorage.setItem('at_notified_classes', JSON.stringify(notifiedLog));
          }
        }

        // Also schedule experimental background TimestampTrigger if supported and time is in future
        if (notifyTargetMs > currentMs && 'showTrigger' in Notification.prototype && 'TimestampTrigger' in window) {
          if (!scheduledTriggers[logKey]) {
            // Optimistically mark as scheduled to prevent rapid duplicate attempts
            scheduledTriggers[logKey] = notifyTargetMs;
            localStorage.setItem('at_scheduled_triggers', JSON.stringify(scheduledTriggers));
            
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(`Upcoming Class: ${course.name}`, {
                  body: `Starts at ${tClass.time} in ${tClass.classroom || 'Classroom'}`,
                  icon: '/icon-512.png',
                  tag: `trigger-${logKey}`,
                  renotify: true,
                  showTrigger: new window.TimestampTrigger(notifyTargetMs),
                  data: { classId: tClass.id, url: '/' }
                }).catch((err) => {
                  console.error('Trigger scheduling failed:', err);
                  // Remove on failure so we can try again
                  delete scheduledTriggers[logKey];
                  localStorage.setItem('at_scheduled_triggers', JSON.stringify(scheduledTriggers));
                });
              });
            }
          }
        }
      });
    };

    // Run check immediately
    checkAndNotify();

    // Check periodically every 10 seconds while the app/tab is active
    const interval = setInterval(checkAndNotify, 10000);

    return () => clearInterval(interval);
  }, [timetable, extraClasses, holidays, settings, courses]);
}
