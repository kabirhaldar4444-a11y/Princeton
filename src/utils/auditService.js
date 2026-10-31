import { supabase } from './supabase';

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '113ac740-421d-4345-b8fd-21d0d5660372';

/**
 * Format date to match the reference audit report format:
 * e.g., "30 Oct 2026, 7:00:54 pm"
 */
export const formatAuditDate = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
};

/**
 * Format duration to match the reference audit report format:
 * e.g., "30 sec", "19 sec", "1 min 15 sec", "60 min", "1 hr 15 min"
 */
export const formatDuration = (totalSeconds) => {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;

  if (hours > 0) {
    const parts = [`${hours} hr`];
    if (minutes > 0) parts.push(`${minutes} min`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds} sec`);
    return parts.join(' ');
  }
  if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes} min ${remainingSeconds} sec`;
    }
    return `${minutes} min`;
  }
  return `${remainingSeconds} sec`;
};

/**
 * Record portal entry / login timestamp for candidate session
 */
export const recordPortalEntryTime = (userId) => {
  try {
    const nowIso = new Date().toISOString();
    if (!sessionStorage.getItem('portal_entry_time')) {
      sessionStorage.setItem('portal_entry_time', nowIso);
    }
    if (userId) {
      if (!localStorage.getItem(`portal_entry_${userId}`)) {
        localStorage.setItem(`portal_entry_${userId}`, nowIso);
      }
    }
  } catch (e) {
    console.warn('Storage error on portal entry tracking:', e);
  }
};

/**
 * Retrieve portal entry timestamp for candidate session
 */
export const getPortalEntryTime = (userId) => {
  try {
    const sessionTime = sessionStorage.getItem('portal_entry_time');
    if (sessionTime) return new Date(sessionTime);

    if (userId) {
      const localTime = localStorage.getItem(`portal_entry_${userId}`);
      if (localTime) return new Date(localTime);
    }
  } catch (e) {
    console.warn('Storage error getting portal entry:', e);
  }
  return new Date();
};

/**
 * Detect client IP supporting both IPv4 and IPv6 networks
 */
export const detectClientIp = async () => {
  // Method 1: Cloudflare trace
  try {
    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const text = await res.text();
    const match = text.match(/ip=([^\r\n\s]+)/);
    if (match && match[1]) return match[1].trim();
  } catch {}

  // Method 2: api64.ipify.org (Dual-stack IPv4 & IPv6)
  try {
    const res2 = await fetch('https://api64.ipify.org?format=json');
    const data2 = await res2.json();
    if (data2?.ip) return data2.ip.trim();
  } catch {}

  // Method 3: ipwho.is
  try {
    const res3 = await fetch('https://ipwho.is/');
    const data3 = await res3.json();
    if (data3?.ip) return data3.ip.trim();
  } catch {}

  return null;
};

/**
 * Resolve candidate IP Address strictly from KYC Form / Database / Local storage
 * with non-intrusive fallback if KYC was completed prior to field introduction.
 */
export const getKycIpAddress = async (user, profile) => {
  // 1. Database profile IP (saved during KYC Form submission)
  if (profile?.ip_address && profile.ip_address.trim() && profile.ip_address !== 'Not Detected') {
    return profile.ip_address.trim();
  }

  // 2. Locally cached KYC IP
  const localKycIp = localStorage.getItem('candidate_kyc_ip');
  if (localKycIp && localKycIp.trim() && localKycIp !== 'Not Detected') {
    return localKycIp.trim();
  }

  // 3. Database direct fetch (in case AuthContext profile state was cached)
  if (user?.id) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('ip_address')
        .eq('id', user.id)
        .single();
      if (data?.ip_address && data.ip_address.trim() && data.ip_address !== 'Not Detected') {
        localStorage.setItem('candidate_kyc_ip', data.ip_address.trim());
        return data.ip_address.trim();
      }
    } catch (e) {
      console.warn('Could not query profile ip_address:', e);
    }
  }

  // 4. Silent fallback detection & sync to candidate profile
  try {
    const detectedIp = await detectClientIp();
    if (detectedIp) {
      localStorage.setItem('candidate_kyc_ip', detectedIp);
      if (user?.id) {
        supabase.from('profiles').update({ ip_address: detectedIp }).eq('id', user.id).then();
      }
      return detectedIp;
    }
  } catch {}

  return 'Not Detected';
};

/**
 * Dispatch confidential Admin Audit Email via Web3Forms matching reference format
 */
export const sendExamAuditEmail = async ({
  candidateEmail,
  candidateName,
  candidateIp,
  examTitle,
  allowedDurationMinutes = 60,
  portalEntryTime,
  portalExitTime = new Date(),
  totalPortalSeconds,
  examScreenSeconds,
  exitTrigger = 'Exam Submitted Successfully by Candidate',
  useBeacon = false
}) => {
  const accessKey = WEB3FORMS_ACCESS_KEY;

  const entryDate = portalEntryTime instanceof Date ? portalEntryTime : new Date(portalEntryTime || Date.now());
  const exitDate = portalExitTime instanceof Date ? portalExitTime : new Date(portalExitTime || Date.now());

  const formattedPortalEntry = formatAuditDate(entryDate);
  const formattedPortalExit = formatAuditDate(exitDate);

  // If durations not explicitly calculated, calculate from timestamps
  const actualPortalSecs = totalPortalSeconds !== undefined 
    ? totalPortalSeconds 
    : Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / 1000));

  const actualExamSecs = examScreenSeconds !== undefined 
    ? examScreenSeconds 
    : Math.min(actualPortalSecs, Math.max(1, actualPortalSecs));

  const formattedTotalTime = formatDuration(actualPortalSecs);
  const formattedExamTime = formatDuration(actualExamSecs);

  const subject = `Exam Session Ended — ${candidateEmail} (${formattedTotalTime})`;
  const fullName = candidateName || candidateEmail;

  // Exact body format as requested in reference PDF
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE EXAM SESSION AUDIT REPORT
[STRICTLY CONFIDENTIAL — FOR ADMIN ONLY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDIDATE DETAILS:
• Full Name: ${fullName}
• Email Address: ${candidateEmail}
• IP Address: ${candidateIp || 'Not Detected'}

EXAM INFORMATION:
• Exam Title: ${examTitle}
• Allowed Exam Duration: ${allowedDurationMinutes} Minutes

PORTAL & EXAM DURATION TIMELINES:
• Portal Entry / Login Time: ${formattedPortalEntry}
• Portal Exit / Stop Time: ${formattedPortalExit}
• Total Time Used in Portal: ${formattedTotalTime}
• Time Spent on Exam Screen: ${formattedExamTime}

EXIT CIRCUMSTANCE:
• Trigger Condition: ${exitTrigger}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Automated Security Tracking System • Princeton Exam Portal
`.trim();

  const payload = JSON.stringify({
    access_key: accessKey,
    subject: subject,
    from_name: 'Princeton Security Audit',
    replyto: candidateEmail,
    email: candidateEmail,
    name: fullName,
    message: message
  });

  // If page is closing, use sendBeacon when requested and available
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('https://api.web3forms.com/submit', blob);
      if (sent) return { success: true, beacon: true };
    } catch (beaconErr) {
      console.warn('[Audit Service] sendBeacon failed, falling back to keepalive fetch:', beaconErr);
    }
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: payload,
      keepalive: true
    });

    const data = await response.json();
    console.log('[Audit Service] Email dispatch result:', data);
    return data;
  } catch (error) {
    console.error('[Audit Service] Email dispatch failed:', error);
    return { success: false, error: error.message };
  }
};
