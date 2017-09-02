console.log("app_chess");
var socket = io();
var { HashRouter,BrowserRouter, Route, Link } = ReactRouterDOM;
var Router=HashRouter
var {Repeat,Seq,List, Map, OrderedMap, Set}=Immutable
var cx=classNames;
//GameStore///////////////////////////////////////////////////////////////////////////
var EventEmitter=EventEmitter2;
/////////////
const GameActions = {
  makeMove(from, to, capture, emitMove) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.MAKE_MOVE,
      from,
      to,
      capture,
      emitMove
    });
  },
  rematch() {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.REMATCH
    });
  },
  gameOver(options) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.GAME_OVER,
      options
    });
  },
  changePromotion(promotion) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.CHANGE_PROMOTION,
      promotion
    });
  }
};
//////////////
var GameConstants=keyMirror({
  MAKE_MOVE: null,
  REMATCH: null,
  GAME_OVER: null,
  CHANGE_PROMOTION: null
});
const ChessPieces = {
  // key: piece from FEN, value: piece from Smart Regular chess font
  // white pieces
  'K': 'F',
  'Q': 'E',
  'R': 'D',
  'B': 'C',
  'N': 'B',
  'P': 'A',
  // black pieces
  'k': 'f',
  'q': 'e',
  'r': 'd',
  'b': 'c',
  'n': 'b',
  'p': 'a',
  // empty square
  '-': undefined
};
//var Chess=require('chess.js');
//console.log(Chess);

const CHANGE_EVENT = 'change';
const MOVE_EVENT = 'new-move';
  
var _gameOver;
var _capturedPieces;
var _moves;
var _promotion;
var _turn;
var _check;
var _lastMove;
var _chess;

setInitialState();

const GameStore = Object.assign({}, EventEmitter.prototype, {
  getState() {
    return {
      gameOver: _gameOver,
      promotion: _promotion,
      turn: _turn,
      check: _check
    };
  },
  getCapturedPieces() {
    return _capturedPieces;
  },
  getMoves() {
    return _moves;
  },
  getChessboardState() {
    return {
      fen: _chess.fen(),
      lastMove: _lastMove,
      check: _check
    };
  },
  getValidMoves(square) {
    return square ? Set(
      _chess.moves({
        square: square,
        verbose: true
      }).map(move => move.to)) : Set();
  }
});

function setInitialState() {
  _gameOver = Map({
    status: false,
    type: null,
    winner: null
  });
  _capturedPieces = OrderedMap([
    ['w', List()],
    ['b', List()]
  ]);
  _moves = List();
  _promotion = 'q';
  _turn = 'w';
  _check = false;
  _lastMove = Map();
  _chess = new Chess();
}

function makeMove(from, to, capture, emitMove) {
  const move = _chess.move({
    from: from,
    to: to,
    promotion: _promotion
  });

  if (!move) {
    // move is not valid, return false and don't emit any event.
    return false;
  }

  _turn = _chess.turn();
  _check = _chess.in_check();
  _lastMove = _lastMove.set('from', from).set('to', to);
  _moves = _moves.isEmpty() || _moves.last().size === 2 ?
    _moves.push(List([move.san])) :
    _moves.update(_moves.size - 1, list => list.push(move.san));

  if (capture || move.flags === 'e') {
    const capturedPiece = capture ||
      ChessPieces[_turn === 'w' ? 'P' : 'p']; // en passant

    _capturedPieces = _capturedPieces
      .update(_turn, list => list.push(capturedPiece));
  }

  if (_chess.game_over()) {
    const type = _chess.in_checkmate() ? 'checkmate' :
      _chess.in_stalemate() ? 'stalemate' :
      _chess.in_threefold_repetition() ? 'threefoldRepetition' :
      _chess.insufficient_material() ? 'insufficientMaterial' :
      _chess.in_draw() ? 'draw' : null;

    gameOver({
      winner: _turn === 'b' ? 'White' : 'Black',
      type: type
    });
  }

  if (emitMove) {
    GameStore.emit(MOVE_EVENT, {
      from: from,
      to: to,
      capture: capture,
      gameOver: _chess.game_over()
    });
  }

  return true;
}

function gameOver(options) {
  _gameOver = _gameOver
    .set('status', true)
    .set('winner', options.winner)
    .set('type', options.type);
}

