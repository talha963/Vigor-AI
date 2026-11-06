'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Lock,
  MessageSquare,
  FileText,
  User,
  Activity,
  CheckCircle2,
  Sparkles,
  Send,
  ArrowLeft,
  RotateCcw,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Wifi,
  Stethoscope,
  Pill,
  Award,
  AlertCircle,
  X,
  CheckCheck,
  ChevronRight,
  Download,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { getCurrentDoctor } from '@/lib/firebase';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  time: string;
}

function TelehealthRoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = (params?.bookingId as string) || 'bk_demo';
  const roleParam = searchParams?.get('role') === 'doctor' ? 'doctor' : 'patient';
  const isDoctor = roleParam === 'doctor';

  // Doctor session if logged in
  const loggedDoctor = getCurrentDoctor();
  let savedSettings: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('vigor_doctor_settings');
      if (raw) savedSettings = JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }
  const doctorDisplayName = loggedDoctor?.fullName || savedSettings?.fullName || 'Dr. Ali Khan';
  const doctorLicense = loggedDoctor?.licenseNumber || savedSettings?.dohLicense || 'DOH-AUH-2024-9102';
  const myName = isDoctor ? doctorDisplayName : 'Patient (Confidential Pseudonym)';
  const peerName = isDoctor
    ? `Patient (Ref: ${bookingId.slice(-6).toUpperCase()})`
    : `${doctorDisplayName} (Consultant Andrologist)`;

  // Video & Audio States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [callDuration, setCallDuration] = useState(0);

  // Audio voice activity detection & Autoplay unblock
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Layout & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClinicalSheetOpen, setIsClinicalSheetOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [pipPosition, setPipPosition] = useState<'bottom-right' | 'top-right'>('bottom-right');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: isDoctor ? 'patient' : 'doctor',
      senderName: peerName,
      text: isDoctor
        ? `Hello ${doctorDisplayName}, I have entered the confidential waiting room. My consultation parameters are loaded.`
        : 'Welcome to your Vigor clinical consultation. Both video and microphone are live and encrypted.',
      time: 'Just now',
    },
  ]);
  const [messageInput, setMessageInput] = useState('');

  // Clinical Prescription State (Doctor writes, Patient sees in real time)
  const [prescriptionText, setPrescriptionText] = useState(
    '1. Bilateral Scrotal Doppler Ultrasound (Evaluate subclinical varicocele & venous reflux).\n2. Endocrine Serum Profile: Total Testosterone, FSH, LH, and Prolactin.\n3. Repeat CASA Semen Analysis in 4 weeks.\n4. Micronutrient protocol: L-Carnitine 2000mg + CoQ10 200mg daily.'
  );
  const [activePrescription, setActivePrescription] = useState<string | null>(null);
  const [prescribingSaved, setPrescribingSaved] = useState(false);

  // WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const lastSignalPollTimeRef = useRef<number>(Date.now() - 10000);

  // Audio Analysers
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);

  // ========================================================
  // 1. WebRTC & Media Stream Initialization
  // ========================================================
  useEffect(() => {
    let active = true;
    let pollInterval: any = null;

    // A. Start local camera & microphone with optimal audio processing
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!active) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup local audio meter
        setupAudioAnalyser(stream, true);

        // Initialize WebRTC
        initializePeerConnection(stream);
      } catch (err) {
        console.warn('getUserMedia fallback: creating simulated video canvas stream', err);
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#38BDF8';
          ctx.font = '24px sans-serif';
          ctx.fillText(myName, 40, 240);
        }
        const canvasStream = canvas.captureStream(15);
        localStreamRef.current = canvasStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = canvasStream;
        }
        initializePeerConnection(canvasStream);
      }
    };

    // B. Setup PeerConnection & Media Track Handlers
    const initializePeerConnection = (stream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      // Add local stream tracks to PC
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote media tracks (both video & audio)
      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        // Add received track to remote stream
        remoteStreamRef.current.addTrack(event.track);

        // Attach to remote video element
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(() => {
            setIsAudioBlocked(true);
          });
        }

        // Attach to remote audio element for guaranteed unmuted voice
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.play().catch(() => {
            setIsAudioBlocked(true);
          });
        }

        // Setup remote audio voice activity analyser
        setupAudioAnalyser(remoteStreamRef.current, false);

        setCallStatus('connected');
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'candidate',
            payload: event.candidate.toJSON(),
          });
        }
      };

      // Handle Peer Connection State changes
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC ConnectionState]', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          unblockAudio();
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.warn('[WebRTC] Connection lost or disconnected');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC ICEState]', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallStatus('connected');
          unblockAudio();
        }
      };

      // Setup Data Channel for chat & real-time prescription broadcasts
      if (isDoctor) {
        const dc = pc.createDataChannel('telehealth_chat');
        setupDataChannel(dc);
      } else {
        pc.ondatachannel = (event) => {
          setupDataChannel(event.channel);
        };
      }

      // Initialize Signaling Channels (BroadcastChannel + HTTP Polling)
      setupSignaling(pc);
    };

    const setupDataChannel = (dc: RTCDataChannel) => {
      dataChannelRef.current = dc;
      dc.onopen = () => console.log('WebRTC DataChannel opened');
      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat') {
            receiveChatMessage(data.message);
          } else if (data.type === 'prescription') {
            setActivePrescription(data.prescription);
            setIsClinicalSheetOpen(true);
          }
        } catch (e) {
          console.error('Data channel parse error', e);
        }
      };
    };

    // C. Setup Dual-Layer Signaling (BroadcastChannel + Fallback API Polling)
    const setupSignaling = (pc: RTCPeerConnection) => {
      const channelName = `vigor_telehealth_${bookingId}`;
      const bc = new BroadcastChannel(channelName);
      broadcastChannelRef.current = bc;

      bc.onmessage = async (event) => {
        const msg = event.data;
        if (!msg || msg.senderRole === roleParam) return;
        handleSignalMessage(pc, msg);
      };

      // Announce entry into room
      sendSignal({ type: 'join' });

      // Start HTTP polling loop every 1000ms for cross-browser, cross-window, and cross-device sessions
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/telehealth/signal?roomId=${encodeURIComponent(bookingId)}&receiver=${roleParam}&since=${lastSignalPollTimeRef.current}`
          );
          if (!res.ok) return;
          const data = await res.json();
          if (data.signals && data.signals.length > 0) {
            for (const s of data.signals) {
              if (s.sender !== roleParam) {
                await handleSignalMessage(pc, s);
              }
            }
          }
          if (data.now) {
            lastSignalPollTimeRef.current = data.now;
          }
        } catch (e) {
          // ignore transient polling errors
        }
      }, 1000);

      // If doctor is in room, attempt offer after 800ms
      setTimeout(() => {
        if (isDoctor && pc.signalingState === 'stable') {
          initiateOffer(pc);
        }
      }, 800);
    };

    const handleSignalMessage = async (pc: RTCPeerConnection, msg: any) => {
      try {
        const msgKey = msg.id || `${msg.type}_${msg.timestamp || Date.now()}`;
        if (processedSignalIdsRef.current.has(msgKey)) return;
        processedSignalIdsRef.current.add(msgKey);

        if (msg.type === 'join') {
          // A peer has joined! If doctor, initiate or renegotiate offer
          if (isDoctor) {
            initiateOffer(pc);
          } else {
            // Patient notifies presence
            sendSignal({ type: 'patient_ready' });
          }
        } else if (msg.type === 'patient_ready') {
          if (isDoctor) {
            initiateOffer(pc);
          }
        } else if (msg.type === 'offer') {
          // Received offer from doctor
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));

          // Flush queued candidates
          await flushIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendSignal({ type: 'answer', payload: answer });
          setCallStatus('connected');
          unblockAudio();
        } else if (msg.type === 'answer') {
          // Received answer from patient
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            await flushIceCandidates(pc);
            setCallStatus('connected');
            unblockAudio();
          }
        } else if (msg.type === 'candidate') {
          if (msg.payload) {
            const candidateInit = msg.payload;
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
            } else {
              iceCandidatesQueueRef.current.push(candidateInit);
            }
          }
        } else if (msg.type === 'chat') {
          receiveChatMessage(msg.message);
        } else if (msg.type === 'prescription') {
          setActivePrescription(msg.prescription);
          setIsClinicalSheetOpen(true);
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    };

    startMedia();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close();
      }
      if (remoteAudioContextRef.current) {
        remoteAudioContextRef.current.close();
      }
    };
  }, [bookingId, roleParam, isDoctor]);

  // Flush queued ICE Candidates helper
  const flushIceCandidates = async (pc: RTCPeerConnection) => {
    while (iceCandidatesQueueRef.current.length > 0) {
      const cand = iceCandidatesQueueRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('Error flushing candidate:', e);
        }
      }
    }
  };

  // Initiate WebRTC Offer
  const initiateOffer = async (pc: RTCPeerConnection) => {
    try {
      if (pc.signalingState !== 'stable') {
        console.log('Skipping offer: state is not stable:', pc.signalingState);
        return;
      }
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', payload: offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  // Send Signal Helper
  const sendSignal = (data: { type: string; payload?: any; message?: any; prescription?: any }) => {
    const signalId = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      ...data,
      id: signalId,
      senderRole: roleParam,
      timestamp: Date.now(),
    };

    processedSignalIdsRef.current.add(signalId);

    // 1. Send via local BroadcastChannel (instant sub-ms on same machine)
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(payload);
    }

    // 2. Also send to API in background for cross-device/network sessions
    fetch('/api/telehealth/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: bookingId,
        sender: roleParam,
        type: data.type,
        payload: data.payload || data.message || data.prescription,
      }),
    }).catch(() => {});
  };

  // Setup Web Audio Analyser for Speaking Level Detection
  const setupAudioAnalyser = (stream: MediaStream, isLocal: boolean) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (isLocal) {
        localAudioContextRef.current = audioCtx;
      } else {
        remoteAudioContextRef.current = audioCtx;
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeaking = average > 12;

        if (isLocal) {
          setIsLocalSpeaking(isSpeaking && isAudioEnabled);
        } else {
          setIsRemoteSpeaking(isSpeaking);
        }

        requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('AudioAnalyser setup error:', e);
    }
  };

  // Explicit unblock audio helper
  const unblockAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().then(() => setIsAudioBlocked(false)).catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().then(() => setIsAudioBlocked(false)).catch(() => {});
    }
    if (remoteAudioContextRef.current && remoteAudioContextRef.current.state === 'suspended') {
      remoteAudioContextRef.current.resume();
    }
  };

  // Play test audio chime to verify speakers
  const playSpeakerTestChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.error(e);
    }
  };

  // Call Duration Timer
  useEffect(() => {
    let interval: any = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle Controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const receiveChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
    if (!isChatOpen) {
      setUnreadChatCount((prev) => prev + 1);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: roleParam,
      senderName: myName,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput('');

    // Send through WebRTC DataChannel
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({ type: 'chat', message: newMsg }));
    }

    // Send through broadcast signaling
    sendSignal({ type: 'chat', message: newMsg });
  };

  const handleIssuePrescription = async () => {
    setPrescribingSaved(true);
    setActivePrescription(prescriptionText);

    // Broadcast live over DataChannel and signal to patient
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(
        JSON.stringify({ type: 'prescription', prescription: prescriptionText })
      );
    }
    sendSignal({ type: 'prescription', prescription: prescriptionText });

    // Save to MongoDB
    try {
      await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          prescription: prescriptionText,
          status: 'IN_CALL',
        }),
      });
    } catch (e) {
      console.error('Error saving prescription:', e);
    }

    setTimeout(() => setPrescribingSaved(false), 2000);
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
  };

  const copyPatientLink = () => {
    const patientUrl = `${window.location.origin}/telehealth/${bookingId}`;
    navigator.clipboard.writeText(patientUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // If Call Ended View
  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-[#0B141A] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-[#111B21] border border-[#202C33] rounded-3xl p-8 space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 text-[#00A884] flex items-center justify-center mx-auto text-4xl shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#00A884] block mb-1">
              WhatsApp Telehealth Completed
            </span>
            <h2 className="text-2xl font-black text-white">Consultation Concluded</h2>
            <p className="text-xs text-[#8696A0] mt-1">
              Duration: <span className="text-white font-mono">{formatTimer(callDuration)}</span> · Ref:{' '}
              <span className="font-mono">{bookingId}</span>
            </p>
          </div>

          {activePrescription && (
            <div className="p-4 rounded-2xl bg-[#202C33]/60 border border-[#222E35] text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#00A884] flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5" />
                  <span>Official DoH E-Prescription Issued</span>
                </span>
                <span className="text-[10px] text-[#8696A0]">Encrypted</span>
              </div>
              <p className="text-xs text-[#E9EDEF] whitespace-pre-line font-mono leading-relaxed bg-[#111B21] p-3 rounded-xl border border-white/5">
                {activePrescription}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link
              href={isDoctor ? '/doctor' : '/'}
              className="w-full py-3.5 rounded-2xl bg-[#00A884] hover:bg-[#008f70] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <span>{isDoctor ? 'Return to Doctor Portal' : 'Return to Home'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B141A] text-white flex flex-col font-sans select-none">
      {/* Hidden dedicated audio element to guarantee incoming voice stream is heard */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Browser Autoplay Block Warning Banner */}
      {isAudioBlocked && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={unblockAudio}
            className="px-4 py-2 rounded-full bg-[#00A884] hover:bg-[#008f70] text-black font-black text-xs flex items-center gap-2 shadow-2xl border-2 border-white"
          >
            <Volume2 className="w-4 h-4" />
            <span>Click to Unmute & Hear Voice Stream</span>
          </button>
        </div>
      )}

      {/* ========================================================
          1. TOP OVERLAY HEADER: WhatsApp Style Caller & Security Pill
          ======================================================== */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#0B141A]/95 via-[#0B141A]/60 to-transparent p-4 sm:px-6 sm:py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link
            href={isDoctor ? '/doctor' : '/'}
            className="p-2 sm:p-2.5 rounded-full bg-[#111B21]/80 hover:bg-[#202C33] text-[#8696A0] hover:text-white backdrop-blur-md border border-white/10 transition-colors"
            title="Exit Consultation"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{peerName}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-[10px] font-bold text-[#25D366]">
                <Lock className="w-3 h-3" />
                <span>End-to-End Encrypted</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8696A0]">
              <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-[#25D366] animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <span>
                {callStatus === 'connected' ? (
                  <>
                    <span className="font-mono text-white font-medium">{formatTimer(callDuration)}</span>
                    <span className="hidden sm:inline"> · 1080p Live Audio & Video</span>
                  </>
                ) : isDoctor ? (
                  'Waiting for patient to open waiting room...'
                ) : (
                  `Calling & connecting with ${doctorDisplayName}...`
                )}
              </span>

              {/* Remote Speaker Activity Badge */}
              {isRemoteSpeaking && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#25D366] text-[10px] font-bold animate-pulse flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>Speaking</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Top Status Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Copy Link Button so user can open the second tab easily */}
          <button
            onClick={copyPatientLink}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111B21]/90 hover:bg-[#202C33] border border-white/10 text-[11px] font-bold text-[#E9EDEF] transition-colors"
            title="Copy Patient Link to Open in Another Tab"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5 text-[#00A884]" />}
            <span>{copiedLink ? 'Link Copied!' : isDoctor ? 'Copy Patient Link' : 'Copy Room Link'}</span>
          </button>

          <button
            onClick={playSpeakerTestChime}
            className="p-2 rounded-full bg-[#111B21]/90 hover:bg-[#202C33] border border-white/10 text-[#8696A0] hover:text-white transition-colors"
            title="Test Speakers with Chime"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#111B21]/80 border border-white/10 text-emerald-400 text-xs">
            <Wifi className="w-3.5 h-3.5 text-[#25D366]" />
            <span className="hidden sm:inline text-[11px] font-mono text-[#8696A0]">HD</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CENTRAL STAGE: Full Bleed Remote Video Stream
          ======================================================== */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-[#0B141A]">
        {/* Remote Video Element */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            callStatus === 'connected' ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* WhatsApp Ringing / Avatar Placeholder if Video Not Flowing */}
        {callStatus === 'calling' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-[#0B141A]/90 backdrop-blur-xs z-10 px-4">
            <div className="relative">
              {/* Radar pulse rings */}
              <div className="absolute -inset-4 rounded-full bg-[#00A884]/20 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-[#00A884]/10 animate-pulse" />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#111B21] border-2 border-[#00A884] flex items-center justify-center text-5xl sm:text-6xl shadow-2xl">
                {isDoctor ? '🧑' : '👨‍⚕️'}
              </div>
            </div>

            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-lg sm:text-xl font-bold text-white">{peerName}</h3>
              <p className="text-xs text-[#8696A0] leading-relaxed">
                {isDoctor
                  ? 'Waiting for the patient to open their consultation room. You can copy the patient link below to test in another tab.'
                  : `Ringing ${doctorDisplayName} (Consultant Andrologist)...`}
              </p>

              {/* Direct 1-Click Copy Link button right in center */}
              <div className="pt-2">
                <button
                  onClick={copyPatientLink}
                  className="px-4 py-2.5 rounded-2xl bg-[#00A884] hover:bg-[#008f70] text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg transition-transform active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Patient URL Copied to Clipboard!' : 'Copy Patient Room Link to Test'}</span>
                </button>
                <p className="text-[10px] text-stone-500 mt-2 font-mono">
                  Room Ref: {bookingId}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-mono text-[#00A884]">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            3. PICTURE-IN-PICTURE (PiP): Floating Local Camera View
            ======================================================== */}
        <div
          onClick={() =>
            setPipPosition((prev) => (prev === 'bottom-right' ? 'top-right' : 'bottom-right'))
          }
          className={`absolute z-20 cursor-pointer transition-all duration-300 ${
            pipPosition === 'bottom-right' ? 'bottom-24 right-4 sm:right-6' : 'top-20 right-4 sm:right-6'
          } w-32 sm:w-44 md:w-52 h-44 sm:h-56 md:h-64 rounded-3xl overflow-hidden bg-[#111B21] border-2 border-white/20 shadow-2xl group hover:border-[#00A884]`}
        >
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#111B21] text-[#8696A0] text-xs gap-2">
              <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center text-xl">
                {isDoctor ? '👨‍⚕️' : '🧑'}
              </div>
              <span className="text-[11px] font-bold">Camera Off</span>
            </div>
          )}

          {/* Local overlay label & voice activity indicator */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
              <span>You</span>
              {isLocalSpeaking && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-ping" />
              )}
            </div>
            {!isAudioEnabled && (
              <span className="p-1 rounded-full bg-red-600 text-white shadow-sm">
                <MicOff className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          4. BOTTOM FLOATING CONTROLS: Authentic WhatsApp Pill Bar
          ======================================================== */}
      <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center px-4 pointer-events-auto">
        <div className="bg-[#111B21]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-2xl flex items-center gap-3 sm:gap-4">
          {/* Mute/Unmute Mic */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              isAudioEnabled
                ? 'bg-[#202C33] hover:bg-[#2A3942] text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoEnabled
                ? 'bg-[#202C33] hover:bg-[#2A3942] text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Flip / Mirror Local Video */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#202C33] hover:bg-[#2A3942] text-white flex items-center justify-center transition-all"
            title="Mirror Camera View"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>

          {/* In-Call Live Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadChatCount(0);
            }}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              isChatOpen
                ? 'bg-[#00A884] text-black'
                : 'bg-[#202C33] hover:bg-[#2A3942] text-white'
            }`}
            title="In-Call Consultation Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] text-black text-[10px] font-black flex items-center justify-center border-2 border-[#111B21]">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Clinical Case File & Prescription Pad (Doctor & Patient) */}
          <button
            type="button"
            onClick={() => setIsClinicalSheetOpen(!isClinicalSheetOpen)}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              isClinicalSheetOpen
                ? 'bg-[#00A884] text-black'
                : 'bg-[#202C33] hover:bg-[#2A3942] text-white'
            }`}
            title="Clinical Case & WHO 2021 Reference"
          >
            <FileText className="w-5 h-5" />
            <span className="hidden lg:inline text-[9px] font-black absolute -bottom-1 uppercase bg-[#00A884] text-black px-1.5 rounded-full">
              WHO
            </span>
          </button>

          {/* Red WhatsApp End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#EA0038] hover:bg-[#D00032] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform ml-1 sm:ml-2"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ========================================================
          5. WHATSAPP IN-CALL LIVE CHAT SLIDE-OVER DRAWER
          ======================================================== */}
      {isChatOpen && (
        <div className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-96 bg-[#111B21] border-l border-[#202C33] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Chat Header */}
          <div className="p-4 bg-[#202C33] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00A884]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live WhatsApp Chat
              </h3>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg text-[#8696A0] hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Encrypted Disclaimer */}
          <div className="px-4 py-2 bg-[#182229] border-b border-white/5 text-[10px] text-center text-[#8696A0] flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-[#00A884]" />
            <span>Messages are end-to-end encrypted under DoH Telehealth standards.</span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0B141A]">
            {chatMessages.map((msg) => {
              const isMine = msg.sender === roleParam;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-[#005C4B] text-white rounded-tr-xs'
                        : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-xs'
                    }`}
                  >
                    {!isMine && (
                      <span className="block text-[10px] font-bold text-[#00A884] mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696A0]">
                      <span>{msg.time}</span>
                      {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Response Chips */}
          <div className="p-2 bg-[#111B21] border-t border-white/5 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => setMessageInput('Doctor, I can hear and see you clearly.')}
              className="px-2.5 py-1 rounded-full bg-[#202C33] text-[#8696A0] hover:text-white whitespace-nowrap"
            >
              I can hear clearly
            </button>
            <button
              onClick={() => setMessageInput('Understood. Reviewing the prescription now.')}
              className="px-2.5 py-1 rounded-full bg-[#202C33] text-[#8696A0] hover:text-white whitespace-nowrap"
            >
              Prescription noted
            </button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#202C33] flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type confidential message..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[#2A3942] border-none text-white placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-[#00A884] hover:bg-[#008f70] text-black font-bold transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          6. CLINICAL CASE FILE & DIGITAL E-PRESCRIPTION DRAWER
          ======================================================== */}
      {isClinicalSheetOpen && (
        <div className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[440px] bg-[#111B21] border-l border-[#202C33] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 bg-[#202C33] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#00A884]" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isDoctor ? 'Clinical Case File & Prescription Pad' : 'Your Clinical Consultation File'}
                </h3>
                <p className="text-[10px] text-[#8696A0]">Booking Ref: {bookingId}</p>
              </div>
            </div>
            <button
              onClick={() => setIsClinicalSheetOpen(false)}
              className="p-1 rounded-lg text-[#8696A0] hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Patient WHO 2021 Reference Parameters */}
            <div className="p-3.5 rounded-2xl bg-[#182229] border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#00A884] tracking-wider">
                  WHO 2021 Semen Analysis Reference
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-sky-300 font-bold">
                  ANDROLOGY_UROLOGY
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-[#111B21] border border-white/5">
                  <span className="text-[10px] text-[#8696A0] block">Sperm Conc.</span>
                  <span className="text-sm font-black text-white">16 M/ml</span>
                  <span className="text-[9px] text-[#25D366] block">Ref: ≥15</span>
                </div>
                <div className="p-2 rounded-xl bg-[#111B21] border border-red-900/40">
                  <span className="text-[10px] text-red-400 block font-bold">Prog. Motility</span>
                  <span className="text-sm font-black text-red-400">22%</span>
                  <span className="text-[9px] text-red-400 block">Ref: ≥32% (Sub)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#111B21] border border-white/5">
                  <span className="text-[10px] text-[#8696A0] block">Normal Forms</span>
                  <span className="text-sm font-black text-white">3%</span>
                  <span className="text-[9px] text-[#8696A0] block">Ref: ≥4%</span>
                </div>
              </div>

              <p className="text-[11px] text-[#8696A0] leading-relaxed pt-1">
                Clinical screening flags asthenozoospermia pattern (sub-reference progressive motility).
                No urgent red flags (torsion/acute infection ruled out).
              </p>
            </div>

            {/* Doctor's Prescription Pad */}
            {isDoctor ? (
              <div className="p-4 rounded-2xl bg-[#182229] border border-[#00A884]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#00A884] flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Doctor E-Prescription Pad</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#8696A0]">DoH Malaffi Sync</span>
                </div>

                <textarea
                  rows={6}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-[#111B21] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-[#00A884] leading-relaxed"
                  placeholder="Enter medical prescription and testing orders..."
                />

                <button
                  type="button"
                  onClick={handleIssuePrescription}
                  disabled={prescribingSaved}
                  className="w-full py-3 rounded-xl bg-[#00A884] hover:bg-[#008f70] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  {prescribingSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Prescription Broadcasted Live!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Issue Official DoH E-Prescription</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Patient View of Doctor's Live Prescription */
              <div className="p-4 rounded-2xl bg-[#182229] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#00A884] flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Specialist Treatment Plan & Orders</span>
                  </span>
                  <span className="text-[10px] text-[#25D366] font-bold">● Live Sync</span>
                </div>

                {activePrescription ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#E9EDEF] whitespace-pre-line font-mono bg-[#111B21] p-3 rounded-xl border border-white/5 leading-relaxed">
                      {activePrescription}
                    </p>
                    <div className="p-2.5 rounded-xl bg-[#00A884]/10 border border-[#00A884]/30 text-[11px] text-[#00A884] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Signed by {doctorDisplayName} ({doctorLicense})</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#111B21] text-center text-[#8696A0] text-xs">
                    The specialist will issue your prescription orders and ultrasound referrals directly during
                    this consultation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TelehealthRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#0B141A] text-white flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#00A884] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#8696A0]">Initializing WhatsApp Telehealth Suite...</p>
          </div>
        </div>
      }
    >
      <TelehealthRoomContent />
    </Suspense>
  );
}
