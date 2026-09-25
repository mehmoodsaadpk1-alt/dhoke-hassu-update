import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCcw, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { QRAuthService } from '../services/QRAuthService';
import { AppButton } from './ui';

interface QRLoginProps {
  onCancel: () => void;
}

export default function QRLogin({ onCancel }: QRLoginProps) {
  const [requestInfo, setRequestInfo] = useState<{ id: string; rawChallenge: string; challengeHash: string; expiresAt: Date } | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'expired' | 'error' | 'signing_in' | 'exchange_error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const pollingInterval = useRef<number | null>(null);

  const generateNewRequest = async () => {
    setStatus('loading');
    if (pollingInterval.current) {
      window.clearInterval(pollingInterval.current);
    }

    const req = await QRAuthService.createLoginRequest();
    if (req) {
      const challengeHash = await QRAuthService.hashChallenge(req.rawChallenge);
      setRequestInfo({ ...req, challengeHash });
      setStatus('pending');
      setTimeLeft(Math.floor((req.expiresAt.getTime() - Date.now()) / 1000));
      
      // Start polling
      pollingInterval.current = window.setInterval(async () => {
        const currentStatus = await QRAuthService.checkStatus(req.id, challengeHash);
        if (currentStatus === 'approved') {
          setStatus('signing_in');
          window.clearInterval(pollingInterval.current!);
          
          // Initiate exchange
          const exchangeResult = await QRAuthService.exchangePcLogin(req.id, req.rawChallenge);
          if (exchangeResult.success && exchangeResult.token_hash) {
             const { supabase } = await import('../utils/supabaseClient');
             if (supabase) {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                   token_hash: exchangeResult.token_hash,
                   type: 'magiclink'
                });
                
                if (verifyError) {
                   setErrorMessage('Unable to complete PC login. Please generate a new QR code and try again.');
                   setStatus('exchange_error');
                }
                // If successful, onAuthStateChange in App.tsx takes over and redirects
             }
          } else {
             if (exchangeResult.error === 'pc_login_requires_email') {
                setErrorMessage('PC login requires an email address on this account.');
             } else if (exchangeResult.error === 'already_used') {
                setErrorMessage('This QR login has already been used. Generate a new QR code.');
             } else if (exchangeResult.error === 'challenge_mismatch' || exchangeResult.error === 'unknown_request') {
                setErrorMessage('This QR code is no longer valid. Generate a new one.');
             } else if (exchangeResult.error === 'expired') {
                setErrorMessage('QR code expired. Generate a new QR code.');
                setStatus('expired');
                return;
             } else {
                setErrorMessage('Unable to complete PC login. Please generate a new QR code and try again.');
             }
             setStatus('exchange_error');
          }
        } else if (currentStatus === 'cancelled') {
          setErrorMessage('Failed to generate request');
          setStatus('error');
          window.clearInterval(pollingInterval.current!);
        }
      }, 3000);
    } else {
      setErrorMessage('Failed to generate request');
      setStatus('error');
    }
  };

  useEffect(() => {
    generateNewRequest();
    return () => {
      if (pollingInterval.current) {
        window.clearInterval(pollingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== 'pending' || !requestInfo) return;

    const timer = window.setInterval(() => {
      const remaining = Math.floor((requestInfo.expiresAt.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus('expired');
        if (pollingInterval.current) {
          window.clearInterval(pollingInterval.current);
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, requestInfo]);

  const qrPayload = requestInfo ? JSON.stringify({
    scheme: 'dhconnect://qr-login',
    id: requestInfo.id,
    challenge: requestInfo.rawChallenge
  }) : '';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl w-full" dir="ltr">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 font-['Noto_Sans_Arabic']">PC Login</h2>
        <p className="text-sm text-slate-500 mt-2">Open the Dhoke Hassu Connect App on your phone to scan this code.</p>
      </div>

      <div className="relative flex items-center justify-center bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner w-64 h-64 mb-6">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#348A54]"></div>
        )}
        
        {status === 'pending' && requestInfo && (
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <QRCodeSVG value={qrPayload} size={180} level="M" />
          </div>
        )}

        {status === 'signing_in' && (
          <div className="flex flex-col items-center text-[#348A54]">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#348A54] mb-4"></div>
            <p className="font-bold">Signing you in...</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center text-slate-400">
            <XCircle className="w-12 h-12 mb-4" />
            <p className="font-bold text-center">QR code expired. Generate a new QR code.</p>
          </div>
        )}

        {(status === 'error' || status === 'exchange_error') && (
          <div className="flex flex-col items-center text-red-400">
            <XCircle className="w-12 h-12 mb-4" />
            <p className="font-bold text-center">{errorMessage || 'Failed to complete login'}</p>
          </div>
        )}
      </div>

      {status === 'pending' && (
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-slate-600">
            Expires in: <span className="font-bold text-[#348A54]">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </p>
        </div>
      )}

      {(status === 'expired' || status === 'error' || status === 'exchange_error') && (
        <AppButton 
          onClick={generateNewRequest}
          className="mb-4 w-full bg-[#348A54] hover:bg-[#2A7649]"
          leadingIcon={<RefreshCcw className="w-4 h-4" />}
        >
          Generate New QR Code
        </AppButton>
      )}

      <button
        onClick={onCancel}
        className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        Cancel & Use Password
      </button>

      {/* Development Simulation Only (Phase 1) */}
      {status === 'pending' && requestInfo && process.env.NODE_ENV === 'development' && (
        <button 
          onClick={async () => {
            const { supabase } = await import('../utils/supabaseClient');
            if (supabase) {
              await supabase.rpc('simulate_approve_pc_login', { p_id: requestInfo.id });
            }
          }}
          className="mt-8 text-xs text-slate-300 hover:text-[#348A54] transition-colors"
        >
          [Dev: Simulate Android Scan]
        </button>
      )}
    </div>
  );
}
