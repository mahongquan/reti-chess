import React from 'react';
import {Map} from 'immutable';

import GameHeader from './GameHeader';
import Chat from './Chat';
import Modal from './Modal';
import GameActions from '../actions/GameActions';
import GameStore from '../stores/GameStore';
import ChessboardInterface from './ChessboardInterface';
var PropTypes = require('prop-types');
class GameInterface extends React.Component{    
//const GameInterface = React.createClass({
  
  static propTypes= {
    io: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired
  }

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

export default GameInterface;
