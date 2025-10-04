'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { generateRoomCode } from '@/lib/utils'

export interface CallState {
  isConnected: boolean
  isMuted: boolean
  isSpeakerOn: boolean
  callDuration: number
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected'
}

export interface RoomState {
  roomId: string | null
  isInRoom: boolean
  participants: number
}

export const useVoiceCall = () => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isMuted: false,
    isSpeakerOn: true,
    callDuration: 0,
    connectionStatus: 'idle'
  })
  
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    isInRoom: false,
    participants: 0
  })

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callDurationRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001'
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setCallState(prev => ({ ...prev, connectionStatus: 'disconnected' }))
    })

    socket.on('room-created', (data: { roomId: string }) => {
      setRoomState(prev => ({ 
        ...prev, 
        roomId: data.roomId, 
        isInRoom: true,
        participants: 1
      }))
      setCallState(prev => ({ ...prev, connectionStatus: 'connecting' }))
    })

    socket.on('room-joined', (data: { roomId: string }) => {
      setRoomState(prev => ({ 
        ...prev, 
        roomId: data.roomId, 
        isInRoom: true,
        participants: 2
      }))
      setCallState(prev => ({ ...prev, connectionStatus: 'connecting' }))
    })

    socket.on('user-joined', () => {
      setRoomState(prev => ({ ...prev, participants: 2 }))
      startCall()
    })

    socket.on('user-left', () => {
      setRoomState(prev => ({ ...prev, participants: 1 }))
      setCallState(prev => ({ ...prev, isConnected: false, connectionStatus: 'idle' }))
      stopCallDuration()
    })

    socket.on('room-not-found', () => {
      alert('Room not found. Please check the code.')
    })

    socket.on('room-full', () => {
      alert('Room is full. Maximum 2 participants allowed.')
    })

    // WebRTC signaling
    socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      await handleOffer(data.offer)
    })

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      await handleAnswer(data.answer)
    })

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      await handleIceCandidate(data.candidate)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Call duration timer
  useEffect(() => {
    if (callState.isConnected && callState.connectionStatus === 'connected') {
      startCallDuration()
    } else {
      stopCallDuration()
    }
  }, [callState.isConnected, callState.connectionStatus])

  const startCallDuration = () => {
    if (callDurationRef.current) return
    
    callDurationRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }))
    }, 1000)
  }

  const stopCallDuration = () => {
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current)
      callDurationRef.current = null
    }
  }

  const getUserMedia = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      localStreamRef.current = stream
      return stream
    } catch (error) {
      throw new Error('Microphone access denied')
    }
  }

  const createRoom = async (): Promise<void> => {
    try {
      await getUserMedia()
      const roomId = generateRoomCode()
      socketRef.current?.emit('create-room', { roomId })
    } catch (error) {
      throw new Error('Unable to access microphone')
    }
  }

  const joinRoom = async (roomCode: string): Promise<void> => {
    if (!roomCode.trim()) {
      throw new Error('Please enter a room code')
    }

    try {
      await getUserMedia()
      socketRef.current?.emit('join-room', { roomId: roomCode.toUpperCase() })
    } catch (error) {
      throw new Error('Unable to access microphone')
    }
  }

  const startCall = async (): Promise<void> => {
    if (!localStreamRef.current) return

    try {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      })

      const peerConnection = peerConnectionRef.current

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0]
        setCallState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionStatus: 'connected' 
        }))
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && roomState.roomId) {
          socketRef.current?.emit('ice-candidate', {
            candidate: event.candidate,
            roomId: roomState.roomId
          })
        }
      }

      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      if (roomState.roomId) {
        socketRef.current?.emit('offer', {
          offer: offer,
          roomId: roomState.roomId
        })
      }
    } catch (error) {
      console.error('Error starting call:', error)
      throw new Error('Failed to start call')
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit): Promise<void> => {
    if (!localStreamRef.current) return

    try {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      const peerConnection = peerConnectionRef.current

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0]
        setCallState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionStatus: 'connected' 
        }))
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && roomState.roomId) {
          socketRef.current?.emit('ice-candidate', {
            candidate: event.candidate,
            roomId: roomState.roomId
          })
        }
      }

      await peerConnection.setRemoteDescription(offer)
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      
      if (roomState.roomId) {
        socketRef.current?.emit('answer', {
          answer: answer,
          roomId: roomState.roomId
        })
      }
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (answer: RTCSessionDescriptionInit): Promise<void> => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer)
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate)
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }, [])

  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }))
  }, [])

  const endCall = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    remoteStreamRef.current = null
    stopCallDuration()
    
    setCallState({
      isConnected: false,
      isMuted: false,
      isSpeakerOn: true,
      callDuration: 0,
      connectionStatus: 'idle'
    })
    
    setRoomState({
      roomId: null,
      isInRoom: false,
      participants: 0
    })

    if (roomState.roomId) {
      socketRef.current?.emit('leave-room', { roomId: roomState.roomId })
    }
  }, [roomState.roomId])

  const leaveRoom = useCallback(() => {
    endCall()
  }, [endCall])

  return {
    callState,
    roomState,
    createRoom,
    joinRoom,
    toggleMute,
    toggleSpeaker,
    endCall,
    leaveRoom
  }
}

