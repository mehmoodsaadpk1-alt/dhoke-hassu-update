import React, { useState, useEffect, useCallback } from 'react';
import { analytics } from '../services/AnalyticsService';
import { Activity, X, Trash2, Power, PowerOff, Copy, RefreshCw, CheckCircle, Database } from 'lucide-react';

export default function AnalyticsDebugPanel() {
  const isDev = import.meta.env.DEV;
  
  if (!isDev) return null; // Only ever render in DEV

  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);

  const updateSnapshot = useCallback(() => {
    setSnapshot(analytics.getDebugSnapshot());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateSnapshot();
      const unsubscribe = analytics.subscribeDebug(updateSnapshot);
      return unsubscribe;
    }
  }, [isOpen, updateSnapshot]);

  if (!isOpen || !snapshot) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(snapshot.queueSnapshot, null, 2));
    alert('Queue copied to clipboard!');
  };

  const generateReport = () => {
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    alert('Debug report copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      <div className="pointer-events-auto bg-gray-900 border border-gray-700 shadow-2xl rounded-2xl w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden text-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-500 w-5 h-5" />
            <h2 className="text-lg font-bold">Analytics Debug Panel</h2>
            <span className="text-xs bg-emerald-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">DEV</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400">Status</div>
              <div className="font-mono text-sm flex items-center gap-1 mt-1">
                {snapshot.isEnabled ? <CheckCircle className="w-4 h-4 text-green-500"/> : <PowerOff className="w-4 h-4 text-red-500"/>}
                {snapshot.isEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400">Queue / Pending</div>
              <div className="font-mono text-sm mt-1">{snapshot.queueSize} events</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400">Uploading State</div>
              <div className="font-mono text-sm mt-1 flex items-center gap-1">
                {snapshot.isFlushing ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400"/> : <Database className="w-4 h-4 text-gray-400"/>}
                {snapshot.isFlushing ? `Flushing (Att: ${snapshot.currentAttemptCount})` : 'Idle'}
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400">Network</div>
              <div className="font-mono text-sm mt-1">
                {snapshot.networkOnline ? <span className="text-green-400">Online</span> : <span className="text-red-400">Offline</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Metrics</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span>Total Sent:</span> <span className="text-green-400">{snapshot.totalEventsSent}</span></div>
                <div className="flex justify-between"><span>Total Dropped:</span> <span className="text-red-400">{snapshot.totalEventsDropped}</span></div>
                <div className="flex justify-between"><span>Last Result:</span> 
                  <span className={snapshot.lastUploadResult === 'success' ? 'text-green-400' : snapshot.lastUploadResult === 'failed' ? 'text-red-400' : 'text-gray-500'}>
                    {snapshot.lastUploadResult || 'None'}
                  </span>
                </div>
                <div className="flex justify-between"><span>Last Time:</span> <span>{snapshot.lastUploadTime ? new Date(snapshot.lastUploadTime).toLocaleTimeString() : 'N/A'}</span></div>
                <div className="flex justify-between"><span>User ID:</span> <span className="truncate ml-2" title={snapshot.currentUserId}>{snapshot.currentUserId || 'Anonymous'}</span></div>
              </div>
            </div>

            <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Recent Errors</h3>
              <div className="space-y-2 text-xs font-mono break-all">
                <div>
                  <span className="text-gray-500">Last Retryable:</span><br/>
                  <span className="text-yellow-400">{snapshot.lastRetryableError || 'None'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Permanent:</span><br/>
                  <span className="text-red-400">{snapshot.lastPermanentError || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => analytics.flush()} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                <Activity className="w-4 h-4"/> Flush Queue
              </button>
              <button onClick={() => analytics.reset()} className="bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                <Trash2 className="w-4 h-4"/> Clear Queue
              </button>
              {snapshot.isEnabled ? (
                <button onClick={() => analytics.disable()} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                  <PowerOff className="w-4 h-4"/> Disable SDK
                </button>
              ) : (
                <button onClick={() => analytics.enable()} className="bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                  <Power className="w-4 h-4"/> Enable SDK
                </button>
              )}
              <button onClick={handleCopyJSON} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                <Copy className="w-4 h-4"/> Copy Queue
              </button>
              <button onClick={generateReport} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors">
                <Database className="w-4 h-4"/> Generate Report
              </button>
              <button onClick={updateSnapshot} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ml-auto">
                <RefreshCw className="w-4 h-4"/> Refresh
              </button>
            </div>
          </div>

          {/* Last 20 Events */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase flex justify-between">
              <span>Recent Events Inspector</span>
              <span>Showing last {snapshot.recentProcessedEvents.length}</span>
            </h3>
            <div className="overflow-y-auto bg-gray-950 rounded-xl border border-gray-700 flex-1 p-2 space-y-2">
              {snapshot.recentProcessedEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">No recent events processed</div>
              ) : (
                snapshot.recentProcessedEvents.map((ev: any, i: number) => (
                  <div key={i} className={`p-2 rounded border text-xs font-mono ${ev._dropped ? 'border-red-900/50 bg-red-900/10' : 'border-gray-800 bg-gray-900'}`}>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span className="font-bold text-blue-400">{ev.event_type}</span>
                      <span>{ev.metadata?.timestamp ? new Date(ev.metadata.timestamp).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-300">
                      <div><span className="text-gray-500">Module:</span> {ev.metadata?.module || 'None'}</div>
                      <div className="truncate"><span className="text-gray-500">User:</span> {ev.user_id || 'Anon'}</div>
                      {ev.entity_type && <div><span className="text-gray-500">Entity:</span> {ev.entity_type}</div>}
                      {ev._dropped && <div className="text-red-400 col-span-2 mt-1">Status: Dropped (Permanent Error)</div>}
                    </div>
                    <div className="mt-1 pt-1 border-t border-gray-800 text-gray-500 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(ev.metadata, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

