import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase'; // Named import matches this project's setup

const steps = [
  { id: 1, label: "Candidate submitted the service enrollment" },
  { id: 2, label: "Proposal Email sent" },
  { id: 3, label: "Payment received" },
  { id: 4, label: "Invoice Sent" },
  { id: 5, label: "Study material shared" },
  { id: 6, label: "Login credentials shared" },
  { id: 7, label: "Exam Cleared" },
  { id: 8, label: "Completion Certificates Delivered" },
  { id: 9, label: "Video Lectures Delivered" },
  { id: 10, label: "Final Login Shared" },
  { id: 11, label: "Final Exam Cleared" },
  { id: 12, label: "PC verified" }
];

const ServiceDeliveryManager = ({ user, profile }) => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Security authorization check (admin and super admin only)
  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === 'info@isuccessnode.com';

  useEffect(() => {
    if (isAdmin) {
      fetchCandidateProfile();
    }
  }, [id, isAdmin]);

  const fetchCandidateProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setCandidate(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Profile fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const isKycCompleted = !!(
    candidate?.profile_completed ||
    (candidate?.profile_photo_url && candidate?.aadhaar_front_url && candidate?.aadhaar_back_url)
  );

  // Access Denied Screen for Non-Admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase">Access Denied</h2>
          <p className="text-slate-400 text-sm">You do not have administrative privileges to view this resource.</p>
        </div>
        <Link to="/">
          <button className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl text-xs hover:bg-slate-800 transition-all">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center gap-8">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin shadow-sm"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">Synchronizing Record...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase">Profile Fetch Failed</h2>
          <p className="text-slate-400 text-sm">{error || 'We could not locate this profile.'}</p>
        </div>
        <Link to="/admin">
          <button className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl text-xs hover:bg-slate-800 transition-all">Back to Users</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 p-6 md:p-12 font-sans selection:bg-slate-100 animate-fade-in">
      <div className="max-w-[1680px] mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <Link to="/admin" className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="group-hover:-translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Directory
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: CANDIDATE CARD & DOCUMENT STATUS */}
          <div className="w-full md:w-96 shrink-0 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
              
              <div className="relative mb-6 mt-4">
                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-md">
                  {candidate.profile_photo_url ? (
                    <img src={candidate.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-black text-slate-800 uppercase">
                      {candidate.full_name?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1 uppercase break-words max-w-full">
                {candidate.full_name || 'Anonymous Object'}
              </h2>
              <p className="text-xs font-bold text-slate-400 truncate max-w-full tracking-tight mb-6">
                {candidate.email}
              </p>

              <div className="w-full pt-6 border-t border-slate-50 flex flex-col gap-3 text-left">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">KYC Deliverables</h3>
                
                {[
                  { label: "Profile Photo", present: !!candidate.profile_photo_url },
                  { label: "Aadhaar Card Front", present: !!candidate.aadhaar_front_url },
                  { label: "Aadhaar Card Back", present: !!candidate.aadhaar_back_url },
                  { label: "Profile Registration Completed", present: !!candidate.profile_completed }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">{doc.label}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${doc.present ? 'bg-emerald-50 text-emerald-500 border-emerald-200' : 'bg-rose-50 text-rose-500 border-rose-200'}`}>
                      {doc.present ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Previews */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.03)] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 pb-4 border-b border-slate-50">KYC Uploads Preview</h3>
              
              <div className="space-y-6">
                {[
                  { label: "Aadhaar Front", url: candidate.aadhaar_front_url },
                  { label: "Aadhaar Back", url: candidate.aadhaar_back_url },
                  { label: "Signature", url: candidate.signature_url }
                ].map((doc, idx) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">{doc.label}</span>
                    {doc.url ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-[1.618] bg-slate-50 flex items-center justify-center">
                        {doc.url.toLowerCase().includes('.pdf') ? (
                          <div className="flex flex-col items-center gap-2 p-4 text-slate-400">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">PDF Document</span>
                          </div>
                        ) : (
                          <img src={doc.url} alt="" className="w-full h-full object-cover" />
                        )}
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300 gap-2 font-bold text-xs"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          Inspect Full
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-100 aspect-[1.618] flex items-center justify-center text-slate-300">
                        <span className="text-[10px] font-black uppercase tracking-wider">No upload</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TIMELINE PREVIEW */}
          <div className="flex-1 w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.03)] p-8 md:p-12 space-y-10">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Service Delivery Milestones</h1>
                <p className="text-slate-400 font-medium text-sm">Preview of candidate service timeline according to verification progress</p>
              </div>

              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 w-fit">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isKycCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                  <span className="text-xs font-bold text-slate-800">
                    {isKycCompleted ? 'Delivery Completed' : 'Pending KYC'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4">
              <span className="text-slate-400 pt-0.5">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l-.708 2.836M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12v-.008z"/></svg>
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-1">Automatic Progression System</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  The candidate's 12 service delivery steps will dynamically unlock and display checkmarks once all registration uploads (photo, Aadhaar front & back) are verified. No manual updates are required.
                </p>
              </div>
            </div>

            <div className="pt-4">
              {/* Desktop Stepper */}
              <div className="hidden md:block overflow-x-auto pb-6 scrollbar-thin">
                <div className="relative flex items-start justify-between min-w-[1000px] py-8 px-6">
                  
                  <div className="absolute top-[48px] left-[72px] right-[72px] h-[3px] bg-slate-100 -z-0">
                    <div className={`h-full transition-all duration-1000 ${isKycCompleted ? 'w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'w-0 bg-slate-200'}`} />
                  </div>

                  {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center text-center w-24 relative z-10 group">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black tracking-tight border-2 mb-4 bg-white transition-all duration-500 ${isKycCompleted ? 'border-emerald-500 text-emerald-600' : 'border-rose-300 text-rose-500'}`}>
                        {step.id}
                      </div>

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm ${isKycCompleted ? 'bg-emerald-500 text-white shadow-emerald-100 scale-110' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                        {isKycCompleted ? (
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                      </div>

                      <p className={`mt-5 text-[10px] font-bold uppercase tracking-tight leading-snug max-w-[90px] break-words transition-colors duration-500 ${isKycCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Stepper */}
              <div className="block md:hidden">
                <div className="flex flex-col gap-8 relative pl-6 before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                  <div className={`absolute left-[15px] top-4 bottom-4 w-[2px] transition-all duration-1000 origin-top ${isKycCompleted ? 'scale-y-100 bg-emerald-500' : 'scale-y-0 bg-slate-200'}`} />

                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4 relative z-10 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm shrink-0 ${isKycCompleted ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                        {isKycCompleted ? (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black tracking-tight border transition-colors duration-500 ${isKycCompleted ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-rose-200 bg-rose-50 text-rose-500'}`}>
                          {step.id}
                        </span>
                        <p className={`text-[11px] font-bold uppercase tracking-tight transition-colors duration-500 ${isKycCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDeliveryManager;
