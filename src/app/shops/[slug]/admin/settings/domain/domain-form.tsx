'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, CheckCircle2, XCircle, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { updateCustomDomain, verifyDomain, removeDomain } from './actions';

interface DomainFormProps {
  storeId: string;
  storeSlug: string;
  currentDomain: string | null;
}

export function DomainForm({ storeId, storeSlug, currentDomain }: DomainFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domain, setDomain] = useState(currentDomain || '');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Vercel's IP for A record (or CNAME to cname.vercel-dns.com)
  const VERCEL_IP = '76.76.21.21';
  const VERCEL_CNAME = 'cname.vercel-dns.com';

  const handleSaveDomain = async () => {
    if (!domain.trim()) {
      setError('נא להזין דומיין');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      setError('פורמט דומיין לא תקין');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateCustomDomain(storeId, domain.trim());
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleVerify = async () => {
    setVerificationStatus('verifying');
    startTransition(async () => {
      const result = await verifyDomain(domain);
      if (result.verified) {
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('failed');
        setError(result.error || 'הדומיין לא מופנה נכון');
      }
    });
  };

  const handleRemove = async () => {
    if (!confirm('האם אתה בטוח שברצונך להסיר את הדומיין המותאם?')) return;
    
    startTransition(async () => {
      const result = await removeDomain(storeId);
      if (result.success) {
        setDomain('');
        setVerificationStatus('idle');
        router.refresh();
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current Domain Status */}
      {currentDomain && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{currentDomain}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  דומיין מחובר
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                הסר
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Domain */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {currentDomain ? 'שנה דומיין' : 'הוסף דומיין מותאם'}
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              דומיין
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setVerificationStatus('idle');
                  setError(null);
                }}
                placeholder="example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                dir="ltr"
              />
              <button
                onClick={handleSaveDomain}
                disabled={isPending || !domain.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                שמור
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* DNS Configuration Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900">הגדרות DNS</h3>
            <p className="text-sm text-gray-600">
              הוסף את הרשומה הבאה בהגדרות ה-DNS של הדומיין שלך:
            </p>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">סוג</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">שם</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">ערך</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-gray-900">A</td>
                    <td className="px-4 py-3 font-mono text-gray-900">@</td>
                    <td className="px-4 py-3 font-mono text-gray-900">{VERCEL_IP}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyToClipboard(VERCEL_IP)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-sm text-gray-600 mt-3">או לחילופין, CNAME (מומלץ לתת-דומיינים):</p>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">סוג</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">שם</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">ערך</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-gray-900">CNAME</td>
                    <td className="px-4 py-3 font-mono text-gray-900">www</td>
                    <td className="px-4 py-3 font-mono text-gray-900">{VERCEL_CNAME}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyToClipboard(VERCEL_CNAME)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-sm text-gray-500 space-y-2">
              <p>💡 <strong>טיפ:</strong> אם אתה משתמש ב-Cloudflare, ודא שה-proxy (ענן כתום) כבוי.</p>
              <p>⏱️ שינויי DNS עשויים לקחת עד 48 שעות להתפשט.</p>
              <p>🔒 Vercel מספק SSL אוטומטית לאחר שהדומיין מופנה נכון.</p>
            </div>
          </div>

          {/* Verify Button */}
          {domain && domain !== currentDomain && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleVerify}
                disabled={isPending || verificationStatus === 'verifying'}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {verificationStatus === 'verifying' && <Loader2 className="w-4 h-4 animate-spin" />}
                {verificationStatus === 'verified' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {verificationStatus === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                בדוק חיבור
              </button>
              
              {verificationStatus === 'verified' && (
                <span className="text-sm text-green-600">הדומיין מחובר בהצלחה!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Default URL Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>כתובת ברירת מחדל:</strong>{' '}
          <span dir="ltr" className="font-mono">my-quickshop.com/shops/{storeSlug}</span>
        </p>
        <p className="text-sm text-blue-600 mt-1">
          כתובת זו תמיד תעבוד גם אם יש לך דומיין מותאם.
        </p>
      </div>
    </div>
  );
}