AppDispatcher.register(payload => {
  const action = payload.action;
  let emitEvent = true;

  switch (action.actionType) {
    case GameConstants.MAKE_MOVE:
      emitEvent = makeMove(
        action.from, action.to, action.capture, action.emitMove);
      break;

    case GameConstants.CHANGE_PROMOTION:
      _promotion = action.promotion;
      break;

    case GameConstants.GAME_OVER:
      gameOver(action.options);
      break;

    case GameConstants.REMATCH:
      setInitialState();
      break;

    default:
      return true;
  }

  if (emitEvent) {
    GameStore.emit(CHANGE_EVENT);
  }
  return true;
});
//import AppDispatcher from '../dispatcher/AppDispatcher';
//ChatStore///////////////////////////////////////////////////////////////////////////////////////////
var ChatConstants=keyMirror({
  TOGGLE_VISIBILITY: null,
  SUBMIT_MESSAGE: null
});
const ChatActions = {
  toggleVisibility() {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.TOGGLE_VISIBILITY
    });
  },
  submitMessage(message, className, received) {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.SUBMIT_MESSAGE,
      message,
      className,
      received
    });
  }
};
//import ChatConstants from '../constants/ChatConstants';
//const CHANGE_EVENT = 'change';
  
var _messages = List();
var _unseenCount = 0;
var _isChatHidden = true;
//console.log(EventEmitter2);
const ChatStore = Object.assign({}, EventEmitter2.prototype, {
  getState() {
    return {
      messages: _messages,
      unseenCount: _unseenCount,
      isChatHidden: _isChatHidden
    };
  }
});

function toggleVisibility() {
  _isChatHidden = !_isChatHidden;
  _unseenCount = 0;
}

function submitMessage(message, className, received) {
  _messages = _messages.push(Map({
    message: message,
    className: className
  }));

  if (received && _isChatHidden) {
    _unseenCount += 1;
  }
}

AppDispatcher.register(payload => {
  const action = payload.action;

  switch (action.actionType) {
    case ChatConstants.TOGGLE_VISIBILITY:
      toggleVisibility();
      break;

    case ChatConstants.SUBMIT_MESSAGE:
      submitMessage(action.message, action.className, action.received);
      break;

    default:
      return true;
  }

  ChatStore.emit(CHANGE_EVENT);
  return true;
});
///////////////
class Modal extends React.Component{  
  // static propTypes= {
  //   data: PropTypes.object.isRequired
  // }
  //static mixins= [PureRenderMixin]

  componentDidUpdate() {
    const isOpen = this.props.data.get('open');

    if (isOpen)
      document.addEventListener('keydown', this._onKeydown);
    else
      document.removeEventListener('keydown', this._onKeydown);
  }
  render() {
    const data = this.props.data;
    const type = data.get('type');
    const callbacks = data.get('callbacks');

    return (
      <div className={cx({
             'modal-mask': true,
             'hidden': !data.get('open')
           })}
           onClick={this._hideModal}>
        <p>
          <strong>Esc: </strong>
          <span>{type === 'info' ? 'OK' : 'Decline'}</span>
          <br />
          <strong>Enter: </strong>
          <span>{type === 'info' ? 'OK' : 'Accept'}</span>
        </p>

        <div className="modal"
             onClick={e => e.stopPropagation()}>
          <p>{data.get('message')}</p>

          {type === 'info' ? 
            <a className="btn ok"
               onClick={callbacks.hide}>
              OK
            </a> : [

            <a key="a"
               className="btn"
               style={{left: '4em'}}
               onClick={callbacks.accept}>
              Accept
            </a>,
            <a key="b"
               className="btn btn--red"
               style={{right: '4em'}}
               onClick={callbacks.decline}>
              Decline
            </a>
          ]}
        </div>
      </div>
    );
  }
  _onKeydown=(e)=>{
    const type = this.props.data.get('type');
    const callbacks = this.props.data.get('callbacks');

    if (type === 'info') {
      if (e.which === 13 || e.which === 27) {
        callbacks.hide();
      }
    } else if (type === 'offer') {
      if (e.which === 13) {
        callbacks.accept();
      } else if (e.which === 27) {
        callbacks.decline();
      }
    }
  }
  _hideModal=()=>{
    this.props.data.get('callbacks').hide();
  }
}
////////////////////////////////
const Chat = React.createClass({
  
  // propTypes: {
  //   io: React.PropTypes.object.isRequired,
  //   token: React.PropTypes.string.isRequired,
  //   color: React.PropTypes.oneOf(['white', 'black']).isRequired,
  //   soundsEnabled: React.PropTypes.bool.isRequired,
  //   isOpponentAvailable: React.PropTypes.bool.isRequired,
  //   openModal: React.PropTypes.func.isRequired
  // },
  // mixins: [PureRenderMixin],

  getInitialState() {
    const state = ChatStore.getState();
    return {
      isChatHidden: state.isChatHidden,
      messages: state.messages,
      message: '',
    };
  },
  componentDidMount() {
    this.props.io.on('receive-message', data => {
      ChatActions.submitMessage(data.message, data.color + ' left', true);
      this._maybePlaySound();
    });
    ChatStore.on('change', this._onChatStoreChange);
    
    if (window.innerWidth > 1399) ChatActions.toggleVisibility();
  },
  componentWillUnmount() {
    ChatStore.off('change', this._onChatStoreChange);
  },
  render() {
    return (
      <div id="chat-wrapper"
           className={this.state.isChatHidden ? 'hidden' : null}>
        
        <h4>Chat</h4>
        <a className="close"
           onClick={ChatActions.toggleVisibility}>
          x
        </a>
        
        <audio preload="auto" ref="msgSnd">
          <source src="./snd/message.mp3" />
        </audio>
        
        <ul id="chat-list" ref="chat">
          {this.state.messages.map((message, i) => (
            <li key={i} className={message.get('className')}>
              {message.get('message')}
            </li>
          )).toArray()}
        </ul>
        
        <span>Write your message:</span>
        
        <form id="chat-form"
              onSubmit={this._submitMessage}>
          <input type="text"
                 ref="message"
                 className={this.props.color}
                 required
                 value={this.state.message}
                 onChange={this._onChangeMessage} />
        </form>
      </div>
    );
  },
  _onChatStoreChange() {
    this.setState(ChatStore.getState(), this._scrollChat);
  },
  _onChangeMessage(e) {
    this.setState({message: e.target.value});
  },
  _submitMessage(e) {
    e.preventDefault();
    const {io, token, color, isOpponentAvailable} = this.props;
    const message = this.state.message;

    if (!isOpponentAvailable) {
      this.refs.message.getDOMNode().blur();
      this.props.openModal('info', 'Sorry, your opponent is not connected. ' +
        'You can‘t send messages.');
      return;
    }

    ChatActions.submitMessage(message, color + ' right', false);
    this.setState({message: ''});

    io.emit('send-message', {
      message: message,
      color: color,
      token: token
    });
  },
  _scrollChat() {
    const chatNode = this.refs.chat.getDOMNode();
    chatNode.scrollTop = chatNode.scrollHeight;
  },
  _maybePlaySound() {
    if (this.props.soundsEnabled) {
      this.refs.msgSnd.getDOMNode().play();
    }
  }
});
//Clock///////////////////////////////////////////////////////////////////////////////////////////////
class Clock extends React.Component{  
//const Clock = React.createClass({
  
