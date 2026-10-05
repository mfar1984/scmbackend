import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { useBranding } from '@/lib/useBranding';

export default function LoginPage() {
  const router = useRouter();
  const branding = useBranding();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        // Route by account type: staff → Employee Self-Service, others → admin backend
        if (json.user?.user_type === 'staff') router.push('/ess/dashboard');
        else router.push('/dashboard');
      } else {
        setError(json.message || 'Invalid email or password.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login — ATLINE Admin Panel</title>
      </Head>

      <div className="login-page">
        {/* Blobs */}
        <div className="login-blob login-blob-1"></div>
        <div className="login-blob login-blob-2"></div>

        {/* Left — Branding */}
        <div className="login-left" style={branding.login_bg === 'image' && branding.login_image ? {
          backgroundImage: `linear-gradient(rgba(15,22,35,0.82), rgba(15,22,35,0.82)), url(${branding.login_image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        } : branding.login_bg === 'solid' && branding.login_bg_color ? { background: branding.login_bg_color } : undefined}>
          <div className="login-brand">
            {branding.admin_logo ? (
              <img src={branding.admin_logo} alt="ATLINE" style={{ maxHeight: 48, maxWidth: 220, objectFit: 'contain' }} />
            ) : (
              <>
                <div className="login-brand-icon">
                  <i className="bi bi-building-fill"></i>
                </div>
                <div>
                  <div className="login-brand-name">ATLINE SDN BHD</div>
                  <div className="login-brand-sub">Admin Panel</div>
                </div>
              </>
            )}
          </div>

          <h1 className="login-tagline">
            Manage your<br />
            <span>operations</span><br />
            with ease.
          </h1>

          <p className="login-desc">
            Centralised admin panel for managing applications, HR operations,
            website content, and system configuration.
          </p>

          <div className="login-features">
            {[
              'Application & HR Management',
              'Website Content Tools',
              'Role-Based Access Control',
              'Activity Logs & Audit Trail',
            ].map(f => (
              <div key={f} className="login-feature">
                <div className="login-feature-dot"></div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="login-right">
          <div className="login-card">
            <h2 className="login-card-title">Welcome back</h2>
            <p className="login-card-sub">Sign in to your admin account</p>

            {error && (
              <div className="login-error">
                <i className="bi bi-exclamation-circle-fill"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Email Address</label>
                <div className="login-field-icon">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    placeholder="admin@atline.com.my"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Password</label>
                <div className="login-field-icon" style={{ position: 'relative' }}>
                  <i className="bi bi-lock"></i>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', fontSize: 16, padding: 0,
                    }}
                  >
                    <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{ width: 16, height: 16, borderWidth: 2 }}
                    ></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              ATLINE SDN BHD &copy; {new Date().getFullYear()} · Admin Panel v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Redirect to dashboard if already logged in — check DB session too
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parse(context.req.headers.cookie || '');
  const token   = cookies['atline_token'];

  if (token) {
    try {
      // 1. Verify JWT
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'atline-secret');

      // 2. Check session exists in DB
      const crypto = require('crypto');
      const db     = require('../lib/db').default;
      const hash   = crypto.createHash('sha256').update(token).digest('hex');
      const session = await db('user_sessions')
        .where({ token_hash: hash })
        .where('expires_at', '>', new Date())
        .first();

      if (session) {
        // Valid session — route by account type
        const dest = payload?.user_type === 'staff' ? '/ess/dashboard' : '/dashboard';
        return { redirect: { destination: dest, permanent: false } };
      }
      // Session not in DB — clear stale cookie and show login
      context.res.setHeader('Set-Cookie', 'atline_token=; Max-Age=0; Path=/; HttpOnly');
    } catch {
      // JWT invalid — clear cookie and show login
      context.res.setHeader('Set-Cookie', 'atline_token=; Max-Age=0; Path=/; HttpOnly');
    }
  }

  return { props: {} };
};
