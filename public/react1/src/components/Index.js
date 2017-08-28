import React from 'react';
import { Link } from 'react-router-dom'
import { withRouter} from 'react-router-dom'
import CreateGameForm from './CreateGameForm';
var PropTypes = require('prop-types');
class Index extends React.Component{
  
   static propTypes={
     io: PropTypes.object.isRequired
   }
  constructor(){
    super();
    this.state={
      link: '',
      hasExpired: false,
      time: '30',
      inc: '0'
    };
  }
  componentDidMount() {
    const io = this.props.io;
    io.on('created', data => {
      const {time, inc} = this.state;
      // const loc = window.location;
      // const origin = loc.origin || `${loc.protocol}//${loc.hostname}` +
      //    (loc.port ? ':' + loc.port : '');

      this.setState({
        link: `/play/${data.token}/${time}/${inc}`,
        hasExpired: false
      });
    });
    io.on('ready', () => {
      //window.location = this.state.link;
      console.log("ready");
      console.log(this.state.link);
      //this.props.router.push(this.state.link)
      this.navi();
    });
    io.on('token-expired', () => this.setState({hasExpired: true}));
  }
  navi=()=>{
    console.log("navi");
    this.props.history.push(this.state.link);
  }
  render() {
    console.log("Index render");
    console.log(this.state.link);
    console.log(this.props);
    return (
      <div>
        <img src="/img/knight.png" alt="knight"
             width="122"
             height="122"
             className="knight" />
        <h1>Reti Chess</h1>

        <div id="create-game">
          <CreateGameForm
            link={this.state.link}
            time={this.state.time}
            inc={this.state.inc}
            onChangeForm={this._onChangeForm}
            createGame={this._createGame} />
          <p id="game-status">
            <Link to={this.state.link}>{this.state.hasExpired ?
              'Game link has expired, generate a new one'
            :this.state.link ?
              'Waiting for opponent to connect'
            :null}</Link>            
          </p>
          
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
      this.props.io.emit('start');
    }
  }
}

export default Index;