  // static propTypes= {
  //   io: PropTypes.object.isRequired,
  //   params: PropTypes.object.isRequired
  // }
  //static mixins=[PureRenderMixin]

  constructor(){
    super();
    this.state={
      white: 0,
      black: 0,
      inc: 0,
      countdown: null
    }
  }
  componentDidMount=()=>{
    const {time, inc} = this.props.params;
    
    this.state={
      white: time * 60,
      black: time * 60,
      inc: inc,
      countdown: null
    };
    const io = this.props.io;

    io.on('countdown', (data) =>{ 
      console.log('countdown');
      console.log(data);
      this.setState({
        [data.color]: data.time,
        countdown: data.color
      });
    });

    io.on('countdown-gameover', data => {
      this.setState({countdown: null});
      GameActions.gameOver({
        type: 'timeout',
        winner: data.color === 'black' ? 'White' : 'Black'
      });
    });

    io.on('rematch-accepted', () => {
      this.setState({
        white: this.props.params.time * 60,
        black: this.props.params.time * 60
      });
    });
  }
  render() {
    console.log("Clock render");
    console.log(this.props);
    return (
      <ul id="clock">
        <Timer
          color="white"
          time={this.state.white}
          countdown={this.state.countdown} />
        <Timer
          color="black"
          time={this.state.black}
          countdown={this.state.countdown} />
      </ul>
    );
  }
}
class Timer extends React.Component{

  //static mixins= [PureRenderMixin]

  render() {
    const {time, color, countdown} = this.props;
    const min = Math.floor(time / 60);
    const sec = time % 60;
    const timeLeft = `${min}:${sec < 10 ? '0' + sec : sec}`;

    return (
      <li className={color + (color === countdown ? ' ticking' : '')}>
        {timeLeft}
      </li>
    );
  }
}
/////////////////////////////////
class ChessboardInterface extends React.Component{
//const ChessboardInterface = React.createClass({
  
