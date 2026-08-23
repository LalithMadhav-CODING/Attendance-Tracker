import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

  // 1. Try Service Worker registration first
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

  // 2. Fallback to Window Notification object
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (e) {
    console.error('Notification constructor error:', e);
  }
  return false;
}

export function useNotifications(timetable, extraClasses, holidays, settings, courses, plannedAbsences = []) {
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const offsetMinutes = Number(settings.notificationOffset) || 15;
    const offsetMs = offsetMinutes * 60 * 1000;

    // --- NATIVE ANDROID ALARMS LOGIC ---
    const scheduleNativeNotifications = async () => {
      try {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          permStatus = await LocalNotifications.requestPermissions();
        }
        if (permStatus.display !== 'granted') return;

        // Clear existing to avoid duplicates on re-render
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const now = new Date();
        const pendingNotifications = [];
        let notifId = 1; // Basic sequential ID

        // Schedule for the next 7 days
        for (let i = 0; i < 7; i++) {
          const targetDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
          const offset = targetDate.getTimezoneOffset();
          const dateStr = new Date(targetDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
          
          if ((holidays || []).some(h => h.date === dateStr)) continue;
          if (plannedAbsences.includes(dateStr)) continue;
          if (settings.semesterStartDate && dateStr < settings.semesterStartDate) continue;
          if (settings.semesterEndDate && dateStr > settings.semesterEndDate) continue;

          const dayOfWeek = targetDate.getDay();
          
          const todaysExtra = (extraClasses || []).filter(e => e.date === dateStr);
          const todaysClasses = [
            ...(timetable || []).filter(t => parseInt(t.dayOfWeek) === dayOfWeek),
            ...todaysExtra
          ];

          for (const tClass of todaysClasses) {
            const course = (courses || []).find(c => c.id === tClass.courseId);
            if (!course) continue;

            const [hours, minutes] = tClass.time.split(':').map(Number);
            const classDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes, 0, 0);
            const classTimeMs = classDate.getTime();
            const notifyTargetMs = classTimeMs - offsetMs;

            // Only schedule if the alarm time is actually in the future
            if (notifyTargetMs > Date.now()) {
              pendingNotifications.push({
                id: notifId++,
                title: `Upcoming Class: ${course.name}`,
                body: `Starts at ${tClass.time} in ${tClass.classroom || 'Classroom'}`,
                schedule: { at: new Date(notifyTargetMs) },
              });
            }
          }
        }

        if (pendingNotifications.length > 0) {
          // Limit to 64 to avoid Android OS limits for scheduled alarms per app
          await LocalNotifications.schedule({ notifications: pendingNotifications.slice(0, 60) });
          console.log(`Scheduled ${Math.min(pendingNotifications.length, 60)} native notifications`);
        }

      } catch (e) {
        console.error('Failed to schedule native notifications:', e);
      }
    };

    // --- WEB TAB ACTIVE INTERVAL LOGIC ---
    const runWebIntervalCheck = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const checkAndNotify = () => {
        const now = new Date();
        const offsetLocal = now.getTimezoneOffset();
        const todayDate = new Date(now.getTime() - (offsetLocal * 60 * 1000)).toISOString().split('T')[0];
        
        const dayOfWeek = now.getDay();
        if ((holidays || []).some(h => h.date === todayDate)) return;
        if (plannedAbsences.includes(todayDate)) return;
        if (settings.semesterStartDate && todayDate < settings.semesterStartDate) return;
        if (settings.semesterEndDate && todayDate > settings.semesterEndDate) return;

        const todaysExtra = (extraClasses || []).filter(e => e.date === todayDate);
        const todaysClasses = [
          ...(timetable || []).filter(t => parseInt(t.dayOfWeek) === dayOfWeek),
          ...todaysExtra
        ];

        let notifiedLog = {};
        try {
          notifiedLog = JSON.parse(localStorage.getItem('at_notified_classes') || '{}');
        } catch {
          notifiedLog = {};
        }

        const currentMs = Date.now();
        todaysClasses.forEach(tClass => {
          const course = (courses || []).find(c => c.id === tClass.courseId);
          if (!course) return;

          const [hours, minutes] = tClass.time.split(':').map(Number);
          const classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
          const classTimeMs = classDate.getTime();
          const notifyTargetMs = classTimeMs - offsetMs;

          const logKey = `${todayDate}_${tClass.id}_${tClass.time}`;

          if (currentMs >= notifyTargetMs && currentMs <= classTimeMs + (5 * 60 * 1000)) {
            if (!notifiedLog[logKey]) {
              sendNotification(`Upcoming Class: ${course.name}`, {
                body: `Starts at ${tClass.time} in ${tClass.classroom || 'Classroom'}`,
                tag: `class-${logKey}`,
                data: { classId: tClass.id, url: '/' }
              });
              notifiedLog[logKey] = currentMs;
              localStorage.setItem('at_notified_classes', JSON.stringify(notifiedLog));
            }
          }
        });
      };

      checkAndNotify();
      const interval = setInterval(checkAndNotify, 10000);
      return () => clearInterval(interval);
    };

    if (Capacitor.isNativePlatform()) {
      scheduleNativeNotifications();
    } else {
      return runWebIntervalCheck();
    }
  }, [timetable, extraClasses, holidays, settings, courses, plannedAbsences]);
}
