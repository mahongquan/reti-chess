//import {EventEmitter2} from 'eventemitter2';
import {List, Map} from 'immutable';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ChatConstants from '../constants/ChatConstants';

var EventEmitter2 = require('eventemitter2').EventEmitter2;
const CHANGE_EVENT = 'change';
  
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

export default ChatStore;
