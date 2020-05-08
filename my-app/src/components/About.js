import React from 'react';
import '../App.css';

class About extends React.Component{
    render(){
        return(
          <React.Fragment>
              <br></br>
              <h1 id="greetings">About</h1> 
              <div style={{marginLeft: '60px', marginRight: '60px'}}>
                <h5 > This is a web clone of 6 cards Golf. 
                  Node.js, Express, MongoDB, CSS, and React.js are the frameworks used to programmed this project. 
                  JavaScript libraries such as Bcrypt for passwords, axios for transfering client-server data, and socket.io for 
                  real-time player actions. Supported browsers include Google Chrome, Safari, Edge, and Firefox. 
                </h5>
                <h5 style={{color: 'red'}}>***720p monitor users must zoom out a bit if players divs get too close to one another. This website is not compatible with mobile</h5>
              </div>             
          </React.Fragment>
        );  
      }
}

export default About;