  // static propTypes= {
  //   io: PropTypes.object.isRequired,
  //   token: PropTypes.string.isRequired,
  //   soundsEnabled: PropTypes.bool.isRequired,
  //   color: PropTypes.oneOf(['white', 'black']).isRequired,
  //   gameOver: PropTypes.object.isRequired,
  //   isOpponentAvailable: PropTypes.bool.isRequired
  // }
  //static mixins= [PureRenderMixin, onGameChange]
  componentDidMount() {
    GameStore.on('change', this._onGameChange);
  }
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  }
  constructor(){
    super();
    this.state=GameStore.getState();
  }
  componentDidUpdate(prevProps) {
    if (this.props.gameOver.get('status') &&
        !prevProps.gameOver.get('status')) {
      this.props.openModal('info', this._getGameOverMessage());
    }
  }
  render() {
    const {promotion, turn, gameOver, check} = this.state;

    return (
      <div id="board-moves-wrapper" className="clearfix">
        
        <audio preload="auto" ref="moveSnd">
          <source src="./snd/move.mp3" />
        </audio>
        <audio preload="auto" ref="checkSnd">
          <source src="./snd/check.mp3" />
        </audio>

        <div id="board-wrapper">
          <CapturedPieces />
          <Chessboard
            {...omit(this.props, 'soundsEnabled', 'gameOver')}
            gameOver={gameOver.get('status')}
            maybePlaySound={this._maybePlaySound} />
        </div>

        <TableOfMoves />

        <span className="promotion">
          <label>
            <span>Promotion: </span>
            <select value={promotion}
                    onChange={this._onPromotionChange}>
              <option value="q">Queen</option>
              <option value="r">Rook</option>
              <option value="b">Bishop</option>
              <option value="n">Knight</option>
            </select>
          </label>
        </span>

        <span className="feedback">
          {!gameOver.get('status') ? 
            <span>
              <span className="icon">
                {/* F -> white king, f -> black king*/
                  turn === 'w' ? 'F' : 'f'}
              </span>
              {`${turn === 'w' ? 'White' : 'Black'} to move.`}
              {check ? <strong> Check.</strong> : null}
            </span> :

            <strong>
              <span className="icon">
                {gameOver.get('winner') === 'White' ? 'F' : 'f'}
              </span>
              {this._getGameOverMessage()}
            </strong>
          }
        </span>
      </div>
    );
  }
  _onGameChange=()=>{
    this.setState(GameStore.getState());
  }
  _onPromotionChange=(e)=>{
    GameActions.changePromotion(e.target.value);
  }
  _maybePlaySound=()=>{
    if (this.props.soundsEnabled) {
      this.refs[this.state.check ? 'checkSnd' : 'moveSnd'].getDOMNode().play();
    }
  }
  _getGameOverMessage=()=>{
    const type = this.props.gameOver.get('type');
    const winner = this.props.gameOver.get('winner');
    const loser = winner === 'White' ? 'Black' : 'White';

    return type === 'checkmate' ? `Checkmate. ${winner} wins!` :
      type === 'timeout' ? `${loser}‘s time is out. ${winner} wins!` :
      type === 'resign' ? `${loser} has resigned. ${winner} wins!` :
      type === 'draw' ? 'Draw.' :
      type === 'stalemate' ? 'Draw (Stalemate).' :
      type === 'threefoldRepetition' ? 'Draw (Threefold Repetition).' :
      type === 'insufficientMaterial' ? 'Draw (Insufficient Material)' : '';
  }
}
////////////////
class CapturedPieces extends React.Component{  
  //static mixins=[PureRenderMixin, onGameChange]

  constructor(){
    super();
    this.state={
      capturedPieces: GameStore.getCapturedPieces()
    };
  }
  componentDidMount() {
    GameStore.on('change', this._onGameChange);
  }
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  }
  render() {
    const cp = this.state.capturedPieces;

    return (
      <div id="captured-pieces">
        {cp.map((pieces, color) => (
          <ul key={color}>
            {pieces.map((piece, i) => <li key={i}>{piece}</li>).toArray()}
          </ul>
        )).toArray()}
      </div>
    );
  }
  _onGameChange=()=>{
    this.setState({
      capturedPieces: GameStore.getCapturedPieces()
    });
  }
}
/////////////
class TableOfMoves extends React.Component{
  
  //static mixins=[PureRenderMixin, onGameChange]

  constructor(){
    super();
    this.state={
      moves: GameStore.getMoves()
    };
  }
  componentDidMount() {
    GameStore.on('change', this._onGameChange);
  }
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  }
  render() {
    return (
      <table id="moves" className="clearfix">
        <thead>
          <tr>
            <th>Table of moves</th>
          </tr>
        </thead>
        <tbody>
          {this.state.moves.map((row, i) => (
            <tr key={i}>
              <td>
                <strong>{`${i + 1}.`}</strong>
              </td>
              {row.map((move, j) => (
                <td key={j}>
                  <span>{move}</span>
                </td>
              )).toArray()}
            </tr>
          )).toArray()}
        </tbody>
      </table>
    );
  }
  _onGameChange=()=>{
    this.setState({
      moves: GameStore.getMoves()
    });
  }
}

/////////////
const FILES = Seq.Indexed('abcdefgh');
const RANKS = Seq.Indexed('12345678');
class Chessboard extends React.Component{  
  // static propTypes={
  //   io: PropTypes.object.isRequired,
  //   token: PropTypes.string.isRequired,
  //   maybePlaySound: PropTypes.func.isRequired,
  //   color: PropTypes.oneOf(['white', 'black']).isRequired,
  //   gameOver: PropTypes.bool.isRequired,
  //   isOpponentAvailable: PropTypes.bool.isRequired
  // }
  //static mixins=[PureRenderMixin, maybeReverse]

