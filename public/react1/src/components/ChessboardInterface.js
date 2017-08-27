import React from 'react';
import omit from 'lodash.omit';

import GameStore from '../stores/GameStore';
import GameActions from '../actions/GameActions';
import onGameChange from '../mixins/onGameChange';
import Chessboard from './Chessboard';
import CapturedPieces from './CapturedPieces';
import TableOfMoves from './TableOfMoves';
var PureRenderMixin = require('react-addons-pure-render-mixin');
var PropTypes = require('prop-types');
class ChessboardInterface extends React.Component{
//const ChessboardInterface = React.createClass({
  
  static propTypes= {
    io: PropTypes.object.isRequired,
    token: PropTypes.string.isRequired,
    soundsEnabled: PropTypes.bool.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    gameOver: PropTypes.object.isRequired,
    isOpponentAvailable: PropTypes.bool.isRequired
  }
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
          <source src="/snd/move.mp3" />
        </audio>
        <audio preload="auto" ref="checkSnd">
          <source src="/snd/check.mp3" />
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

export default ChessboardInterface;
