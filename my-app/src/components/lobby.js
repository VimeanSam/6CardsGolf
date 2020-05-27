import React from 'react';
import '../App.css';
import { Button, FormGroup, ListGroup} from "react-bootstrap";
import {Redirect} from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
let url = 'http://localhost:3002/lobby';
if(process.env.NODE_ENV === 'production'){
  url = 'https://sixcardsgolf.herokuapp.com/lobby';
}
const socket = io.connect(url);
//import socket from '../socketControl/socketClient';

class Lobby extends React.Component{
    _isMounted = false;
    constructor(props){
      super(props);
      this.state = {
          roomname: '',
          rooms: [],
          cardTheme: 'cards',
          userJoined: false,
          loading: false,
      };
      this.handleSubmit = this.handleSubmit.bind(this);
      this.join = this.join.bind(this);
    }

    componentDidMount() {
      this._isMounted = true;
      if(this._isMounted) {
        this.getRooms();
        //console.log(socket)
        socket.on('listRooms', () =>{
            this.getRooms();
        });
      }  
    }

    componentWillUnmount() {
      this._isMounted = false;
    } 

    handleSubmit = (e) =>{
      this.setState({loading: true});
      let id = Date.now().toString()+Math.random().toString(36).substr(2, 9);
      axios.post('/createRoom' , {
        roomid: id, name: this.state.roomname, creator: sessionStorage.getItem('user'), cardTheme: this.state.cardTheme
      })
      .then((response) =>{
          console.log('success')
          sessionStorage.setItem('roomID', id);
          setTimeout(() => this.setState({userJoined: true}), 1000);
      })
      .catch((err) =>{
        console.log(err);
        alert('error creating room');
        window.location.href = '/lobby'
      })
      e.preventDefault();
    }

    join = async (e) =>{
      this.setState({loading: true});
      let rid = e.target.id
      try {
        const response = await axios.post('/joinRoom' , {
          roomid: rid, username: sessionStorage.getItem('user')
        });
        if(response.status === 200){
          console.log('join success');
          sessionStorage.setItem('roomID', rid);
          setTimeout(() => this.setState({userJoined: true}), 1000);
        }
      } catch(error) {
        console.log(error);
        alert('error joining room');
        window.location.href = '/lobby'
      }
    }

    getRooms(){
      axios.get('/getAllRooms')
        .then((response = response.json()) => {
           //console.log(response.data);
            
            this.setState({rooms: response.data.reverse()})
      })
        .catch(function (error) {
            console.log(error);
      });
    }

    render(){      
        if(this.state.userJoined){
          return(
            <React.Fragment>
                <Redirect to= '/game'/>
            </React.Fragment>
          );
        }
        if(this.state.loading){
          return(
            <React.Fragment>
                <br></br>
                <h1 id="greetings">Redirecting to Game Room....<div className="loader"></div></h1> 
            </React.Fragment>
          );
        }else{
          return(
            <React.Fragment>
                <br></br>
                <h1 id="greetings">Welcome, {sessionStorage.getItem('user')}</h1> 
                <div className="Login">
                    <form onSubmit={this.handleSubmit}>
                        <FormGroup controlId="username" bssize="large">
                            <label>Room Name: </label>
                            <input type="text" placeholder="Enter Room name" name="username" onChange={(e)=> this.setState({roomname: e.target.value})} required/>
                            <br></br>
                            <label>Card Theme: </label>
                            <select onChange={(e)=>{this.setState({cardTheme: e.target.value})}}>
                              <option value="cards">Standard Double Deck: White+Red</option>
                              <option value="3D">Double Deck 3D: Plastic</option>
                              <option value="DK">Double Deck Dark Set: Black+Red</option>
                              <option value="DG">Double Deck Dark Set: Black+Gold</option>
                              <option value="GLD">Trump Set: Plated Gold</option>
                            </select>
                        </FormGroup>
                        <Button block bssize="large" variant="success" type="submit">Create</Button>
                    </form>
                </div>
                <br></br>
                <div className="rooms"> 
                  <ListGroup>
                    {this.state.rooms.length < 1? 
                        <h6 style={{paddingTop: '150px', paddingBottom: '150px', textAlign: 'center'}}>No games at the moment...</h6>
                        :
                        this.state.rooms.map((data) => 
                          (data.occupancy < 4 && data.playersDone == 0 && data.cardsLeft >= 6)?
                          <ListGroup.Item variant="success">
                            {data.name}
                            <p style={{textAlign: "right"}}>{data.occupancy}/4</p>
                            <button id={data.roomid} onClick={this.join}>Join</button>
                          </ListGroup.Item>
                          :
                          <ListGroup.Item variant="danger">
                          {data.name}
                          <p style={{textAlign: "right"}}>{data.occupancy}/4</p>
                          <button disabled>Join</button>
                          </ListGroup.Item>       
                        )}
                  </ListGroup>
                </div>
            </React.Fragment>
          );  
        }
      }
}

export default Lobby;