import ReactDOM from 'react-dom';
import React from 'react';
import Index from './components/Index';
import io from 'socket.io-client';
import { BrowserRouter, Route } from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import GameInterface from './components/GameInterface';
const history = createHistory({basename: '/'});
const unlisten = history.listen((location, action) => {
  // location is an object like window.location
  console.log("history==========================");
  console.log(action, location.pathname, location.state)
})

var socket = io.connect("http://127.0.0.1:3000");
class App extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log("App");
    console.log(this.props);
  	return(<Index io={socket} history={this.props.history} />);
  }
}

class AppPlay extends React.Component{
  constructor(){
    super();
  }
  render=()=>{
    console.log(this.props);
  	return(<GameInterface io={socket} params={this.props.match.params} />);
  }
}

ReactDOM.render(
  <BrowserRouter >
  <div>
    <Route history={history} exact path="/" component={App}/>
    <Route history={history} path="/play/:token/:time/:inc" component={AppPlay}/>
  </div>
  </BrowserRouter>
  ,
  document.getElementById('root')
);