const initializeGameState = () => {
  return {
    board: [[{ value: '' }, { value: '' }, { value: '' }], [{ value: '' }, { value: '' }, { value: '' }], [{ value: '' }, { value: '' }, { value: '' }]],
    currentPlayer: false,
  }
}

module.exports = {
  initializeGameState
}