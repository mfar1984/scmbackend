/**
 * Google reCAPTCHA v3 server-side verification.
 *
 * Configure the secret via env `RECAPTCHA_SECRET_KEY` (backend) and the
 * matching site key via `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (website).
 *
 * If no secret is configured the check is skipped (returns ok) so forms keep
 * working in development / before keys are provisioned.
 */
export async function verifyRecaptcha(token: string | undefined | null, minScore = 0.5): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, reason: 'disabled' }; // not configured → skip

  if (!token) return { ok: false, reason: 'missing-token' };

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data: any = await res.json();
    if (!data.success) return { ok: false, reason: 'verification-failed' };
    if (typeof data.score === 'number' && data.score < minScore) return { ok: false, reason: 'low-score' };
    return { ok: true };
  } catch {
    // On network error, don't hard-block a legitimate submission.
    return { ok: true, reason: 'verify-error' };
  }
}
