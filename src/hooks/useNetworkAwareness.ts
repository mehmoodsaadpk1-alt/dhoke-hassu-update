import { useState, useEffect } from 'react';

export interface NetworkInfo {
  isSaveData: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  isSlowConnection: boolean;
}

/**
 * Hook for Network Information API to adapt streaming strategies.
 */
export const useNetworkAwareness = (): NetworkInfo => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isSaveData: false,
    effectiveType: '4g',
    isSlowConnection: false
  });

  useEffect(() => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) return;

    const updateConnectionStatus = () => {
      const isSaveData = connection.saveData === true;
      const effectiveType = connection.effectiveType || '4g';
      const isSlowConnection = isSaveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';

      setNetworkInfo({
        isSaveData,
        effectiveType,
        isSlowConnection
      });
    };

    updateConnectionStatus();

    connection.addEventListener('change', updateConnectionStatus);
    return () => connection.removeEventListener('change', updateConnectionStatus);
  }, []);

  return networkInfo;
};