  constructor(){
    super();
    const state = GameStore.getChessboardState();

    this.state={
      fen: state.fen,
      moveFrom: null,
      lastMove: state.lastMove,
      kingInCheck: false
    };
  }
  componentDidMount() {
    const {io} = this.props;
    GameStore.on('change', this._onGameChange);
    GameStore.on('new-move', this._onNewMove);

    io.on('move', data => {
      GameActions.makeMove(data.from, data.to, data.capture, false);
      this.props.maybePlaySound();

      if (!data.gameOver) {
        this._runClock();
      }

      if (document.hidden) {
        let title = document.getElementsByTagName('title')[0];
        title.text = '* ' + title.text;

        window.addEventListener('focus', this._removeAsteriskFromTitle);
      }
    });

    io.on('rematch-accepted', () => this.setState({moveFrom: null}));
  }
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
    GameStore.on('new-move', this._onNewMove);
  }
  _maybeReverse(iterable, color) {
    return this.props.color === (color || 'black') ?
      iterable.reverse() : iterable;
  }  
  render=()=>{
    const {color, isOpponentAvailable, gameOver} = this.props;
    const {fen, moveFrom, lastMove, kingInCheck} = this.state;
    const fenArray = fen.split(' ');
    const placement = fenArray[0];
    const isItMyTurn = fenArray[1] === color.charAt(0);
    const rows = this._maybeReverse(placement.split('/'));
    const ranks = this._maybeReverse(RANKS, 'white');

    return (
      <table className="chessboard">
      <tbody>
        {rows.map((placement, i) =>
          <Row
            key={i}
            rank={ranks.get(i)}
            placement={placement}
            color={color}
            isMoveable={isItMyTurn && isOpponentAvailable && !gameOver}
            moveFrom={moveFrom}
            lastMove={lastMove}
            setMoveFrom={this._setMoveFrom}
            kingInCheck={kingInCheck}
            validMoves={GameStore.getValidMoves(moveFrom)} />)}
      </tbody>
      </table>
    );
  }
  _onGameChange=(cb)=>{
    const state = GameStore.getChessboardState();
    this.setState({
      fen: state.fen,
      lastMove: state.lastMove,
      kingInCheck: state.check && (state.fen.split(' ')[1] === 'w' ? 'K' : 'k')
    }, cb);
  }
  _setMoveFrom=(square)=>{
    this.setState({
      moveFrom: square
    });
  }
  _onNewMove=(move)=>{
    const {io, token} = this.props;

    io.emit('new-move', {
      token: token,
      move: move
    });

    setTimeout(this.props.maybePlaySound, 0);
  }
  _runClock=()=>{
    const {io, token, color} = this.props;

    io.emit('clock-run', {
      token: token,
      color: color
    });
  }
  _removeAsteriskFromTitle=()=>{
    let title = document.getElementsByTagName('title')[0];
    title.text = title.text.replace('* ', '');
    window.removeEventListener('focus', this._removeAsteriskFromTitle);
  }
}
//const Row = React.createClass({
class Row extends React.Component{ 
  // static propTypes= {
  //   rank: PropTypes.oneOf(['1','2','3','4','5','6','7','8']).isRequired,
  //   placement: PropTypes.string.isRequired,
  //   color: PropTypes.oneOf(['white', 'black']).isRequired,
  //   isMoveable: PropTypes.bool.isRequired,
  //   moveFrom: PropTypes.string,
  //   lastMove: PropTypes.object,
  //   setMoveFrom: PropTypes.func.isRequired,
  //   kingInCheck: PropTypes.oneOf([false, 'K', 'k']).isRequired,
  //   validMoves: PropTypes.instanceOf(Set).isRequired
  // }
   _maybeReverse(iterable, color) {
    return this.props.color === (color || 'black') ?
      iterable.reverse() : iterable;
  } 

  render() {
    const {rank, placement} = this.props;
    const files = this._maybeReverse(FILES);
    const pieces = this._maybeReverse(placement.length < 8 ?
      Seq(placement).flatMap(piece => (
        /^\d$/.test(piece) ? Repeat('-', parseInt(piece, 10)) : piece
      )).toArray() :

      placement.split('')
    );

    return (
      <tr>
        {pieces.map((piece, i) =>
          <Column
            key={i}
            square={files.get(i) + rank}
            piece={piece}
            {...omit(this.props, 'rank', 'placement')} />)}
      </tr>
    );
  }
}

