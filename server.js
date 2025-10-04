const { createServer } = require('http')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : false]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
})

// Store active rooms
const rooms = new Map()

// Clean up empty rooms every 5 minutes
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.participants.length === 0) {
      rooms.delete(roomId)
      console.log(`Cleaned up empty room: ${roomId}`)
    }
  }
}, 5 * 60 * 1000)

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Create a new room
  socket.on('create-room', (data) => {
    const roomId = data.roomId || uuidv4().substring(0, 8).toUpperCase()
    console.log(`Creating room: ${roomId}`)
    
    rooms.set(roomId, {
      id: roomId,
      participants: [socket.id],
      createdAt: new Date()
    })
    
    socket.join(roomId)
    socket.emit('room-created', { roomId })
    console.log(`Room created: ${roomId}`)
  })

  // Join an existing room
  socket.on('join-room', (data) => {
    const { roomId } = data
    console.log(`Attempting to join room: ${roomId}`)
    
    const room = rooms.get(roomId)
    
    if (!room) {
      console.log(`Room ${roomId} not found`)
      socket.emit('room-not-found')
      return
    }
    
    if (room.participants.length >= 2) {
      console.log(`Room ${roomId} is full`)
      socket.emit('room-full')
      return
    }
    
    room.participants.push(socket.id)
    socket.join(roomId)
    socket.emit('room-joined', { roomId })
    
    // Notify other participants
    socket.to(roomId).emit('user-joined', { userId: socket.id })
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      from: socket.id
    })
  })

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      from: socket.id
    })
  })

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    })
  })

  // Handle leaving room
  socket.on('leave-room', (data) => {
    const { roomId } = data
    const room = rooms.get(roomId)
    
    if (room) {
      const index = room.participants.indexOf(socket.id)
      if (index > -1) {
        room.participants.splice(index, 1)
        socket.to(roomId).emit('user-left', { userId: socket.id })
      }
    }
    
    socket.leave(roomId)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove user from all rooms
    for (const [roomId, room] of rooms.entries()) {
      const index = room.participants.indexOf(socket.id)
      if (index > -1) {
        room.participants.splice(index, 1)
        socket.to(roomId).emit('user-left', { userId: socket.id })
        
        // Clean up empty rooms
        if (room.participants.length === 0) {
          rooms.delete(roomId)
          console.log(`Room ${roomId} deleted (empty)`)
        }
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

