'use client'

import { useState } from 'react'
import { useVoiceCall } from '@/hooks/useVoiceCall'
import WelcomeScreen from '@/components/WelcomeScreen'
import CallScreen from '@/components/CallScreen'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    callState,
    roomState,
    createRoom,
    joinRoom,
    toggleMute,
    toggleSpeaker,
    endCall,
    leaveRoom
  } = useVoiceCall()

  const handleCreateRoom = async () => {
    setIsLoading(true)
    try {
      await createRoom()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (roomCode: string) => {
    setIsLoading(true)
    try {
      await joinRoom(roomCode)
    } catch (error) {
      throw error // Re-throw to be handled by WelcomeScreen
    } finally {
      setIsLoading(false)
    }
  }

  if (roomState.isInRoom) {
    return (
      <CallScreen
        roomId={roomState.roomId!}
        callState={callState}
        roomState={roomState}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onEndCall={endCall}
        onLeaveRoom={leaveRoom}
      />
    )
  }

  return (
    <WelcomeScreen
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      isLoading={isLoading}
    />
  )
}

