import ReactDOM from 'react-dom';
import React from 'react';
import Index from './components/Index';
import io from 'socket.io-client';
import { Router, Route, hashHistory } from 'react-router'
import GameInterface from './components/GameInterface';
var socket = io.connect("http://127.0.0.1:8000");
class App extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log("App");
    console.log(this.props);
  	return(<Index io={socket} router={this.props.router} />);
  }
}
// let params = window.location.pathname.replace('/play/', '').split('/');
// params[1] = parseInt(params[1], 10);
// params[2] = parseInt(params[2], 10);
//let params;
class AppPlay extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log(this.props.params);
  	return(<GameInterface io={socket} params={this.props.params} />);
  }
}

ReactDOM.render(
  <div>
  <p>=================================</p>
  <Router history={hashHistory}>
    <Route path="/" component={App}/>
    <Route path="/play/:token/:time/:inc" component={AppPlay}/>
  </Router>
  </div>,
  document.getElementById('root')
);