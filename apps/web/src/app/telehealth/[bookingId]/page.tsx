'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';

export default function TelehealthRoomPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = (params?.bookingId as string) || 'bk_demo';

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'video' | 'chat' | 'clinical'>('video');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'doctor' | 'patient'; text: string; time: string }[]
  >([
    {
      sender: 'doctor',
      text: 'Hello. I have received your confidential Vigor triage evaluation. I am reviewing the WHO 2021 motility benchmarks now.',
      time: 'Just now',
    },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [doctorJoined, setDoctorJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Simulate camera stream or placeholder
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.log('Camera permission or simulator fallback:', err);
      });

    // Simulate doctor connecting after 3 seconds
    const timer = setTimeout(() => {
      setDoctorJoined(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const newMsg = {
      sender: 'patient' as const,
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput('');

    // Simulated doctor reply after 2 seconds
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: 'Understood. Based on your progressive motility score, we will schedule a repeat semen analysis and a hormonal profile.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EA] dark:bg-[#121110] text-stone-900 dark:text-[#FAF7F2] flex flex-col font-sans transition-colors">
      {/* Top Telehealth Security Bar */}
      <header className="px-6 py-3.5 bg-white dark:bg-[#181715] border-b border-[#DDD7C8] dark:border-stone-800 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-sm font-bold tracking-tight">
                Vigor Telehealth Consultation · Abu Dhabi Care Suite
              </h1>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Reference: <span className="font-mono">{bookingId}</span> · Peer-to-Peer Encrypted (AES-256)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-PII Privacy Floor Active</span>
          </div>
        </div>
      </header>

      {/* Main Video & Consultation Stage */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left: Video Canvas (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="relative flex-1 bg-[#1C1A17] rounded-3xl overflow-hidden border border-stone-800 shadow-xl flex items-center justify-center min-h-[420px]">
            {/* Remote Doctor Video Feed */}
            {doctorJoined ? (
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-900 to-[#181614]">
                <div className="text-center p-6 space-y-3">
                  <div className="w-24 h-24 rounded-full bg-blue-900/60 border-2 border-sky-400 text-white flex items-center justify-center text-4xl mx-auto shadow-lg animate-pulse">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Dr. Tariq Al-Hashimi, MD</h3>
                    <p className="text-xs text-sky-300">Consultant Andrologist · Live Telehealth Feed</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-[10px] font-bold border border-emerald-700">
                      ● Pre-loaded Triage Verified (WHO 2021)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center text-3xl mx-auto">
                  👨‍⚕️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connecting with Specialist...</h3>
                  <p className="text-xs text-stone-400">
                    The physician is reviewing your screening summary and joining your secure room.
                  </p>
                </div>
              </div>
            )}

            {/* Picture-in-Picture: Patient's Local Camera */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-48 h-28 sm:h-36 bg-stone-900 rounded-2xl overflow-hidden border-2 border-stone-700 shadow-2xl">
              {isVideoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 text-xs gap-1">
                  <VideoOff className="w-5 h-5" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                You (Confidential)
              </div>
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="p-3 bg-white dark:bg-[#181715] rounded-2xl border border-[#DDD7C8] dark:border-stone-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors ${
                  isAudioEnabled
                    ? 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors ${
                  isVideoEnabled
                    ? 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave Consultation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Side Consultation Drawer (Chat & Clinical Case File) */}
        <div className="bg-white dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-xl flex flex-col overflow-hidden h-[540px] lg:h-auto">
          {/* Drawer Tabs */}
          <div className="flex items-center border-b border-[#DDD7C8] dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#1F1D1A]">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Case File</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Doctor Chat</span>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'video' ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-800 dark:text-sky-300">
                      Pre-Consultation Summary
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-sky-300">
                      WHO 2021
                    </span>
                  </div>
                  <p className="font-bold text-stone-900 dark:text-white">
                    Specialist Andrology Review Pathway
                  </p>
                  <p className="text-[11px] text-stone-600 dark:text-[#DDD7C8] mt-1">
                    Screening flags elevated risk regarding progressive sperm motility and time to conception.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                    Verified Guidelines
                  </span>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span>Deterministic Red Flags</span>
                    <span className="font-bold text-emerald-600">Zero Urgent Flags</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span>Clinical Acuity</span>
                    <span className="font-bold text-blue-600">ANDROLOGY_UROLOGY</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span>Consent Ledger</span>
                    <span className="font-bold text-emerald-600">Active (Share Granted)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/80 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  💡 <strong>Patient Guidance:</strong> The physician will discuss your symptoms and may recommend an ultrasound or at-home semen test. You can ask any question freely.
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'patient' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'patient'
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-stone-400 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type private message..."
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
