/**
 * Cloudflare Pages Function: /api/results
 * Secure server-side endpoint for student report sheet download.
 *
 * Cloudflare Bindings required in Pages project settings:
 * - KV Namespace: RESULTS_KV (stores PIN hashes and rate-limit tracking)
 * - R2 Bucket: RESULTS_BUCKET (stores private student PDF report cards)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.admissionNumber || !body.pin) {
      return jsonResponse(
        { error: 'Missing required credentials. Both Admission Number and PIN are required.' },
        400
      );
    }

    const admissionNumber = String(body.admissionNumber).trim().toUpperCase();
    const pin = String(body.pin).trim();
    const term = (body.term || 'TERM1').trim().toUpperCase();
    const session = (body.session || '2026-2027').trim().replace('/', '-');

    // Basic format validation
    if (!/^[A-Z0-9\/-]{3,30}$/.test(admissionNumber)) {
      return jsonResponse({ error: 'Invalid Admission Number format.' }, 400);
    }
    if (!/^[0-9]{4,8}$/.test(pin)) {
      return jsonResponse({ error: 'PIN must be between 4 and 8 digits.' }, 400);
    }

    // Client IP for rate limiting
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown-client';
    const rateLimitKey = `rl:${clientIp}:${admissionNumber}`;

    // 1. Check if Cloudflare KV and R2 bindings exist
    if (!env || !env.RESULTS_KV || !env.RESULTS_BUCKET) {
      // Check if demo mode is enabled for staging/preview
      if (env && env.ENABLE_DEMO_RESULTS === 'true' && admissionNumber === 'DIA-DEMO-01' && pin === '123456') {
        const demoPdfBytes = getDemoPdfStream(admissionNumber, term, session);
        return new Response(demoPdfBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${admissionNumber}_${term}_${session}.pdf"`,
            'Cache-Control': 'private, no-cache, no-store'
          }
        });
      }

      return jsonResponse(
        {
          status: 'opening_soon',
          message: 'The online Student Results Portal is being linked to the school record database. Please contact the administrative office on 08123458536 to collect your physical report sheet.'
        },
        200
      );
    }

    const kv = env.RESULTS_KV;
    const bucket = env.RESULTS_BUCKET;

    // 2. Rate Limiting Check (Max 5 failed attempts per 15 mins)
    const attemptsStr = await kv.get(rateLimitKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    if (attempts >= 5) {
      return jsonResponse(
        { error: 'Too many failed login attempts. Access is temporarily locked for 15 minutes for security. Please try again later or contact the school office.' },
        429
      );
    }

    // 3. Retrieve student PIN record from KV
    // Stored as JSON: { hash: "hex_sha256", salt: "random_salt" }
    const studentRecordJson = await kv.get(`student:${admissionNumber}`);
    if (!studentRecordJson) {
      await incrementRateLimit(kv, rateLimitKey, attempts);
      return jsonResponse({ error: 'Invalid Admission Number or PIN. Please verify and try again.' }, 401);
    }

    let studentRecord;
    try {
      studentRecord = JSON.parse(studentRecordJson);
    } catch {
      return jsonResponse({ error: 'System record error. Please report to the school office.' }, 500);
    }

    // 4. Verify PIN hash using Web Crypto SHA-256
    const isValid = await verifyPin(pin, studentRecord.salt, studentRecord.hash);
    if (!isValid) {
      await incrementRateLimit(kv, rateLimitKey, attempts);
      return jsonResponse({ error: 'Invalid Admission Number or PIN. Please verify and try again.' }, 401);
    }

    // Reset rate-limiting on successful authentication
    if (attempts > 0) {
      await kv.delete(rateLimitKey);
    }

    // 5. Retrieve PDF from private Cloudflare R2 bucket
    // File naming convention: ADMISSIONNUMBER_TERM_YEAR.pdf
    const sanitizedAdm = admissionNumber.replace(/[^A-Z0-9]/g, '_');
    const r2Key = `${sanitizedAdm}_${term}_${session}.pdf`;

    const r2Object = await bucket.get(r2Key);
    if (!r2Object) {
      return jsonResponse(
        {
          error: `Result sheet for ${admissionNumber} (${term}, ${session}) has not yet been uploaded. Please contact the school examination office.`
        },
        404
      );
    }

    // 6. Return secure PDF stream directly to browser
    return new Response(r2Object.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${admissionNumber}_${term}_${session}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (err) {
    return jsonResponse({ error: 'Internal server error processing result request.' }, 500);
  }
}

// Helpers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

async function verifyPin(providedPin, salt, expectedHashHex) {
  const enc = new TextEncoder();
  const data = enc.encode(providedPin + ':' + (salt || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHashHex;
}

async function incrementRateLimit(kv, key, currentAttempts) {
  try {
    await kv.put(key, String(currentAttempts + 1), { expirationTtl: 900 }); // 15 mins TTL
  } catch (e) {
    // Silently continue if KV write fails
  }
}

function getDemoPdfStream(admissionNumber, term, session) {
  // Fallback demo stream for local testing preview
  const text = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /Helvetica-Bold 18 Tf 50 750 Td (DEENIMPACT ACADEMY - OFFICIAL REPORT SHEET) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n386\n%%EOF\n`;
  return new TextEncoder().encode(text);
}
