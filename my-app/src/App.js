import React from 'react';
import './App.css';
import Nav from './components/nav';

class App extends React.Component{
    render(){
      return(
        <React.Fragment>
          <Nav></Nav>
        </React.Fragment>    
      );
    }
}

export default App;
