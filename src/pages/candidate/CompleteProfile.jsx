import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Upload, 
  Camera, 
  ChevronDown, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  Video,
  X,
  Image as ImageIcon,
  Search,
  PenTool,
  Play,
  Square,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import SignatureCanvas from '../../components/SignatureCanvas';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';
import { useAlert } from '../../context/AlertProvider';
import { indianStatesAndCities } from '../../utils/indiaLocationData';
import PMISLogo from '../../components/common/PMISLogo';
import { KYC_LEGAL_ACKNOWLEDGEMENT, GLOBAL_POLICIES_DECLARATION } from '../../utils/legalText';

// --- SEARCHABLE DROPDOWN COMPONENT ---
const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const filtered = (options || []).filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`input-premium w-full flex items-center justify-between cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 pointer-events-none bg-slate-50' : 'bg-white hover:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/50'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate mr-2 ${value ? 'text-slate-900 text-sm' : 'text-slate-400 text-[11px]'}`}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                autoFocus
                placeholder="Search..." 
                className="w-full text-sm outline-none py-1"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto w-full p-2">
              {filtered.length > 0 ? filtered.map(opt => (
                <li 
                  key={opt} 
                  className="px-4 py-2 hover:bg-primary-500/5 hover:text-primary-600 rounded-xl cursor-pointer text-sm font-medium transition-colors"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt}
                </li>
              )) : (
                <li className="p-4 text-center text-sm text-slate-400">No results found</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- WEBRTC CAMERA MODAL COMPONENT ---
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          setError('');
        })
        .catch(err => setError('Camera access denied or unavailable. Please enable permissions.'));
    } else {
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [isOpen]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `live_capture_${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
          onClose();
        }
      }, 'image/png', 0.85);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/5 hover:bg-black/10 text-slate-800 rounded-full flex items-center justify-center transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center border-b border-slate-100">
              <h3 className="font-outfit font-black text-2xl text-slate-900">Identity Scan</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Align your face in the center</p>
            </div>

            <div className="bg-slate-900 aspect-square relative flex items-center justify-center overflow-hidden">
               {error ? (
                 <p className="text-amber-500 text-sm px-8 text-center font-medium">{error}</p>
               ) : (
                 <>
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                   <div className="absolute inset-0 border-[3px] border-white/20 rounded-full m-10 pointer-events-none" />
                   <canvas ref={canvasRef} width="400" height="400" className="hidden" />
                 </>
               )}
            </div>

            <div className="p-8 bg-slate-50/80">
               <button 
                 onClick={captureFrame} disabled={!!error}
                 className="w-full btn-premium !py-5 !rounded-2xl transition-all shadow-xl shadow-primary-500/20"
               >
                  Verify Identity
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---
const CompleteProfile = () => {
  const { user, profile } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: '',
    state: '',
    city: '',
    addressLine: '',
    pincode: '',
    ipAddress: ''
  });

  const [files, setFiles] = useState({
    photo: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    signature: null
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [profileSnapshotBlob, setProfileSnapshotBlob] = useState(null);
  const [scriptLanguage, setScriptLanguage] = useState('en');

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Bind video stream to videoRef element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraActive, cameraStream]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, []);

  // Live recording timer counter
  useEffect(() => {
    if (recording) {
      setRecordTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recording]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      showAlert('Unable to access camera & microphone. Please enable permissions.', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    try {
      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? { mimeType: 'video/webm;codecs=vp9' }
        : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : {};

      const mediaRecorder = new MediaRecorder(cameraStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);
        captureSnapshotFrame();
      };

      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      showAlert('Video recorder failed to start on this device.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const reRecordVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setRecordedBlob(null);
    setProfileSnapshotBlob(null);
    setFiles((prev) => ({ ...prev, photo: null }));
    if (!cameraActive) startCamera();
  };

  const captureSnapshotFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setProfileSnapshotBlob(blob);
          const file = new File([blob], `live_capture_${Date.now()}.png`, { type: 'image/png' });
          setFiles(prev => ({ ...prev, photo: file }));
        }
      }, 'image/png');
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 0. Modern Background IP Detection (Automatic)
  useEffect(() => {
    const fetchIP = async () => {
      try {
        // Try Cloudflare first (extremely reliable)
        const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
        const text = await res.text();
        const ipMatch = text.match(/ip=([\d.]+)/);
        if (ipMatch && ipMatch[1]) {
          setFormData(prev => ({ ...prev, ipAddress: ipMatch[1] }));
          return;
        }
        // Fallback to ipify
        const res2 = await fetch('https://api.ipify.org?format=json');
        const data2 = await res2.json();
        if (data2.ip) setFormData(prev => ({ ...prev, ipAddress: data2.ip }));
      } catch (err) {
        console.warn('Silent IP detection failed:', err);
      }
    };
    fetchIP();
  }, []);

  // 1. PIN Code -> State/City (Auto-fill)
  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            const detectedState = postOffice.State;
            const detectedCity = postOffice.District || postOffice.Region;

            // Robust matching: Normalize both to compare (handle "&" vs "and", spaces, case)
            const normalize = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const normalizedDetected = normalize(detectedState);
            
            const stateKey = Object.keys(indianStatesAndCities).find(s => 
              normalize(s) === normalizedDetected
            );

            setFormData(prev => ({
              ...prev,
              state: stateKey || detectedState,
              city: detectedCity
            }));
            
            if (stateKey) {
              showAlert('Location detected from PIN Code', 'success');
            } else {
              showAlert(`Detected ${detectedState}. Please verify your selection.`, 'warning');
            }
          }
        })
        .catch(err => console.warn('Pincode fetch error:', err));
    }
  }, [formData.pincode]);

  // 2. City/State -> PIN Code (Bi-directional Smart Detection)
  useEffect(() => {
    // Only attempt if city is selected and pincode is empty or invalid
    if (formData.city && formData.state && (!formData.pincode || formData.pincode.length < 6)) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        fetch(`https://api.postalpincode.in/postoffice/${formData.city}`, { signal: controller.signal })
          .then(res => res.json())
          .then(data => {
            if (data && data[0] && data[0].Status === 'Success') {
              const matched = data[0].PostOffice.find(po => po.State.toLowerCase() === formData.state.toLowerCase()) || data[0].PostOffice[0];
              if (matched && matched.Pincode) {
                setFormData(prev => ({ ...prev, pincode: matched.Pincode }));
                showAlert(`Suggested PIN for ${formData.city}`, 'success');
              }
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') console.warn('City PIN fetch error:', err);
          });
      }, 800); // Debounce to avoid excessive API calls

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [formData.city, formData.state]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    const tryDetect = async (url) => {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error || data.status === 'fail') throw new Error(data.reason || data.message || 'API Fail');
      return data;
    };

    try {
      // Primary: ipapi.co
      try {
        const data = await tryDetect('https://ipapi.co/json/');
        setFormData(prev => ({
          ...prev,
          ipAddress: data.ip,
          pincode: data.postal || prev.pincode,
          state: data.region || prev.state,
          city: data.city || prev.city
        }));
        return; // Success
      } catch (e) {
        console.warn('Primary IP API failed, trying fallback...', e);
      }

      // Fallback: ipwho.is
      const fbData = await tryDetect('https://ipwho.is/');
      setFormData(prev => ({
        ...prev,
        ipAddress: fbData.ip,
        pincode: fbData.postal || prev.pincode,
        state: fbData.region || prev.state,
        city: fbData.city || prev.city
      }));
      
    } catch (err) {
      console.error('All Location APIs failed:', err);
      showAlert('Location detection failed. Please enter details manually.', 'error');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleFileUpload = async (file, bucketPath, bucketName = 'aadhaar_cards') => {
    if (!file) return null;
    const fileExt = file.name ? file.name.split('.').pop() : (file.type ? file.type.split('/')[1] : 'png');
    const fileName = `${user.id}/${bucketPath}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrl;
  };

  // --- WEB3FORMS EMAIL NOTIFICATION ---
  const sendEmailNotification = async ({ fullName, email, phone, fullAddress, ipAddress, photoUrl, frontUrl, backUrl, panUrl, signatureUrl, videoUrl }) => {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY || '4c65807a-e5d0-46e0-9cbd-70d264618cf1',
          subject: `NEW REGISTRATION: ${email}`,
          from_name: 'Princeton Exam Portal',
          message: `
NEW CANDIDATE KYC SUBMITTED
============================
Name     : ${fullName}
Email    : ${email}
Residence Address : ${fullAddress}
IP Address: ${ipAddress || 'Not Detected'}

UPLOADED DOCUMENTS & MEDIA
--------------------------
Profile Photo   : ${photoUrl || 'N/A'}
Video Statement : ${videoUrl || 'N/A'}
Aadhaar Front   : ${frontUrl || 'N/A'}
Aadhaar Back    : ${backUrl  || 'N/A'}
PAN Card        : ${panUrl   || 'N/A'}
Signature       : ${signatureUrl || 'N/A'}

=== LEGAL & POLICY ACCEPTANCE ===
[X] ${fullName} actively checked and agreed to the following terms and policies during KYC submission from IP Address: ${ipAddress || 'Not Detected'}

---------------------------------
[PART 1] KYC LEGAL ACKNOWLEDGEMENT
---------------------------------
${KYC_LEGAL_ACKNOWLEDGEMENT.trim()}

---------------------------------
✅ ${fullName} has accepted Our LEGAL ACKNOWLEDGEMENT
---------------------------------

---------------------------------
[PART 2] MASTER PORTAL DECLARATION
---------------------------------
${GLOBAL_POLICIES_DECLARATION.trim()}

---------------------------------
✅ ${fullName} has accepted Our MASTER PORTAL DECLARATION
---------------------------------
          `.trim(),
        }),
      });
      console.log('KYC Notification sent to Web3Forms successfully');
    } catch (err) {
      console.error('Web3Forms Notification Error:', err);
      // Silent fail — registration is already complete
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showAlert('Invalid Mobile Number. Must be 10 digits.', 'error');
      return;
    }
    if (!recordedBlob) {
      showAlert('Please record your live video verification statement.', 'warning');
      return;
    }
    if (!files.photo || !files.signature || !files.aadhaarFront || !files.aadhaarBack || !files.panCard) {
      showAlert('Please provide all required documents, PAN card, and signature.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const [photoUrl, frontUrl, backUrl, panUrl, signatureUrl, videoUrl] = await Promise.all([
        handleFileUpload(files.photo, 'photo', 'candidate_documents'),
        handleFileUpload(files.aadhaarFront, 'aadhaar_front', 'aadhaar_cards'),
        handleFileUpload(files.aadhaarBack, 'aadhaar_back', 'aadhaar_cards'),
        handleFileUpload(files.panCard, 'pan_card', 'candidate_documents'),
        handleFileUpload(files.signature, 'signature', 'candidate_documents'),
        handleFileUpload(recordedBlob, 'video_statement', 'candidate_documents')
      ]);

      const fullAddress = `${formData.addressLine ? formData.addressLine + ', ' : ''}${formData.city}, ${formData.state} - ${formData.pincode}`;
      const { error } = await supabase.from('profiles').update({
        phone: formData.phone,
        address: fullAddress,
        profile_photo_url: photoUrl,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_card_url: panUrl,
        signature_url: signatureUrl,
        video_url: videoUrl,
        profile_completed: true
      }).eq('id', user.id);

      if (error) throw error;

      // Fire email notification (non-blocking)
      sendEmailNotification({
        fullName: formData.fullName,
        email: user?.email || '',
        phone: formData.phone,
        fullAddress,
        ipAddress: formData.ipAddress,
        photoUrl,
        frontUrl,
        backUrl,
        panUrl,
        signatureUrl,
        videoUrl,
      });

      showAlert('Registration completed! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerOverlay user={user} profile={profile} />

      <div className="py-10 px-6 flex flex-col items-center justify-start bg-slate-50/50">

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card-saas max-w-2xl w-full p-8 md:p-14 my-10 relative z-10"
        >
          <header className="text-center mb-12 flex flex-col items-center">
            <div className="mb-4">
              <PMISLogo size={80} />
            </div>
            <h1 className="text-4xl font-outfit font-black text-slate-900 mb-2">KYC Form</h1>
            <p className="text-slate-500 font-medium">Complete your profile to access your assigned exams.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* DETECT LOCATION BUTTON */}
            <div className="flex justify-end w-full mb-[-1.5rem] relative z-20">
              <button 
                type="button" 
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                title="Detect IP & Location"
                className="group bg-white border border-emerald-200 text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-400 hover:to-emerald-500 hover:border-transparent hover:text-white text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:shadow-emerald-500/30 active:scale-95"
              >
                {isDetectingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 transition-colors group-hover:text-white text-emerald-500" />}
                Detect Location
              </button>
            </div>

            {/* 2. LIVESTREAM VERIFICATION (Widescreen Video Statement) */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block border-b border-slate-100 pb-3">
                Livestream Verification *
              </label>

              <div className="bg-slate-50/80 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                {/* Widescreen Video Feed */}
                <div className="space-y-4">
                  <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200">
                    {cameraActive && !videoPreviewUrl && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    )}

                    {videoPreviewUrl && (
                      <video
                        key={videoPreviewUrl}
                        src={videoPreviewUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}

                    {!cameraActive && !videoPreviewUrl && (
                      <div className="text-center p-8 text-slate-400">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/20">
                          <Camera className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className="text-sm font-black uppercase text-white tracking-wider">Camera Lens Closed</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Open Lens" below to activate camera</p>
                      </div>
                    )}

                    {recording && (
                      <div className="absolute top-4 left-4 bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>REC {formatTimer(recordTimer)}</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {!cameraActive && !videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Camera className="w-4 h-4" /> Open Lens
                      </button>
                    )}

                    {cameraActive && !recording && !videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start Recording
                      </button>
                    )}

                    {recording && (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-white" /> Stop Recording
                      </button>
                    )}

                    {videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={reRecordVideo}
                        className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" /> Re-record Video
                      </button>
                    )}
                  </div>
                </div>

                {/* Read Aloud Script Box */}
                <AnimatePresence>
                  {(cameraActive || videoPreviewUrl) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-primary-600">
                          Please Read Aloud ({scriptLanguage === 'en' ? 'English' : 'Hindi'}):
                        </span>

                        <div className="flex items-center gap-3">
                          {recordedBlob && (
                            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>Recorded!</span>
                            </div>
                          )}

                          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setScriptLanguage('en')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                scriptLanguage === 'en' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                              }`}
                            >
                              English
                            </button>
                            <button
                              type="button"
                              onClick={() => setScriptLanguage('hi')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                scriptLanguage === 'hi' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                              }`}
                            >
                              हिंदी
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs md:text-sm leading-relaxed text-slate-800 font-serif bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-inner">
                        {scriptLanguage === 'en' ? (
                          <p>
                            "My name is <span className="font-bold text-slate-900 not-italic">{formData.fullName || '[Your Name]'}</span>, and my registered email address is <span className="font-bold text-slate-900 not-italic">{user?.email || '[Your Email]'}</span>. I purposely recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Princeton Professional's training program (available at princetonprofessional.in). I am purchasing this course for personal skill enhancement, professional development, and career growth. I fully accept and understand that Princeton Professional is only an educational skills-based course training provider and never offers a job promise, job placement assurance, or particular career assurances upon course completion. Furthermore, I certify that I will not file any chargebacks or complaints regarding this transaction in the future. I also promise not to share or distribute any copyrighted course materials supplied to me throughout this program. This statement is made freely, knowingly, and without pressure."
                          </p>
                        ) : (
                          <p>
                            "मेरा नाम <span className="font-bold text-slate-900 not-italic">{formData.fullName || '[आपका नाम]'}</span> है और मेरा रजिस्टर्ड ईमेल एड्रेस <span className="font-bold text-slate-900 not-italic">{user?.email || '[आपका ईमेल]'}</span> है। मैंने यह वीडियो STATEMENT जान-बूझकर रिकॉर्ड किया है ताकि मैं अपनी प्रोफ़ाइल वेरिफ़ाई कर सकूँ, अपनी पहचान कन्फ़र्म कर सकूँ और Princeton Professional के ट्रेनिंग प्रोग्राम (जो princetonprofessional.in पर उपलब्ध है) में अपने एनरोलमेंट की पुष्टि कर सकूँ। मैं यह कोर्स अपनी पर्सनल स्किल बढ़ाने, प्रोफ़ेशनल DEVELOPMENT और करियर में आगे बढ़ने के लिए खरीद रहा हूँ। मैं पूरी तरह से मानता और समझता हूँ कि Princeton Professional सिर्फ़ एक एजुऑल कोर्स ट्रेनिंग प्रोवाइडर है और कोर्स पूरा होने पर कभी भी नौकरी का वादा, नौकरी मिलने की गारंटी या किसी खास करियर की गारंटी नहीं देता है। इसके अलावा, मैं यह सर्टिफ़ाई करता हूँ कि भविष्य में इस ट्रांज़ैक्शन के बारे में कोई चार्जबैक या शिकायत नहीं करूँगा। मैं यह भी वादा करता हूँ कि इस प्रोग्राम के दौरान मुझे दिए गए किसी भी कॉपीराइट वाले कोर्स मटीरियल को शेयर या डिस्ट्रीब्यूट नहीं करूँगा। यह STATEMENT बिना किसी दबाव के, पूरी जानकारी के साथ और अपनी मर्ज़ी से दिया जा रहा है।"
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Profile Photo Auto-Capture Confirmation Circle */}
            <div className="flex flex-col items-center gap-4 group pt-2 pb-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Captured Profile Snapshot</label>
              <div className="relative">
                <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all bg-white ${files.photo ? 'border-primary-500 shadow-2xl scale-105' : 'border-slate-100 shadow-inner'}`}>
                  {files.photo ? (
                    <img src={URL.createObjectURL(files.photo)} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-200" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {files.photo ? '✓ Profile Photo Captured from Video Feed' : 'Awaiting video statement recording...'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Registered Email</label>
                <input type="email" className="input-premium w-full bg-slate-50 text-slate-500 cursor-not-allowed" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number *</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    maxLength={10}
                    className="input-premium w-full !pl-[90px]" 
                    placeholder="9876543210" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                  />
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-sm tracking-wide border-r border-slate-200/80 pr-3 h-6 flex items-center">IN +91</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMPACT LOCATION DETECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">PIN Code *</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  className="input-premium w-full focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all" 
                  placeholder="e.g. 110001" 
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">State / UT *</label>
                <SearchableDropdown value={formData.state} onChange={val => setFormData({...formData, state: val, city: ''})} options={Object.keys(indianStatesAndCities)} placeholder="Search State..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">City *</label>
                <SearchableDropdown value={formData.city} onChange={val => setFormData({...formData, city: val})} options={formData.state ? indianStatesAndCities[formData.state] : []} placeholder={formData.state ? "Select City..." : "Select State First"} disabled={!formData.state} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Identity Documents (Aadhaar & PAN) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarFront: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.aadhaarFront ? 'p-2' : 'p-6'}`}>
                       {files.aadhaarFront ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.aadhaarFront)} className="w-full h-full object-cover rounded-2xl" alt="Aadhaar Front Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change Front</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Aadhaar Front</span>
                         </>
                       )}
                    </div>
                 </div>
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarBack: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.aadhaarBack ? 'p-2' : 'p-6'}`}>
                       {files.aadhaarBack ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.aadhaarBack)} className="w-full h-full object-cover rounded-2xl" alt="Aadhaar Back Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change Back</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Aadhaar Back</span>
                         </>
                       )}
                    </div>
                 </div>
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, panCard: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.panCard ? 'p-2' : 'p-6'}`}>
                       {files.panCard ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.panCard)} className="w-full h-full object-cover rounded-2xl" alt="PAN Card Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change PAN</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">PAN Card</span>
                         </>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Digital Signature *</label>
              <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 h-[280px]">
                <SignatureCanvas onCapture={(blob) => setFiles({ ...files, signature: blob })} />
              </div>
            </div>

            {/* LEGAL ACKNOWLEDGEMENT */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200/60">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-primary-500" /> Legal Acknowledgement
               </h3>
               
               <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed max-h-60 overflow-y-auto pr-4 custom-scrollbar mb-6">
                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">1. Identity Verification and Authentication</h4>
                   <p>To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to capture a live photograph (selfie) at the commencement of and/or during the examination. This image will be used solely to authenticate the Candidate's identity against registered records. Failure to provide a clear image or any attempt to bypass this authentication may result in immediate disqualification.</p>
                 </div>
                 
                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">2. Purpose of Certification and Employment Disclaimer</h4>
                   <p>The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.</p>
                   <ul className="list-disc pl-5 mt-2 space-y-1">
                     <li><strong>No Guarantee of Employment:</strong> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                     <li><strong>No Guarantee of Financial Increase:</strong> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                   </ul>
                   <p className="mt-2">The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.</p>
                 </div>

                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">3. Academic Integrity</h4>
                   <p>The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate's profile and the nullification of any previous results.</p>
                 </div>

                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">4. Limitation of Liability</h4>
                   <p>The Portal shall not be held responsible for technical failures on the Candidate's end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.</p>
                 </div>
               </div>

               <label className="flex items-start gap-4 cursor-pointer group bg-white p-4 rounded-2xl border border-slate-200 hover:border-primary-500 transition-all shadow-sm">
                 <div className="relative flex items-center justify-center mt-0.5">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={termsAccepted}
                     onChange={(e) => setTermsAccepted(e.target.checked)}
                   />
                   <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center group-hover:border-primary-400">
                     <CheckCircle className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100" />
                   </div>
                 </div>
                 <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors select-none">
                   I have read, understood, and agree to follow all the legal terms and academic integrity policies mentioned above.
                 </span>
               </label>
            </div>

            <AnimatePresence>
              {termsAccepted && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <button type="submit" disabled={loading} className="w-full btn-premium !py-5 !text-lg !rounded-2xl shadow-2xl flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Complete Registration <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfile;
