import React from 'react';
import '../App.css';
//import socket from '../socketControl/socketClient';
import {Redirect} from 'react-router-dom';
import io from 'socket.io-client';
let url = 'http://localhost:3002/game';
if(process.env.NODE_ENV === 'production'){
  url = 'https://sixcardsgolf.herokuapp.com/game';
}
const socket = io.connect(url, {
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 10,
    pintTimeout: 6000000000000000
});
const axios = require('axios');

class Room extends React.Component{
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
          players: [],
          deck: [],
          Drawclicked: 1,
          firstRound: true,
          endgame: false,
          gameOver: false,
          activeSocket: '',
          start: true,
          drawTurn: false,
          draw: false,
          burntPile: 'mystery',
          burn: false,
          selected: '',
          cardflipped: false,
          flipCounter: 1,
          tracker: '',
          rotate: false,
          winner: '',
          msg: '',
          messages: [],
          theme: 'cards',
          socket: '',
          turn: 0,
        };
        this.play = this.play.bind(this);
        this.draw = this.draw.bind(this);
        this.burn = this.burn.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.selectCard = this.selectCard.bind(this);
        this.rematch = this.rematch.bind(this);
    }
    
    componentDidMount() {
        this._isMounted = true;
        let rid = sessionStorage.getItem('roomID');
        let user = sessionStorage.getItem('user');
        if (this._isMounted) {
            socket.emit('join', rid, user);
            socket.on('rotate', ()=>{
                console.log('inside ROTATE');
                //console.log(this.state)
                this.setState({activeSocket: ''})
            });
            socket.on('updateInfo', () =>{
                this.getRoomInfo();
                this.getPlayers();
                this.getMessages();
            });
            socket.on('enableMove', (idx) =>{
                let user = sessionStorage.getItem('user');
                if(this.state.players[idx]){
                    if(this.state.players[idx].name === user){
                        this.setState({activeSocket: this.state.players[idx].id, drawTurn: true});
                    }
                }
            });
            socket.on('receivedMessage', () =>{
                this.getMessages();
            });
            socket.on('playerDoneDisconnect', (amount) =>{
                console.log(amount);
                if(amount === 0){
                    this.setState({endgame: false});
                }
            });
            socket.on('updateDeck', (pack) =>{
                this.setState({deck: pack});
                if(pack.length < 1){
                    this.setState({endgame: true});
                }
            });
            socket.on('getPlayers', () =>{
                this.getPlayers();
            });
            socket.on('drawedPile', (card) => {
                this.setState({burntPile: card});
            });
            socket.on('swap', (burnedCard) => {
                this.setState({burntPile: burnedCard});
            });
            socket.on('notifyTurn', () => {
                this.getRoomInfo();
            });
            socket.on('endGame', (signal) =>{
                this.setState({endgame: signal});
            });
            socket.on('gameOver', (status, winnerName) =>{
                this.setState({
                    gameOver: status,
                    selected: '',
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false,
                    activeSocket: '',
                    winner: winnerName
                });
            });
            socket.on('reset', ()=>{
                this.setState({
                    firstRound: true,
                    endgame: false,
                    gameOver: false,
                    start: true,
                    cardflipped: false,
                    burn: false,
                    flipCounter: 1,
                    winner: '',
                    tracker: ''
                });
            });
        }  
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }
  
    componentWillUnmount() {
        this._isMounted = false;
    } 

    getPlayers(){
        let rid = sessionStorage.getItem('roomID');
        axios.get('/getPlayers', {
            params: {
                id: rid,
            }
        })
        .then((response = response.json()) => {
            //console.log(response.data);
            let user = sessionStorage.getItem('user');
            let exist = response.data.filter(data => data.name === user);
            if(exist.length < 1){
                sessionStorage.removeItem('roomID');
                window.location.href = '/lobby';
            }
            this.setState({players: response.data});
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    getRoomInfo(){
        let rid = sessionStorage.getItem('roomID');
        axios.get('/getRoom', {
            params: {
                id: rid,
            }
        })
        .then((response = response.json()) => {
            if(response.data[0].playersDone === 0){
                this.setState({endgame: false});
            }
            this.setState({theme: response.data[0].cardTheme, deck: response.data[0].deck, turn: response.data[0].turnIndex});
            
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    getMessages(){
        let rid = sessionStorage.getItem('roomID');
        axios.get('/getMessages', {
            params: {
                id: rid,
            }
        })
        .then((response = response.json()) => {
            //console.log(response.data[0].messages);
            this.setState({messages: response.data[0].messages});
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    scrollToBottom = () => {
        var roomID = sessionStorage.getItem('roomID');
        if(roomID){
            this.messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
    }

    play = (e)=>{
        let temp = e.target.id;
        //console.log(this.state)
        if(this.state.firstRound){
            if(this.state.flipCounter <= 2 && temp !== this.state.tracker){
                this.setState({flipCounter: this.state.flipCounter+1});
                socket.emit('flipCard', e.target.id);
                if(this.state.flipCounter === 2){
                    this.setState({cardflipped: true});
                }
                this.setState({tracker: temp});
            }
            if(this.state.selected !== '' && this.state.selected !== 'mystery' && this.state.cardflipped && !this.state.endgame){
                socket.emit('swapCard', e.target.id, this.state.selected);
                socket.emit('nextTurn', e.target.id);
                this.setState({
                    activeSocket: '',
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false,
                    firstRound: false,
                    selected: '',
                    tracker: temp
                });
            }
        }
        //when first round is over, player can no longer flip over cards. However, players can swap their deck with better cards if possible. 
        if(!this.state.firstRound && !this.state.endgame){
            this.setState({flipCounter: 1});
            if(this.state.selected !== ''){
                socket.emit('swapCard', e.target.id, this.state.selected);
                socket.emit('nextTurn', e.target.id);
                this.setState({
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false,
                    selected: '',
                    activeSocket: ''
                });
            }
        }
        if(this.state.endgame){
            //console.log('selected '+ this.state.selected);
            //console.log('drawturn '+this.state.drawTurn);
            //console.log(this.state)
            if(this.state.selected !== '' && this.state.drawTurn){
                console.log('IN HERE')
                socket.emit('swapCard', e.target.id, this.state.selected);
                //socket.emit('scan', e.target.id);
                //socket.socketClient().emit('scanPlayerHands', e.target.id, this.state.players.length);
                this.setState({
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false,
                    selected: ''
                });
            }
            if(!this.state.drawTurn){
                if(!this.state.gameOver){
                    socket.emit('flipCard', e.target.id);
                    //socket.emit('scan', e.target.id);
                    //socket.socketClient().emit('scanPlayerHands', e.target.id, this.state.players.length);
                }
            }
        }
        e.preventDefault();
    }

    burn = (e)=>{
        if(this.state.firstRound){
            if(this.state.draw && this.state.cardflipped){
                if(this.state.endgame){
                    this.setState({
                        selected: '',
                        drawTurn: false,
                        Drawclicked: 1,
                        draw: false
                    });
                }else{
                    this.setState({
                        activeSocket: '',
                        drawTurn: false,
                        Drawclicked: 1,
                        draw: false,
                        selected: ''
                    });
                    socket.emit('nextTurn', e.target.id);
                }
            }
        }else{
            if(this.state.draw && !this.state.endgame){
                this.setState({
                    activeSocket: '',
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false,
                    selected: ''
                });
                socket.emit('nextTurn', e.target.id);
            }
            if((this.state.draw && this.state.endgame) || (this.state.deck.length === 0)){
                this.setState({
                    selected: '',
                    drawTurn: false,
                    Drawclicked: 1,
                    draw: false
                });
            }
        }
    }

    draw = (e)=>{
        this.setState({Drawclicked: this.state.Drawclicked+1})
        if(this.state.Drawclicked < 2 && !this.state.gameOver && this.state.deck.length > 0){
            socket.emit('drawCard', e.target.id, this.state.deck);
            this.setState({draw: true});
        }
        e.preventDefault();
    }

    selectCard = (e)=>{
        let card = e.target.id.toString();
        if(this.state.firstRound){
            if(this.state.cardflipped){
                this.setState({selected: card});
            }
        }else{
            if(!this.state.gameOver){
                this.setState({selected: card});
            }
        }
        e.preventDefault();
    }

    handleMessage = (e)=>{
        this.scrollToBottom();
        if(this.state.msg !== ''){
            socket.emit('onMessage', e.target.id, this.state.msg);
            this.setState({msg: ''});
            this.myFormRef.reset();
        }
        e.preventDefault();
    }

    rematch = (e) =>{
        socket.emit('rematch', e.target.id);
    }

    render(){
        var roomID = sessionStorage.getItem('roomID');
        var user = sessionStorage.getItem('user');
        if(roomID){
            if(this.state.start){
                socket.emit('getTurn', roomID);
                this.setState({start: false});
            }
           
            return(
                <React.Fragment>
                    <br></br>
                    <h1 id="greetings">Game Room</h1>
                    <p style={{textAlign: "center"}}>Cards left: {this.state.deck.length}</p>
                    {this.state.gameOver? <h1 style={{textAlign: "center"}}>{this.state.winner} has won the game! <br></br><button id={roomID} onClick={this.rematch}>New Game</button> </h1>: <h1></h1>}
                    {this.state.drawTurn? 
                    <div className="normal" style={{textAlign: "center"}}>
                        <img id={roomID} src={require(`../${this.state.theme}/x.png`)} width="70px" height="100px" onClick={this.draw}></img>
                        <img id={this.state.burntPile} src={require(`../${this.state.theme}/${this.state.burntPile}.png`)} width="70px" height="100px" onClick={this.selectCard}></img>
                        <button id={user+`|`+roomID+`/`} onClick={this.burn}>Burn</button>
                    </div>
                    : <div className="disabled" style={{textAlign: "center"}}>
                        <img src={require(`../${this.state.theme}/x.png`)} width="70px" height="100px"></img>
                        <img src={require(`../${this.state.theme}/${this.state.burntPile}.png`)} width="70px" height="100px"></img>
                    </div>}
                    {this.state.players.map((data, playerIndex) =>
                    (data.id === this.state.activeSocket)? 
                    <div className="normal">
                        <div class="grid3x3">
                            <p style={{textAlign: "center"}}>{data.name}</p>
                            {data.cards.map((card, index) =>
                            <div><img id={playerIndex+`:`+user+`=`+data.id+`|`+roomID+`/`+index} src={require(`../${this.state.theme}/${card}.png`)} width="70px" height="100px" onClick={this.play}></img></div>
                            )}
                        </div>
                        <p>{data.score} point(s)</p>
                    </div> :        
                    <div className="disabled">
                        <div class="grid3x3">
                            {playerIndex === this.state.turn? <p style={{textAlign: "center", color: 'gold', fontWeight: '600'}}>{data.name}</p> : <p style={{textAlign: "center"}}>{data.name}</p>}
                            {data.cards.map((card, index) =>
                            <div><img id={user+`|`+roomID+`/`+index} src={require(`../${this.state.theme}/${card}.png`)} width="70px" height="100px"></img></div>
                            )}
                        </div>
                        <p>{data.score} point(s)</p>
                    </div>
                    )}
                    <div class="footer">
                        <b style={{textAlign: "center"}}>Chat</b>
                        {this.state.messages.map(data =>
                            <div><b style={{color: data.color}}>{data.from}</b>: {data.message}</div>   
                        )}
                        <div style={{ float:"left", clear: "both" }}ref={(el) => { this.messagesEnd = el; }}></div>
                    </div>
                    <div id="chatBox">
                    <form id={user+`|`+roomID+`/`} onSubmit={this.handleMessage} ref={(el) => this.myFormRef = el}>
                        <input type="text" onChange={(e)=> this.setState({msg: e.target.value})} placeholder="Chat Message"/>
                    </form>
                    </div>
                </React.Fragment>
            );  
        }else{
            return(
                <React.Fragment>
                    <Redirect to= '/lobby'/>
                </React.Fragment>
            );
        }
    }
}

export default Room;