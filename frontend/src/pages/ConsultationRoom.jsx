import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Share2,
  Clock,
  ShieldCheck,
  Send,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function ConsultationRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds

  // Chat
  const [messages, setMessages] = useState([
    {
      sender: 'ExpertConnect System',
      message: 'Welcome to your private encrypted consultation room. Your mentor will connect shortly.',
      timestamp: 'Just now',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const userVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Fetch booking details
  useEffect(() => {
    api
      .get(`/bookings/${bookingId}`)
      .then(({ data }) => {
        setBooking(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setRoomError(err.message || 'Booking not found.');
        setLoading(false);
      });
  }, [bookingId]);

  // Session countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Real-time Chat via Socket.io
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !bookingId) return;

    socket.emit('join-room', bookingId);

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receive-message', handleMessage);

    return () => {
      socket.off('receive-message', handleMessage);
    };
  }, [bookingId, socketRef]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // User media (webcam preview if allowed)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera not available or permission denied — graceful fallback
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const socket = socketRef?.current;
    const msgData = {
      roomId: bookingId,
      message: inputMsg.trim(),
      sender: booking?.clientName || 'You',
    };

    if (socket) {
      socket.emit('send-message', msgData);
    } else {
      // Fallback: show locally when socket is unavailable
      setMessages((prev) => [
        ...prev,
        {
          ...msgData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setInputMsg('');
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !micOn;
    }
    setMicOn((prev) => !prev);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !videoOn;
    }
    setVideoOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      // Only restore webcam if camera is still enabled by the user
      if (videoOn && streamRef.current && userVideoRef.current) {
        userVideoRef.current.srcObject = streamRef.current;
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        // Show the screen stream in the PiP window
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = screenStream;
        }
        setScreenSharing(true);

        // Auto-stop when the user clicks "Stop sharing" in the browser UI
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          screenStreamRef.current = null;
          // Only restore webcam if the user hasn't turned their camera off
          if (videoOn && streamRef.current && userVideoRef.current) {
            userVideoRef.current.srcObject = streamRef.current;
          }
          setScreenSharing(false);
        });
      } catch {
        // User cancelled or permission denied — no-op
      }
    }
  };

  const handleEndCall = () => {
    if (window.confirm('Leave consultation room and return to your sessions?')) {
      // Leave the socket room so the server-side membership is cleaned up
      socketRef?.current?.emit('leave-room', bookingId);
      // Stop all media tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      navigate('/my-bookings');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 78px)',
          background: '#0f1a15',
          color: '#9bb4a6',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className="skeleton-box" style={{ width: 320, height: 20, background: '#1a2e24' }} />
        <div className="skeleton-box" style={{ width: 200, height: 16, background: '#1a2e24' }} />
      </div>
    );
  }

  // Error state
  if (roomError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 78px)',
          background: '#0f1a15',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: '#17261f',
            borderRadius: 16,
            border: '1px solid #23382f',
            maxWidth: 480,
          }}
        >
          <AlertCircle size={40} color="#f87171" style={{ marginBottom: 16 }} />
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              color: '#f0fdf4',
              margin: '0 0 10px',
            }}
          >
            Room Unavailable
          </h2>
          <p style={{ color: '#9bb4a6', marginBottom: 24, fontSize: 14 }}>
            {roomError}
          </p>
          <Link to="/my-bookings" className="btn-primary">
            Return to My Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      {/* Room Header */}
      <header className="room-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: '#1d2e26',
              color: '#d1e0d7',
              borderColor: '#2f4b3d',
            }}
            onClick={() => navigate('/my-bookings')}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#f0fdf4' }}>
              Consultation with {booking?.expertName || 'Industry Mentor'}
            </div>
            <div style={{ fontSize: '11px', color: '#9bb4a6' }}>
              Scheduled slot: {booking?.timeSlot || '60 min'} · High-Definition Encrypted Channel
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1a3328',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #2f5442',
              color: '#6ee7b7',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <Clock size={14} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: '#9bb4a6',
            }}
          >
            <ShieldCheck size={14} color="#34d399" />
            <span>Peer-to-Peer Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Video & Chat Area */}
      <div className="room-main-stage">
        {/* Video Canvas Area */}
        <div className="video-grid">
          <div className="video-feed">
            {booking?.expertId?.avatar ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={booking.expertId.avatar}
                  alt={booking.expertName}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #2e7d32',
                    boxShadow: '0 0 30px rgba(46, 125, 50, 0.4)',
                    marginBottom: '16px',
                  }}
                />
                <div style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', color: '#ffffff' }}>
                  {booking.expertName}
                </div>
                <div style={{ fontSize: '13px', color: '#86efac', marginTop: '4px' }}>
                  ● Audio / Video Channel Active
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: '#244537',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '36px',
                    fontFamily: 'var(--font-serif)',
                    color: '#a7f3d0',
                    margin: '0 auto 16px',
                  }}
                >
                  {booking?.expertName?.slice(0, 2) || 'EC'}
                </div>
                <div style={{ fontSize: '18px', color: '#ffffff' }}>
                  {booking?.expertName || 'Expert Mentor'}
                </div>
              </div>
            )}

            {/* Picture-in-Picture: webcam or screen share */}
            <div className="user-pip-video">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: videoOn || screenSharing ? 'block' : 'none',
                }}
              />
              {!videoOn && !screenSharing && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#94a3b8',
                    fontSize: '11px',
                  }}
                >
                  Camera Off
                </div>
              )}
              {screenSharing && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: '9px',
                    color: '#6ee7b7',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '2px 0',
                  }}
                >
                  SCREEN SHARING
                </div>
              )}
            </div>
          </div>
        </div>

        {/* In-Session Live Chat */}
        <aside className="chat-panel">
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #23382f',
              fontSize: '13px',
              fontWeight: 700,
              color: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={15} />
            <span>Consultation Notes &amp; Chat</span>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => {
              const isMe = m.sender === (booking?.clientName || 'You');
              return (
                <div
                  key={idx}
                  className={`chat-bubble ${isMe ? 'me' : 'expert'}`}
                >
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      marginBottom: '3px',
                      opacity: 0.8,
                    }}
                  >
                    {m.sender} · {m.timestamp}
                  </div>
                  <div>{m.message}</div>
                </div>
              );
            })}
            {/* Sentinel for auto-scroll */}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Send message or agenda note..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              style={{
                flex: 1,
                background: '#122019',
                border: '1px solid #2b4539',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 12px', borderRadius: '6px' }}
            >
              <Send size={14} />
            </button>
          </form>
        </aside>
      </div>

      {/* Media Controls Bar */}
      <footer className="room-controls">
        <button
          type="button"
          className="control-circle-btn"
          onClick={toggleMic}
          style={{ background: micOn ? '#2a4538' : '#e11d48' }}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          type="button"
          className="control-circle-btn"
          onClick={toggleVideo}
          style={{ background: videoOn ? '#2a4538' : '#e11d48' }}
          title={videoOn ? 'Turn camera off' : 'Turn camera on'}
          aria-label={videoOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          type="button"
          className="control-circle-btn"
          onClick={toggleScreenShare}
          style={{ background: screenSharing ? '#0284c7' : '#2a4538' }}
          title={screenSharing ? 'Stop sharing screen' : 'Share your screen'}
          aria-label={screenSharing ? 'Stop sharing screen' : 'Share your screen'}
        >
          <Share2 size={20} />
        </button>

        <button
          type="button"
          className="control-circle-btn danger"
          onClick={handleEndCall}
          title="End Consultation"
          aria-label="End Consultation"
        >
          <PhoneOff size={20} />
        </button>
      </footer>
    </div>
  );
}
