import React from 'react';

import GameStore from '../stores/GameStore';
//import onGameChange from '../mixins/onGameChange';
//var PureRenderMixin = require('react-addons-pure-render-mixin');
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

export default TableOfMoves;