//const Column = React.createClass({
class Column extends React.Component{ 
  // static propTypes= {
  //   square: PropTypes.string.isRequired,
  //   piece: PropTypes.string.isRequired,
  //   color: PropTypes.oneOf(['white', 'black']).isRequired,
  //   isMoveable: PropTypes.bool.isRequired,
  //   moveFrom: PropTypes.string,
  //   lastMove: PropTypes.object,
  //   setMoveFrom: PropTypes.func.isRequired,
  //   kingInCheck: PropTypes.oneOf([false, 'K', 'k']).isRequired,
  //   validMoves: PropTypes.instanceOf(Set).isRequired
  // }

  render() {
    const {moveFrom, lastMove, square, color,
           isMoveable, kingInCheck, validMoves} = this.props;
    const piece = ChessPieces[this.props.piece];
    const rgx = color === 'white' ? /^[KQRBNP]$/ : /^[kqrbnp]$/;
    const isDraggable = rgx.test(this.props.piece);
    const isDroppable = moveFrom && validMoves.has(square);

    return (
      <td className={cx({
            selected: moveFrom === square && !validMoves.isEmpty(),
            from: lastMove.get('from') === square,
            to: lastMove.get('to') === square,
            droppable: isDroppable
          })}
          onClick={!piece ? this._onClickSquare : null}
          onDragOver={isDroppable ? this._onDragOver : null}
          onDrop={isDroppable ? this._onDrop : null}>

        {piece ?
          <a className={kingInCheck === this.props.piece ? 'in-check' : null}
             onClick={this._onClickSquare}
             onDragStart={this._onDragStart}
             draggable={isDraggable && isMoveable}>
            {piece}
          </a>
        :null}
      </td>
    );
  }
  _onClickSquare=()=>{
    const {isMoveable, color, moveFrom, square, piece} = this.props;
    const rgx = color === 'white' ? /^[KQRBNP]$/ : /^[kqrbnp]$/;

    if (!isMoveable || (!moveFrom && !rgx.test(piece)))
      return;
    else if (moveFrom && moveFrom === square)
      this.props.setMoveFrom(null);
    else if (rgx.test(piece))
      this.props.setMoveFrom(square);
    else
      GameActions.makeMove(moveFrom, square, ChessPieces[piece], true);
  }
  _onDragStart=(e)=> {
    e.dataTransfer.effectAllowed = 'move';
    // setData is required by firefox
    e.dataTransfer.setData('text/plain', '');

    this.props.setMoveFrom(this.props.square);
  }
  _onDragOver=(e)=> {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  _onDrop=(e)=>{
    e.preventDefault();
    const {moveFrom, square, piece} = this.props;
    GameActions.makeMove(moveFrom, square, ChessPieces[piece], true);
  }
}
////////////////////////////////
class GameHeader extends React.Component{ 
 // static propTypes= {
 //    io: PropTypes.object.isRequired,
 //    params: PropTypes.object.isRequired,
 //    color: PropTypes.oneOf(['white', 'black']).isRequired,
 //    openModal: PropTypes.func.isRequired,
 //    gameOver: PropTypes.bool.isRequired,
 //    isOpponentAvailable: PropTypes.bool.isRequired
 //  }   
  constructor(){
    super();
    this.state=omit(ChatStore.getState(), 'messages');//todo
  }
  componentDidMount() {
    ChatStore.on('change', this._onChatChange);
  }
  componentWillUnmount() {
    ChatStore.off('change', this._onChatChange);
  }
  render() {
    console.log("GameHeader render");
    console.log(this.props);
    const {io, params, gameOver, isOpponentAvailable} = this.props;
    const unseenCount = this.state.unseenCount;

    return (
      <header className="clearfix">

        <Clock
          io={io}
          params={params} />

        <span id="game-type">
          {`${params.time}|${params.inc}`}
        </span>

        <a className="btn" href="/">New game</a>

        {!gameOver && isOpponentAvailable ?
          <a className="btn btn--red resign"
              onClick={this._onResign}>
            Resign
          </a>
        :gameOver ?
          <a className="btn btn--red rematch"
             onClick={this._onRematch}>
            Rematch
          </a>
        :null}

        <a id="chat-icon"
           onClick={ChatActions.toggleVisibility}>
          {unseenCount ?
            <span id="chat-counter">
              {unseenCount < 9 ? unseenCount : '9+'}
            </span>
          :null}
          <img src="./img/chat.svg" alt="img"
               width="50"
               height="50" />
          Chat
        </a>
      </header>
    );
  }
  _onChatChange=()=>{
    this.setState(omit(ChatStore.getState(), 'messages'));
  }
  _onResign=()=>{
    const {io, params, color} = this.props;

    io.emit('resign', {
      token: params.token,
      color: color
    });
  }
  _onRematch=()=>{
    const {io, params, openModal, isOpponentAvailable} = this.props;

    if (!isOpponentAvailable) {
      openModal('info', 'Your opponent has disconnected. You need to ' +
        'generate a new link.');
      return;
    }

    io.emit('rematch-offer', {
      token: params.token
    });
    openModal('info', 'Your offer has been sent.');
  }
}

class GameInterface extends React.Component{    
//const GameInterface = React.createClass({
  
