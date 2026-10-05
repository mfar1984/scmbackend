'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useDateFormat } from '../../lib/useDateFormat';

type Details = {
  full_name: string; position_applied: string | null;
  interview_date: string | null; interview_time: string | null;
  interview_location: string | null; interview_notes: string | null;
  substatus: string | null;
};

export default function ConfirmInterviewPage() {
  const router = useRouter();
  const { fmt } = useDateFormat();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError]     = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/confirm-interview?token=${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setDetails(json.data);
          if (json.data.substatus === 'Confirmed') setConfirmed(true);
        } else setError(json.message || 'Invalid link.');
      })
      .catch(() => setError('Failed to load interview details.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch('/api/public/confirm-interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) { setConfirmed(true); setDetails(json.data); }
      else setError(json.message || 'Failed to confirm.');
    } catch { setError('Network error.'); }
    finally { setConfirming(false); }
  };

  return (
    <>
      <Head><title>Confirm Interview — ATLINE SDN BHD</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#6a1b9a,#8e24aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#6a1b9a,#8e24aa)', padding: 28, textAlign: 'center', color: '#fff' }}>
            <i className="bi bi-calendar2-check" style={{ fontSize: 34 }}></i>
            <h1 style={{ fontSize: 21, fontWeight: 600, margin: '10px 0 0' }}>Interview Invitation</h1>
            <p style={{ margin: '4px 0 0', opacity: .85, fontSize: 14 }}>ATLINE SDN BHD</p>
          </div>

          <div style={{ padding: 28 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <i className="bi bi-x-circle-fill" style={{ fontSize: 40, color: '#ef4444' }}></i>
                <p style={{ marginTop: 14, color: '#374151', fontSize: 15 }}>{error}</p>
              </div>
            ) : details && (
              <>
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6 }}>
                  Dear <strong>{details.full_name}</strong>,
                </p>
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6 }}>
                  You have been invited for an interview for the position of <strong>{details.position_applied || 'the role'}</strong>.
                </p>

                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18, margin: '16px 0' }}>
                  <Row label="Date"     value={fmt(details.interview_date)} />
                  {details.interview_time && <Row label="Time" value={details.interview_time} />}
                  {details.interview_location && <Row label="Location" value={details.interview_location} />}
                  {details.interview_notes && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280' }}>
                      {details.interview_notes}
                    </div>
                  )}
                </div>

                {confirmed ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#16a34a' }}></i>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#15803d', margin: 0 }}>Attendance Confirmed</h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                      Thank you for confirming. We look forward to meeting you. Please bring your original certificates, IC, and a copy of your resume.
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
                      Please confirm your attendance for this interview.
                    </p>
                    <button onClick={handleConfirm} disabled={confirming} style={{
                      width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '13px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8,
                    }}>
                      {confirming ? 'Confirming…' : '✓ I Agree & Confirm Attendance'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0' }}>
      <span style={{ width: 110, flexShrink: 0, color: '#6b7280', fontSize: 14 }}>{label}</span>
      <span style={{ flex: 1, color: '#1f2937', fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
