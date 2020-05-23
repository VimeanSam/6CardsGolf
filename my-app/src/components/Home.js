import React from 'react';
import '../App.css';
import {ListGroup} from "react-bootstrap";
import socket from '../socketControl/socketClient';

class Home extends React.Component{
    _isMounted = false;
    constructor(props){
      super(props);
      this.state = {      
          rooms: [],
          ranks: [],
      };
    }

    componentDidMount() {
      this._isMounted = true;
      if(this._isMounted) {
        socket.socketClient().on('listRooms', (data) => {
          this.setState({rooms: data});
        }); 
        socket.socketClient().on('rankings', (data) => {
          let limit = 0;
          if(data.length < 10){
            limit = data.length;
          }else{
            limit = 10;
          }
          this.setState({ranks: data.slice(0, limit)});
        }); 
      }  
    }

    componentWillUnmount() {
      this._isMounted = false;
    } 

    render(){
      let user = sessionStorage.getItem('user');
        return(
          <React.Fragment>
              <br></br>
              <h1 id="greetings">Home</h1> 
              {user? <p></p> : <h5 style={{textAlign: 'center'}}>Please <a href="/login">Log in</a> to access game rooms <a href="/signup">Sign Up</a> to create an account</h5>}
              <h3 style={{textAlign: 'center'}}>Dashboard</h3>
              <div style={{padding: '25px', textAlign: 'center'}}>
                <div className='row'>
                    <div className='column-3'>
                        <h5>Current Game(s)</h5>
                        <div className="rooms" style={{marginBottom: '65px'}}>
                          <ListGroup>
                            {this.state.rooms.length < 1?
                              <h6 style={{paddingTop: '150px', paddingBottom: '150px'}}>No games at the moment....</h6>
                              :
                              this.state.rooms.map((data) => 
                              (data.occupancy < 4 && data.playersDone == 0 && data.cardsLeft >= 6)?
                              <ListGroup.Item variant="success">
                                <h5>{data.name}</h5>
                                <p>{data.occupancy}/4</p>
                                <p>Host: {data.creator}</p>
                              </ListGroup.Item>
                              :
                              <ListGroup.Item variant="danger">
                                <h5>{data.name}</h5>
                                <p>{data.occupancy}/4</p>
                                <p>Host: {data.creator}</p>
                              </ListGroup.Item>       
                            )}
                          </ListGroup>
                        </div>   
                    </div>
                    <div className='column-6'>
                        <h5>Demo</h5>
                        <div className="wrapper">
                          <div className="iframe-container">
                              <iframe src="https://drive.google.com/file/d/1A5taI10p2MCfoYYW_YLgf9qAD80zTQe1/preview" frameborder="0"></iframe>
                          </div>
                        </div>
                    </div>
                    <div className='column-3 right' style={{textAlign: 'left', overflowX: 'auto'}}>
                        <h5 style={{textAlign: 'center', marginBottom: '40px'}}>Leaderboard (Top 10)</h5>
                        {this.state.ranks.length > 0? 
                            <table>
                              <tr>
                                <th>Rank</th>
                                <th>Username</th>
                                <th>Wins</th>
                              </tr>
                              {this.state.ranks.map((data, index) =>
                                <tr>
                                  <td>{index+1}</td>
                                  <td>{data.username}</td>
                                  <td>{data.wins}</td>
                                </tr>
                              )}
                            </table>
                          :
                          <h6 style={{paddingTop: '150px', paddingBottom: '150px', textAlign: 'center'}}>No records to display.</h6>
                        }
                        
                    </div>
                </div>
              </div>
             {/* 
             
             */}
          </React.Fragment>
        );  
    }
}

export default Home;