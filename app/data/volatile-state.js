var exports = module.exports = {};

var state = {
  queue : {},
  counter : 0
};

exports.addDj = function(dj, playlist) {
  if(!state.queue.hasOwnProperty(dj)) {
    state.queue[dj] = playlist;
  }
};

exports.rmDj = function(dj) {
  if(state.queue.hasOwnProperty(dj)) {
    delete state.queue[dj];
  }
};

exports.getState = function () {
  return state;
};

exports.printState = function () {
  console.log(state);
};
