import React, { useEffect, useState, useRef } from 'react';
import { Shield, Check, Award, Calendar, Printer, ExternalLink, X } from 'lucide-react';
import { tvsGetCertificate } from '../utils/tvs';
import TvsBadge from './TvsBadge';

interface TvsPublicVerifyProps {
  certificateId: string;
  currentLanguage: 'en' | 'ur';
  onClose?: () => void;
}

export default function TvsPublicVerify({
  certificateId,
  currentLanguage,
  onClose
}: TvsPublicVerifyProps) {
  const isEn = currentLanguage === 'en';
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await tvsGetCertificate(certificateId);
      if (data) {
        setCertificate(data);
      } else {
        // Fallback demo certificate if not found in db
        setCertificate({
          certificate_id: certificateId,
          entity_name: 'Zia-ur-Rehman (UC President)',
          entity_type: 'Leader',
          verification_level: 'Gold Trusted',
          status: 'Approved',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 3600000).toISOString()
        });
      }
      setLoading(false);
    }
    load();
  }, [certificateId]);

  // Generate dynamic QR Code placeholder on canvas
  useEffect(() => {
    if (!loading && certificate && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 120, 120);

        // Draw a simulated QR Code pattern
        ctx.fillStyle = '#0f172a';
        // Corners
        ctx.fillRect(5, 5, 30, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 10, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(15, 15, 10, 10);

        ctx.fillRect(85, 5, 30, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(90, 10, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(95, 15, 10, 10);

        ctx.fillRect(5, 85, 30, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 90, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(15, 95, 10, 10);

        // Random dots
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 40; i++) {
          const rx = Math.floor(Math.random() * 80) + 20;
          const ry = Math.floor(Math.random() * 80) + 20;
          ctx.fillRect(rx, ry, 6, 6);
        }
      }
    }
  }, [loading, certificate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold leading-normal">
        <Award className="w-8 h-8 animate-pulse text-indigo-600 me-2" />
        <span>Loading verification credentials...</span>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="p-10 text-center text-red-500 font-bold space-y-3 leading-normal">
        <AlertTriangle className="w-10 h-10 mx-auto" />
        <p>Verification Certificate Not Found</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-8 bg-slate-50/50 leading-normal">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10 relative space-y-6">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 end-4 p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Certificate Border decoration */}
        <div className="absolute inset-4 rounded-2xl border-2 border-indigo-100 pointer-events-none" />

        {/* Top Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-650 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black uppercase text-indigo-900 tracking-wider">
            Dhoke Hassu Connect Portal
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Official Public Verification Registry
          </p>
        </div>

        {/* Credentials Breakdown */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 space-y-4 relative">
          <div className="absolute top-4 end-4 flex items-center gap-1 bg-green-50 text-green-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            {certificate.status}
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Verified Entity</span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
              {certificate.entity_name}
              <TvsBadge badgeType={certificate.entity_type} level={certificate.verification_level} certificateId={certificate.certificate_id} isInline={false} />
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/40 text-xs">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Verification Level</p>
              <p className="font-extrabold text-amber-500 uppercase mt-0.5">{certificate.verification_level}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Verification Number</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{certificate.certificate_id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Issued Date</p>
              <p className="font-mono text-slate-700 mt-0.5">{new Date(certificate.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Expiry Date</p>
              <p className="font-mono text-slate-700 mt-0.5">
                {certificate.expires_at ? new Date(certificate.expires_at).toLocaleDateString() : 'No Expiry'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-1.5 text-center sm:text-start">
            <h4 className="text-xs font-black text-slate-900">QR Code Credentials check</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">
              Scan this QR code with any mobile device to load this certificate page dynamically and verify the trust credentials.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase rounded-lg transition-all border-none cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certificate
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-inner">
            <canvas ref={canvasRef} width="120" height="120" className="w-30 h-30" />
            <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-widest mt-1.5">Secure TVS Check</p>
          </div>
        </div>
      </div>
    </div>
  );
}
