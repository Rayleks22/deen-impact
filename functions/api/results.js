/**
 * Cloudflare Pages Function: /api/results
 * Simple, Google Sheets & Google Drive powered Student Results Lookup.
 *
 * HOW IT WORKS FOR SCHOOL STAFF:
 * 1. School staff maintain a simple Google Sheet with columns:
 *    [Admission_Number, PIN, Student_Name, Class, Term, Session, Report_PDF_Link]
 * 2. In Google Sheets: File > Share > Publish to web > Select CSV format > Copy URL.
 * 3. Add that URL to Cloudflare Pages environment variable: RESULTS_SHEET_URL
 *    (or set it as DEFAULT_SHEET_URL below).
 * 4. That's it! Staff can paste new rows or PDF links at any time and parents
 *    immediately get access without code changes or manual serverless uploads.
 */

// Fallback configuration if env.RESULTS_SHEET_URL is not set in Cloudflare dashboard
const DEFAULT_SHEET_URL = "";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.admissionNumber || !body.pin) {
      return jsonResponse(
        { error: 'Please enter both your Admission Number and Portal PIN.' },
        400
      );
    }

    const inputAdm = String(body.admissionNumber).trim();
    const inputPin = String(body.pin).trim();
    const requestedTerm = body.term ? String(body.term).trim().toUpperCase() : '';
    const requestedSession = body.session ? String(body.session).trim() : '';

    if (!inputAdm || !inputPin) {
      return jsonResponse({ error: 'Admission Number and PIN are required.' }, 400);
    }

    // 1. Built-in Demo Test Account (for testing & verification)
    const normInputAdm = normalizeKey(inputAdm);
    if ((normInputAdm === 'DIA2026001' || normInputAdm === 'DIADEMO01') && (inputPin === '1234' || inputPin === '123456')) {
      return jsonResponse({
        success: true,
        student: {
          name: 'Zaynab Adeyemo',
          admissionNumber: 'DIA/2026/001',
          className: 'Basic 4 (Emerald)',
          term: '1st Term',
          session: '2026/2027',
          downloadUrl: 'https://deenimpactacademy.com.ng/downloads/admission-form.pdf',
          isDemo: true,
          message: 'Official verified report sheet.'
        }
      });
    }

    // 2. Resolve Google Sheet CSV URL
    const sheetUrl = (env && env.RESULTS_SHEET_URL) ? env.RESULTS_SHEET_URL.trim() : DEFAULT_SHEET_URL.trim();

    if (!sheetUrl) {
      return jsonResponse({
        status: 'sheet_not_configured',
        error: 'The online Results Registry is being connected to the current academic term. Please contact the administrative office on 08123458536 or WhatsApp to receive your official report sheet.'
      }, 200);
    }

    // 3. Fetch published Google Sheet CSV
    let csvText = '';
    try {
      const resp = await fetch(sheetUrl, {
        headers: {
          'Accept': 'text/csv, text/plain',
          'User-Agent': 'DeenImpact-Portal/2.0'
        },
        cf: {
          // Cache the sheet for 60 seconds on Cloudflare edge for fast responses
          cacheTtl: 60,
          cacheEverything: true
        }
      });

      if (!resp.ok) {
        throw new Error(`Google Sheets responded with status ${resp.status}`);
      }
      csvText = await resp.text();
    } catch (fetchErr) {
      console.error('Error fetching Google Sheet:', fetchErr);
      return jsonResponse({
        error: 'Unable to reach the school results registry. Please verify your connection or contact the office on 08123458536.'
      }, 502);
    }

    // 4. Parse CSV rows
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return jsonResponse({
        error: 'Results database is currently empty. Please contact the school office on 08123458536.'
      }, 404);
    }

    // Header mapping (supports variations in column titles)
    const header = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const colAdm = header.findIndex(h => h.includes('adm') || h.includes('number') || h.includes('id'));
    const colPin = header.findIndex(h => h.includes('pin') || h.includes('pass') || h.includes('code') || h.includes('phone'));
    const colName = header.findIndex(h => h.includes('name') || h.includes('student'));
    const colClass = header.findIndex(h => h.includes('class') || h.includes('grade') || h.includes('level'));
    const colTerm = header.findIndex(h => h.includes('term'));
    const colSession = header.findIndex(h => h.includes('session') || h.includes('year'));
    const colLink = header.findIndex(h => h.includes('link') || h.includes('url') || h.includes('report') || h.includes('drive') || h.includes('file'));

    if (colAdm === -1 || colPin === -1) {
      return jsonResponse({
        error: 'Results registry format error (missing Admission No or PIN column). Please notify the administrator.'
      }, 500);
    }

    // 5. Search for matching student record
    let match = null;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rowAdm = row[colAdm] || '';
      const rowPin = row[colPin] || '';

      if (normalizeKey(rowAdm) === normInputAdm && rowPin.trim() === inputPin) {
        // Check term / session if provided
        if (requestedTerm && colTerm !== -1) {
          const rowTerm = (row[colTerm] || '').toUpperCase();
          if (rowTerm && !rowTerm.includes(requestedTerm.replace('TERM', '')) && !requestedTerm.includes(rowTerm)) {
            continue; // Keep searching in case there are multiple terms for this student
          }
        }
        match = {
          admissionNumber: rowAdm.trim(),
          name: colName !== -1 ? (row[colName] || 'Student').trim() : 'Student',
          className: colClass !== -1 ? (row[colClass] || 'Class').trim() : '',
          term: colTerm !== -1 ? (row[colTerm] || 'Term').trim() : requestedTerm,
          session: colSession !== -1 ? (row[colSession] || 'Session').trim() : requestedSession,
          reportLink: colLink !== -1 ? (row[colLink] || '').trim() : ''
        };
        break;
      }
    }

    if (!match) {
      return jsonResponse({
        error: 'Invalid Admission Number or PIN. Please verify your details from your term receipt, or contact the school office on 08123458536.'
      }, 401);
    }

    // Format download URL (converts standard Google Drive links to direct view/download)
    let downloadUrl = match.reportLink;
    if (downloadUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = downloadUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        downloadUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/view?usp=sharing`;
      }
    }

    return jsonResponse({
      success: true,
      student: {
        admissionNumber: match.admissionNumber,
        name: match.name,
        className: match.className,
        term: match.term,
        session: match.session,
        downloadUrl: downloadUrl
      }
    });

  } catch (err) {
    console.error('Unhandled results error:', err);
    return jsonResponse({ error: 'Server error processing results query. Please contact 08123458536.' }, 500);
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

function normalizeKey(str) {
  return String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Robust CSV parser handling quotes and commas
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (let line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry);
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry);
    result.push(row);
  }
  return result;
}
