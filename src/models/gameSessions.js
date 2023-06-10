const mongoose = require('mongoose');

const gameSessionsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    required: true
  },
  roomId: { type: String, required: true },
  board: {
    type: Object,
    
  },
  currentPlayer: {
    type: Boolean,
    default: false
  }
})


module.exports = mongoose.model('Game', gameSessionsSchema);