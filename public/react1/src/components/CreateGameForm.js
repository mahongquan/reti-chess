import React from 'react';
//var PureRenderMixin = require('react-addons-pure-render-mixin');
var PropTypes = require('prop-types');
class CreateGameForm extends React.Component{

  static propTypes= {
    link: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    inc: PropTypes.string.isRequired,
    onChangeForm: PropTypes.func.isRequired,
    createGame: PropTypes.func.isRequired
  }
  //mixins= [PureRenderMixin]

  render() {
    const loc = window.location;
    const origin = loc.origin || `${loc.protocol}//${loc.hostname}` +
         (loc.port ? ':' + loc.port : '');
    return (
      <form onSubmit={this.props.createGame}>
        <fieldset>
          <label>
            <span>Minutes per side: </span>
            <input
              type="number"
              name="time"
              value={this.props.time}
              onChange={this.props.onChangeForm}
              min="1"
              max="50"
              required />
          </label>
          <label style={{paddingLeft: '2em'}}>
            <span>Increment in seconds: </span>
            <input
              type="number"
              name="inc"
              value={this.props.inc}
              onChange={this.props.onChangeForm}
              min="0"
              max="50"
              required />
          </label>
        </fieldset>
        <input
          id="game-link"
          type="text"
          value={this.props.link ?origin+this.props.link :'Game link will be generated here.'}
          onClick={e => e.target.select()}
          readOnly />
        <button type="submit" className="btn">Play</button>
      </form>
    );
  }
}

export default CreateGameForm;
