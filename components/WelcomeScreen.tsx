'use client'

import { useState } from 'react'
import { Mic, Users, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface WelcomeScreenProps {
  onCreateRoom: () => Promise<void>
  onJoinRoom: (roomCode: string) => Promise<void>
  isLoading: boolean
}

export default function WelcomeScreen({ onCreateRoom, onJoinRoom, isLoading }: WelcomeScreenProps) {
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return
    
    setIsJoining(true)
    try {
      await onJoinRoom(roomCode)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
            Anonymous Voice Call
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with anyone, anywhere. Secure, private, and completely anonymous voice calls.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground text-sm">
              End-to-end encrypted calls with no data storage
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Anonymous</h3>
            <p className="text-muted-foreground text-sm">
              No accounts, no personal information required
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant</h3>
            <p className="text-muted-foreground text-sm">
              Start calling in seconds with just a room code
            </p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room */}
          <Card className="glass-effect border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Mic className="w-5 h-5" />
                Start a Call
              </CardTitle>
              <CardDescription>
                Create a new room and share the code with someone
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={onCreateRoom}
                disabled={isLoading}
                size="lg"
                className="w-full gradient-bg hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Create Room
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="glass-effect border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Join a Call
              </CardTitle>
              <CardDescription>
                Enter a room code to join an existing call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={8}
              />
              <Button 
                onClick={handleJoinRoom}
                disabled={!roomCode.trim() || isJoining || isLoading}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Join Room
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>🔒 Your privacy is protected. No data is stored or logged.</p>
        </div>
      </div>
    </div>
  )
}

