'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatTime, copyToClipboard } from '@/lib/utils'

interface CallScreenProps {
  roomId: string
  callState: {
    isConnected: boolean
    isMuted: boolean
    isSpeakerOn: boolean
    callDuration: number
    connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected'
  }
  roomState: {
    participants: number
  }
  onToggleMute: () => void
  onToggleSpeaker: () => void
  onEndCall: () => void
  onLeaveRoom: () => void
}

export default function CallScreen({
  roomId,
  callState,
  roomState,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  onLeaveRoom
}: CallScreenProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomId)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusMessage = () => {
    switch (callState.connectionStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      default:
        return roomState.participants === 1 ? 'Waiting for someone to join...' : 'Ready to connect'
    }
  }

  const getStatusColor = () => {
    switch (callState.connectionStatus) {
      case 'connecting':
        return 'text-yellow-400'
      case 'connected':
        return 'text-green-400'
      case 'disconnected':
        return 'text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Room Info */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Room Code</CardTitle>
            <CardDescription>Share this code with someone to join the call</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <code className="text-4xl font-mono font-bold text-primary bg-primary/10 px-6 py-3 rounded-lg">
                {roomId}
              </code>
              <Button
                onClick={handleCopyCode}
                size="icon"
                variant="outline"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {copied ? 'Copied to clipboard!' : 'Click to copy'}
            </p>
          </CardContent>
        </Card>

        {/* Call Status */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-lg font-medium ${getStatusColor()} mb-2`}>
                {getStatusMessage()}
              </div>
              {callState.isConnected && (
                <div className="text-2xl font-mono text-primary">
                  {formatTime(callState.callDuration)}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                {roomState.participants} participant{roomState.participants !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Controls */}
        <Card className="glass-effect border-primary/20 mb-8">
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              {/* Mute Button */}
              <Button
                onClick={onToggleMute}
                size="icon"
                variant={callState.isMuted ? 'destructive' : 'outline'}
                className={`w-16 h-16 rounded-full ${
                  callState.isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'hover:bg-primary/10'
                }`}
              >
                {callState.isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>

              {/* Speaker Button */}
              <Button
                onClick={onToggleSpeaker}
                size="icon"
                variant={!callState.isSpeakerOn ? 'destructive' : 'outline'}
                className={`w-16 h-16 rounded-full ${
                  !callState.isSpeakerOn 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'hover:bg-primary/10'
                }`}
              >
                {callState.isSpeakerOn ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </Button>

              {/* End Call Button */}
              <Button
                onClick={onEndCall}
                size="icon"
                variant="destructive"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🔒 Your call is encrypted and anonymous</p>
          <p>No data is stored or logged</p>
        </div>
      </div>
    </div>
  )
}

