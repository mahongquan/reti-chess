var { HashRouter,BrowserRouter, Route, Link } = ReactRouterDOM;
var Router=HashRouter
class App extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log(this.props.match.params);
    return(<p>App</p>);
  }
}

class AppPlay extends React.Component{
  constructor(){
    super();
    this.state={
    };
  }
  render=()=>{
    console.log(this.props.match.params);
    return(<p>play</p>);
  }
}
console.log(window.location);
ReactDOM.render(
  <Router >
    <div>
    <p>router</p>
    <Route exact path="/" component={App}/>
    <Route path="/play" component={AppPlay}/>
    </div>
  </Router>
  ,
  document.getElementById('app')
);
// ReactDOM.render(
//   <p>app</p>
//   ,
//   document.getElementById('app')
// );