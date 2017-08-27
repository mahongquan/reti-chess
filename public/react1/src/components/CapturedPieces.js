import React from 'react';

import GameStore from '../stores/GameStore';
//import onGameChange from '../mixins/onGameChange';
//var PureRenderMixin = require('react-addons-pure-render-mixin');


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

export default CapturedPieces;
