import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import { Phone, PhoneOff, Mic, MicOff, Copy, Check } from 'lucide-react';

function App() {
  const [myId, setMyId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [status, setStatus] = useState('idle'); // idle, calling, connected, incoming
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    // 1. Setup Peer with Google's STUN servers for better global connectivity
    const peer = new Peer(undefined, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      setMyId(id);
      setStatus('idle');
    });

    // 2. Handle Incoming Calls
    peer.on('call', (incomingCall) => {
      // Automatically answer for simplicity, or we could add an "Answer" button
      setStatus('connected');
      
      navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          incomingCall.answer(stream); // Answer with audio
          
          incomingCall.on('stream', (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.play();
            }
          });
          
          callRef.current = incomingCall;
        })
        .catch(err => {
          console.error("Microphone permission denied", err);
          alert("We need microphone access to connect the call.");
        });
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, []);

  const startCall = () => {
    if (!friendId) return alert("Please enter an ID first");
    setStatus('calling');

    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        
        // Call the peer
        const call = peerRef.current.call(friendId, stream);
        
        call.on('stream', (remoteStream) => {
          setStatus('connected');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play();
          }
        });

        // Handle call close
        call.on('close', () => {
          endCall();
        });

        callRef.current = call;
      })
      .catch(err => {
        console.error("Microphone error", err);
        setStatus('idle');
      });
  };

  const endCall = () => {
    if (callRef.current) callRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus('idle');
    setFriendId('');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      {/* Invisible audio element for playing remote sound */}
      <audio ref={remoteAudioRef} />

      <div className="card">
        <div className="header">
          <h2>Audio Connect</h2>
          <div className="status-dot" style={{ backgroundColor: status === 'connected' ? '#4ade80' : '#fbbf24' }}></div>
        </div>

        {/* Section 1: My ID */}
        <div className="id-section">
          <label>Your Unique ID</label>
          <div className="copy-row">
            <span className="id-display">{myId || "Generating ID..."}</span>
            <button onClick={copyToClipboard} className="icon-btn">
              {copied ? <Check size={18} color="green" /> : <Copy size={18} />}
            </button>
          </div>
          <p className="hint">Share this ID with your friend so they can call you.</p>
        </div>

        <hr className="divider" />

        {/* Section 2: Call Actions */}
        {status === 'idle' || status === 'calling' ? (
          <div className="action-section">
            <label>Enter Friend's ID</label>
            <input 
              type="text" 
              placeholder="e.g. 7f90-22..." 
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              disabled={status === 'calling'}
            />
            
            <button 
              className={`call-btn ${status === 'calling' ? 'calling-anim' : ''}`} 
              onClick={startCall}
              disabled={status === 'calling' || !myId}
            >
              {status === 'calling' ? 'Calling...' : (
                <>
                  <Phone size={20} /> Call Now
                </>
              )}
            </button>
          </div>
        ) : (
          /* Section 3: Active Call Controls */
          <div className="active-call">
            <div className="avatar-pulse">
              <div className="avatar">
                <span style={{ fontSize: '2rem' }}>👤</span>
              </div>
            </div>
            <h3>Connected</h3>
            <p>00:00</p> {/* Timer could be added here */}

            <div className="controls">
              <button 
                className={`control-btn ${isMuted ? 'muted' : ''}`} 
                onClick={toggleMute}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button className="control-btn hangup" onClick={endCall}>
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;