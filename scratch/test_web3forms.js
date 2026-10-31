async function testWeb3Forms() {
  const accessKey = '113ac740-421d-4345-b8fd-21d0d5660372';
  console.log('Testing Web3Forms with Access Key:', accessKey);
  
  const testCandidateEmail = 'use@gmail.com';
  const totalDurationFormatted = '30 sec';
  const examDurationFormatted = '19 sec';
  const ipAddress = '49.15.229.67';
  
  const auditReport = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE EXAM SESSION AUDIT REPORT
[STRICTLY CONFIDENTIAL — FOR ADMIN ONLY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDIDATE DETAILS:
• Full Name: ${testCandidateEmail}
• Email Address: ${testCandidateEmail}
• IP Address: ${ipAddress}

EXAM INFORMATION:
• Exam Title: Certificate in Project Coordination
• Allowed Exam Duration: 60 Minutes

PORTAL & EXAM DURATION TIMELINES:
• Portal Entry / Login Time: 30 Oct 2026, 7:00:54 pm
• Portal Exit / Stop Time: 30 Oct 2026, 7:01:25 pm
• Total Time Used in Portal: ${totalDurationFormatted}
• Time Spent on Exam Screen: ${examDurationFormatted}

EXIT CIRCUMSTANCE:
• Trigger Condition: Exam Submitted Successfully by Candidate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Automated Security Tracking System • Princeton Exam Portal
`.trim();

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Exam Session Ended — ${testCandidateEmail} (${totalDurationFormatted})`,
        from_name: 'Princeton Security Audit',
        replyto: testCandidateEmail,
        email: testCandidateEmail,
        name: testCandidateEmail,
        message: auditReport
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testWeb3Forms();
