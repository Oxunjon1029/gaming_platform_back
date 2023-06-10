require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express()
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const PORT = process.env.PORT || 9000
const connectDB = require('./src/db/connectDb')
const Game = require('./src/models/gameSessions')

app.use(cors());
app.use(express.json())


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
})
const getSocketRoom = socket => {
  const socketRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
  const gameRoom = socketRooms && socketRooms[0];
  return gameRoom
}
io.on('connection', (socket) => {
  socket.on('user_connected', async (data) => {
    const gameSessions = await Game.find({ name: data?.name })
    socket.emit('get_all_sessions', gameSessions)
  })
  socket.on('exit_game', async ({ gameId }) => {
    const gameRoom = getSocketRoom(socket)
    const lastData = await Game.find({ _id: gameId })
    await socket.leave(gameRoom)
     socket.to(gameRoom).emit('player_exit_the_game', ({ board: lastData?.board }))
  })
  socket.on('create_game_session', async (data) => {
    let { name, gameType, roomId } = data
    const gameSessions = await Game.find({ $and: [{ name: name }, { gameType: gameType }] });
    if (gameSessions.length > 0) {
      const lastRoomIdSplittedArr = gameSessions[gameSessions.length - 1].roomId.split('')
      let lastTwoNum = lastRoomIdSplittedArr[lastRoomIdSplittedArr.length - 2] !== "m" ? lastRoomIdSplittedArr[lastRoomIdSplittedArr.length - 2] + lastRoomIdSplittedArr[lastRoomIdSplittedArr.length - 1] : lastRoomIdSplittedArr[lastRoomIdSplittedArr.length - 1]
      console.log(lastRoomIdSplittedArr[lastRoomIdSplittedArr.length - 2] !== "m");
      let roomNum = parseInt(lastTwoNum) + 1

      roomId = 'tictactoeRoom' + roomNum
      const gameSession = await Game.create({ name: name, gameType: gameType, roomId: roomId, board: data?.board });
      socket.emit('game_created', [gameSession])
    } else {
      console.log('roomid', roomId)
      const gameSession = await Game.create({ name: name, gameType: gameType, roomId: roomId, board: data?.board });
      socket.emit('game_created', [gameSession])
    }

  })
  socket.on('join_room', async (data) => {
    const connectedSockets = io.sockets.adapter.rooms.get(data.roomId);
    const socketRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
    if (socketRooms.length > 0 || connectedSockets && connectedSockets.size === 2) {
      socket.emit('room_join_error', { error: 'Room is already full,please choose another room to play' })
    } else {
      await socket.join(data?.roomId)
      socket.emit('room_joined')
      if (io.sockets.adapter.rooms.get(data?.roomId).size === 2) {
        socket.emit('start_game', { start: true, symbol: 'x' });
        socket.to(data?.roomId).emit('start_game', { start: false, symbol: 'o' })
      }
    }
  })




  socket.on('update_game', async (data) => {
    const gameRoom = getSocketRoom(socket)
    const newData = await Game.findOneAndUpdate({ _id: data?.id }, { board: data?.matrix, currentPlayer: data?.currentPlayer }, { new: true })
    socket.to(gameRoom).emit('on_game_update', { board: newData?.board, playerTurn: newData?.currentPlayer })
  })

  socket.on('game_win', async (data) => {
    const gameRoom = getSocketRoom(socket);
    const newData = await Game.findOneAndUpdate({ _id: data?.id }, { board: data?.matrix }, { new: true })
     socket.to(gameRoom).emit('on_game_win', { message: data?.message, board: newData.board })
  })
  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

const start = async () => {
  try {
    await connectDB(process.env?.MONGO_URL || "mongodb+srv://Genius:Aoxunjon1029@cluster0.mtrdd.mongodb.net/itransition");
    server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`) });
  } catch (error) { console.log(error) }
};
start();