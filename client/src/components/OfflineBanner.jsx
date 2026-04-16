import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-700 text-white px-4 py-2 flex items-center gap-2 z-50">
      <WifiOff size={16} />
      <span className="text-sm">Offline mode — limited features available</span>
    </div>
  );
}

export default OfflineBanner;
