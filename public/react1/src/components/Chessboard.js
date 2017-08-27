import React from 'react';
import omit from 'lodash.omit';
import cx from 'classnames';
import {Seq, Repeat,  Set} from 'immutable';
import GameStore from '../stores/GameStore';
import GameActions from '../actions/GameActions';
import ChessPieces from '../constants/ChessPieces';
import onGameChange from '../mixins/onGameChange';
import maybeReverse from '../mixins/maybeReverse';
var PropTypes = require('prop-types');
//var PureRenderMixin = require('react-addons-pure-render-mixin');

const FILES = Seq.Indexed('abcdefgh');
const RANKS = Seq.Indexed('12345678');
class Chessboard extends React.Component{  
  static propTypes={
    io: PropTypes.object.isRequired,
    token: PropTypes.string.isRequired,
    maybePlaySound: PropTypes.func.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    gameOver: PropTypes.bool.isRequired,
    isOpponentAvailable: PropTypes.bool.isRequired
  }
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
    const {io, token} = this.props;
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
  static propTypes= {
    rank: PropTypes.oneOf(['1','2','3','4','5','6','7','8']).isRequired,
    placement: PropTypes.string.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    isMoveable: PropTypes.bool.isRequired,
    moveFrom: PropTypes.string,
    lastMove: PropTypes.object,
    setMoveFrom: PropTypes.func.isRequired,
    kingInCheck: PropTypes.oneOf([false, 'K', 'k']).isRequired,
    validMoves: PropTypes.instanceOf(Set).isRequired
  }
   _maybeReverse(iterable, color) {
    return this.props.color === (color || 'black') ?
      iterable.reverse() : iterable;
  } 

  render() {
    const {rank, placement, color} = this.props;
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
  static propTypes= {
    square: PropTypes.string.isRequired,
    piece: PropTypes.string.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    isMoveable: PropTypes.bool.isRequired,
    moveFrom: PropTypes.string,
    lastMove: PropTypes.object,
    setMoveFrom: PropTypes.func.isRequired,
    kingInCheck: PropTypes.oneOf([false, 'K', 'k']).isRequired,
    validMoves: PropTypes.instanceOf(Set).isRequired
  }

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

export default Chessboard;
