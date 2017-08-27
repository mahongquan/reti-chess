import React from 'react';

import GameActions from '../actions/GameActions';

//var PureRenderMixin = require('react-addons-pure-render-mixin');
var PropTypes = require('prop-types');
class Clock extends React.Component{  
//const Clock = React.createClass({
  
  static propTypes= {
    io: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired
  }
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

export default Clock;