  // static propTypes= {
  //   io: PropTypes.object.isRequired,
  //   params: PropTypes.object.isRequired
  // }

 constructor(){
    super();
    this.state={
      isOpponentAvailable: false,
      color: 'white',
      modal: Map({
        open: false,
        message: '',
        type: 'info',
        callbacks: {
          hide: this._hideModal,
          accept: this._acceptRematch,
          decline: this._declineRematch
        }
      }),
      soundsEnabled: false,
      gameOver: GameStore.getState().gameOver
    };
  }
  componentDidMount() {
    console.log("GameInterface");
    console.log(this.props);
    const {io, params} = this.props;

    io.on('token-invalid', () => this.setState({
      modal: this.state.modal
        .set('open', true)
        .set('message', 'Game link is invalid or has expired.')
        .set('type', 'info')
    }));

    io.emit('join', {
      token: params.token,
      time: params.time * 60,
      inc: parseInt(params.inc,10)
    });

    io.on('joined', data => {
      if (data.color === 'black') {
        this.setState({color: 'black'});
      }
    });

    io.on('both-joined', () =>
      this.setState({isOpponentAvailable: true}, () => {
        if (this.state.color === 'white') {
          io.emit('clock-run', {
            token: params.token,
            color: 'white'
          });
        }
      }));

    io.on('full', () => {
      window.alert(
        'This game already has two players. You have to create a new one.');
      window.location = '/';
    });

    io.on('player-resigned', data => {
      GameActions.gameOver({
        type: 'resign',
        winner: data.color === 'black' ? 'White' : 'Black'
      });
    });

    io.on('rematch-offered', () =>
      this._openModal('offer', 'Your opponent has sent you a rematch offer.'));

    io.on('rematch-declined', () =>
      this._openModal('info', 'Rematch offer has been declined.'));

    io.on('rematch-accepted', () => {
      GameActions.rematch();
      this.setState({
        color: this.state.color === 'white' ? 'black' : 'white',
        modal: this.state.modal.set('open', false)
      }, () => {
        if (this.state.color === 'white') {
          io.emit('clock-run', {
            token: this.props.params.token,
            color: 'white'
          });
        }
      });
    });

    io.on('opponent-disconnected', () =>  {
      if (!this.state.gameOver.get('status')) {
        this._openModal('info', 'Your opponent has disconnected.');
      }

      this.setState({isOpponentAvailable: false});
    });

     GameStore.on('change', this._onGameChange);
  }
  componentWillUnmount() {
     GameStore.off('change', this._onGameChange);
  }
  render() {
    console.log("GameInterface render");
    console.log(this.props);
    const {io, params} = this.props;
    const {color, soundsEnabled, gameOver, isOpponentAvailable} = this.state;
    const commonProps = {
      io: io,
      color: color,
      openModal: this._openModal,
      isOpponentAvailable: isOpponentAvailable
    };

    return (
      <div>
        <GameHeader
          {...commonProps}
          params={params}
          gameOver={gameOver.get('status')} />

        <label id="sounds-label">
          <input type="checkbox"
                 checked={soundsEnabled}
                 onChange={this._toggleSounds} />
          <span> Enable sounds</span>
        </label>

        <Chat
          {...commonProps}
          token={params.token}
          soundsEnabled={soundsEnabled} />

        <ChessboardInterface
          {...commonProps}
          token={params.token}
          soundsEnabled={soundsEnabled}
          gameOver={gameOver} />

        <Modal data={this.state.modal} />

      </div>
    );
  }
  _onGameChange=()=> {
    this.setState({gameOver: GameStore.getState().gameOver});
  }
  _openModal=(type, message)=>{
    this.setState({
      modal: this.state.modal
        .set('open', true)
        .set('message', message)
        .set('type', type)
    });
  }
  _hideModal=()=>{
    this.setState({modal: this.state.modal.set('open', false)});
  }
  _acceptRematch=()=>{
    const {io, params} = this.props;

    io.emit('rematch-accept', {
      token: params.token,
      time: params.time * 60,
      inc: params.inc
    });
    this._hideModal();
  }
  _declineRematch=()=>{
    const {io, params} = this.props;

    io.emit('rematch-decline', {
      token: params.token
    });
    this._hideModal();
  }
  _toggleSounds=(e)=>{
    this.setState({
      soundsEnabled: !this.state.soundsEnabled
    });
  }
}
class CreateGameForm extends React.Component{

  // static propTypes= {
  //   link: PropTypes.string.isRequired,
  //   time: PropTypes.string.isRequired,
  //   inc: PropTypes.string.isRequired,
  //   onChangeForm: PropTypes.func.isRequired,
  //   createGame: PropTypes.func.isRequired
  // }
  //mixins= [PureRenderMixin]

