import React from 'react';

import ChatStore from '../stores/ChatStore';
import ChatActions from '../actions/ChatActions';
//var PureRenderMixin = require('react-addons-pure-render-mixin');
var PropTypes = require('prop-types');
class Chat extends React.Component{
  
  static propTypes= {
    io: PropTypes.object.isRequired,
    token: PropTypes.string.isRequired,
    color: PropTypes.oneOf(['white', 'black']).isRequired,
    soundsEnabled: PropTypes.bool.isRequired,
    isOpponentAvailable: PropTypes.bool.isRequired,
    openModal: PropTypes.func.isRequired
  }
  //static mixins=[PureRenderMixin]

  constructor(){
    super();
    const state = ChatStore.getState();
    this.state={
      isChatHidden: state.isChatHidden,
      messages: state.messages,
      message: '',
    };
  }
  componentDidMount() {
    this.props.io.on('receive-message', data => {
      ChatActions.submitMessage(data.message, data.color + ' left', true);
      this._maybePlaySound();
    });
    ChatStore.on('change', this._onChatStoreChange);
    
    if (window.innerWidth > 1399) ChatActions.toggleVisibility();
  }
  componentWillUnmount() {
    ChatStore.off('change', this._onChatStoreChange);
  }
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
          <source src="/snd/message.mp3" />
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
  }
  _onChatStoreChange=()=>{
    this.setState(ChatStore.getState(), this._scrollChat);
  }
  _onChangeMessage=(e)=>{
    this.setState({message: e.target.value});
  }
  _submitMessage=(e)=>{
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
  }
  _scrollChat=()=>{
    const chatNode = this.refs.chat.getDOMNode();
    chatNode.scrollTop = chatNode.scrollHeight;
  }
  _maybePlaySound=()=> {
    if (this.props.soundsEnabled) {
      this.refs.msgSnd.getDOMNode().play();
    }
  }
}

export default Chat;
