#!/usr/bin/env node
var static = require('./node-static');
var file = new static.Server('./public');
var debug = require('debug')('express-example');
const winston = require('winston');
const Immutable = require('immutable');
const Map = Immutable.Map;
const List = Immutable.List;
var _games = Map();
var games=[];
console.log("listen");
	var server=require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(8000);
console.log('node-static & socket.io server listening on port 8000');
const io = require('socket.io')(server);
io.sockets.on('connection', socket => {
  socket.emit('init', {
        'games': games
        }
    )
  socket.on('start', data => {
    console.log('start');
    console.log(data)
    let token;
    const b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    token = b.toString('base64').slice(12, 28);

    // token is valid for 3 minutes
    const timeout = setTimeout(() => {
      if (_games.getIn([token, 'players']).isEmpty()) {
        _games = _games.delete(token);
        games2 = games.filter(
          (item, idx) => item.token !== token
        );
        games=games2;
        socket.emit('token-expired');
      }
    }, 3 * 60 * 1000);

    _games = _games.set(token, Map({
      creator: socket,
      players: List(),
      interval: null,
      timeout: timeout,
    }));
    games.push({token: token,time:data.time,inc:data.inc});
    socket.emit('created', {token: token,time:data.time,inc:data.inc});
  });

  socket.on('join', data => {
    console.log("join");
    console.log(data);
    const game = _games.get(data.token);

    if (!game) {
      socket.emit('token-invalid');
      return;
    }

    const nOfPlayers = game.get('players').size;
    const colors = ['black', 'white'];
    let color;

    clearTimeout(game.get('timeout'));

    if (nOfPlayers >= 2) {
      socket.emit('full');
      return;
    } else if (nOfPlayers === 1) {
      if (game.getIn(['players', 0, 'color']) === 'black')
        color = 'white';
      else
        color = 'black';

      winston.log('info', 'Number of currently running games', {
        '#': _games.size
      });
    } else {
      color = colors[Math.floor(Math.random() * 2)];
    }

    // join room
    socket.join(data.token);
    data.inc=parseInt(data.inc,10);
    _games = _games.updateIn([data.token, 'players'], players =>
      players.push(Map({
        socket: socket,
        color: color,
        time: data.time - data.inc + 1,
        inc: data.inc
      })));
    //console.log(game.get('creator'));
    game.get('creator').emit('ready');
    console.log("emit ready");
    socket.emit('joined', {color: color});

    if (nOfPlayers === 1) {
      io.to(data.token).emit('both-joined');
    }
  });

  socket.on('clock-run', data => runClock(data.color, data.token, socket));

  socket.on('new-move', data => {
    maybeEmit('move', data.move, data.token, socket);
    if (data.move.gameOver) {
      clearInterval(_games.getIn([data.token, 'interval']));
    }
  });

  socket.on('send-message', data =>
    maybeEmit('receive-message', data, data.token, socket));

  socket.on('resign', data => {
    if (!_games.has(data.token)) return;
    clearInterval(_games.getIn([data.token, 'interval']));

    io.to(data.token).emit('player-resigned', {
      color: data.color
    });
  });

  socket.on('rematch-offer', data =>
    maybeEmit('rematch-offered', {}, data.token, socket));

  socket.on('rematch-decline', data =>
    maybeEmit('rematch-declined', {}, data.token, socket));

  socket.on('rematch-accept', data => {
    console.log("rematch-accept");
    console.log(data);
    if (!_games.has(data.token)) return;

    _games = _games.updateIn([data.token, 'players'], players =>
      players.map(player => player
        .set('time', data.time - data.inc + 1)
        .set('inc', data.inc)
        .update('color', color => color === 'black' ? 'white' : 'black')));

    io.to(data.token).emit('rematch-accepted');
  });

  socket.on('disconnect', () => {
    const token = findToken(socket);

    if (!token) return;

    maybeEmit('opponent-disconnected', {}, token, socket);
    clearInterval(_games.getIn([token, 'interval']));
    _games = _games.delete(token);
    games2 = games.filter(
          (item, idx) => item.token !== token
    );
    games=games2;
  });

});

function maybeEmit(event, data, token, socket) {
  if (!_games.has(token)) return;

  const opponent = getOpponent(token, socket);
  if (opponent) {
    opponent.get('socket').emit(event, data);
  }
}

function findToken(socket) {
  return _games.findKey((game, token) =>
    game.get('players').some(player => player.get('socket') === socket));
}

function runClock(color, token, socket) {
  if (!_games.has(token)) return;

  _games.getIn([token, 'players']).forEach((player, idx) => {
    if (player.get('socket') === socket && player.get('color') === color) {
      clearInterval(_games.getIn([token, 'interval']));
      
      _games = _games
        .updateIn([token, 'players', idx, 'time'], (time) =>{
          //console.log(player);
          time += player.get('inc')
          return time;
        })
        .setIn([token, 'interval'], setInterval(() => {
          let timeLeft = 0;
          _games = _games.updateIn([token, 'players', idx, 'time'], time => {
            //console.log(player);
            timeLeft = time - 1;
            return time - 1;
          });

          if (timeLeft >= 0) {
            io.to(token).emit('countdown', {
              time: timeLeft,
              color: color
            });
          } else {
            io.to(token).emit('countdown-gameover', {
              color: color
            });
            clearInterval(_games.getIn([token, 'interval']));
          }
        }, 1000));

      return false;
    }
  });
}

function getOpponent(token, socket) {
  let index = null;

  _games.getIn([token, 'players']).forEach((player, idx) => {
    if (player.get('socket') === socket) {
      index = Math.abs(idx - 1);

      return false;
    }
  });

  if (index !== null) {
    return _games.getIn([token, 'players', index]);
  }
}