  render() {
    return (
      <form onSubmit={this.props.createGame}>
        <fieldset>
          <label>
            <span>Minutes per side: </span>
            <input
              type="number"
              name="time"
              value={this.props.time}
              onChange={this.props.onChangeForm}
              min="1"
              max="50"
              required />
          </label>
          <label style={{paddingLeft: '2em'}}>
            <span>Increment in seconds: </span>
            <input
              type="number"
              name="inc"
              value={this.props.inc}
              onChange={this.props.onChangeForm}
              min="0"
              max="50"
              required />
          </label>
        </fieldset>
        <button type="submit" className="btn">New</button>
      </form>
    );
  }
}
class Index extends React.Component{
  
   // static propTypes={
   //   io: PropTypes.object.isRequired
   // }
  constructor(){
    super();
    this.state={
      link: '',
      hasExpired: false,
      time: '30',
      inc: '0',
      games:[]
    };
  }
  componentDidMount() {
    const io = this.props.io;
    io.on('init', data => {
      console.log(data);
      this.setState({
        games:data.games
      });
    });
    io.on('created', data => {
      const {time, inc} = data;
      this.state.games.push({token:data.token,time:data.time,inc:data.inc,hasExpired:false});
      var href="/play/"+data.token+"/"+data.time+"/"+data.inc;
      this.navi(href);
    });
    // io.on('ready', () => {
    //   //window.location = this.state.link;
    //   console.log("ready");
    //   console.log(this.state.link);
    //   //this.props.router.push(this.state.link)
    //   //this.navi();
    // });
    io.on('token-expired', () => this.setState({hasExpired: true}));
  }
  navi=(url)=>{
    console.log("navi");
    this.props.history.push(url);
  }
  render() {
    console.log("Index render");
    console.log(this.state.link);
    console.log(this.props);
    console.log(this.state.games);
    var rows=this.state.games.map((game, i) => {
          var href="/play/"+game.token+"/"+game.time+"/"+game.inc;//(<a href="#">play</a>);
          var link=(<Link to={href}>play</Link>);
          console.log(link);
          return (
              <tr key={i}>
                  <td>{game.token}</td>
                  <td>{game.time}</td>
                  <td>{game.inc}</td>
                  <td>{link}</td>
              </tr>
          );
    })
    return (
      <div>
      {
        // <img src="/img/knight.png" alt="knight"
        //      width="122"
        //      height="122"
        //      className="knight" />
        // <h1>Reti Chess</h1>
      }
      <table>
      <thead>
      <tr><td>token</td>
        <td>time</td>
        <td>inc</td>
        <td>hasExpired</td>
      </tr>
      </thead>
      <tbody>
      {
        rows
      }
      </tbody></table>
        <div id="create-game">
            <CreateGameForm
            link={this.state.link}
            time={this.state.time}
            inc={this.state.inc}
            onChangeForm={this._onChangeForm}
            createGame={this._createGame} />
          
        </div>
        <p>
          Click the button to create a game. Send the link to your friend.
          Once the link is opened your friend‘s browser, game should begin 
          shortly. Colors are picked randomly by computer.
        </p>
        <p>
          <a href="/about" className="alpha">Read more about Reti Chess</a>
        </p>
      </div>
    );
  }

  _onChangeForm=(e)=> {
    console.log(e);
    this.setState({[e.target.name]: e.target.value});
  }
  _createGame=(e)=>{
    e.preventDefault();

    const {time, inc} = this.state;
    const isInvalid = [time, inc].some(val => {
      val = parseInt(val, 10);
      return isNaN(val) || val < 0 || val > 50;
    });

    if (isInvalid) {
      // fallback for old browsers
      return window.alert('Form is invalid. Enter numbers between 0 and 50.');
    } else {
      this.props.io.emit('start',{time:parseInt(this.state.time,10),inc:parseInt(this.state.inc,10)});
    }
  }
}

class App extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log("App");
    console.log(this.props);
    return(<Index io={socket} history={this.props.history} />);
    //return(<Clock params={{time:30,inc:0}} io={socket} router={this.props.router} />);
    //return(<GameHeader params={{time:30,inc:0}} io={socket} router={this.props.router} />);
    //return(<GameInterface io={socket} params={{token:"ABCDEF",time:30,inc:0}} />);
  }
}
class AppPlay extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log(this.props.match.params);
    return(<GameInterface io={socket} params={this.props.match.params} />);
  }
}
console.log("render");
ReactDOM.render(
  <Router >
    <div>
    <Route exact path="/" component={App}/>
    <Route path="/play/:token/:time/:inc" component={AppPlay}/>
    </div>
  </Router>
  ,
  document.getElementById('app')
);