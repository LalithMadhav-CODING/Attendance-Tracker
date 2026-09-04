import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export function useAutoUpdate() {
  const [updateStatus, setUpdateStatus] = useState({
    checking: false,
    available: false,
    downloading: false,
    version: null,
    error: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Always inform CapacitorUpdater that the web content loaded successfully
    // to prevent automatic rollback.
    CapacitorUpdater.notifyAppReady()
      .catch(err => console.warn('CapacitorUpdater notifyAppReady error:', err));

    // Listen for download/update events from the plugin
    let downloadListener;
    let updateListener;

    CapacitorUpdater.addListener('download', (info) => {
      console.log('Update downloaded:', info);
      setUpdateStatus(prev => ({ ...prev, available: true, downloading: false, version: info.version }));
    }).then(l => { downloadListener = l; }).catch(() => {});

    CapacitorUpdater.addListener('updateAvailable', (info) => {
      console.log('Update available:', info);
      setUpdateStatus(prev => ({ ...prev, available: true, version: info.version }));
    }).then(l => { updateListener = l; }).catch(() => {});

    return () => {
      if (downloadListener?.remove) downloadListener.remove();
      if (updateListener?.remove) updateListener.remove();
    };
  }, []);

  const reloadToUpdate = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await CapacitorUpdater.reload();
    } catch (err) {
      console.error('Failed to reload with update:', err);
    }
  };

  return { updateStatus, reloadToUpdate };
}
