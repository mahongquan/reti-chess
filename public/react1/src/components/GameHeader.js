import React from 'react';
import omit from 'lodash.omit';

import Clock from './Clock';
import ChatStore from '../stores/ChatStore';
import ChatActions from '../actions/ChatActions';
//var PureRenderMixin = require('react-addons-pure-render-mixin');
var PropTypes = require('prop-types');
//const GameHeader = React.createClass({
class GameHeader extends React.Component{    
  static propTypes= {
    io: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    openModal: PropTypes.func.isRequired,
    gameOver: PropTypes.bool.isRequired,
    isOpponentAvailable: PropTypes.bool.isRequired
  }
  //static mixins= [PureRenderMixin]

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
          <img src="/img/chat.svg" alt="img"
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

export default GameHeader;
