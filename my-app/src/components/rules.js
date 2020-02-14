import React from 'react';
import '../App.css';

class Rules extends React.Component{
    render(){
        return(
          <React.Fragment>
              <br></br>
              <h1 id="greetings">Rules</h1> 
              <div style={{marginLeft: '60px', marginRight: '60px'}}>
                <h5> 
                The objective is for players to have the lowest value of the cards in front of them by either swapping them for lesser value cards or by pairing them up with cards of equal rank.
                Beginning with the player to the dealer's left, players take turns drawing single cards from either the stock or discard (burnt) piles. The drawn card may either be swapped for one of that player's 6 cards, or discarded. 
                If the card is swapped for one of the face down cards, the card swapped in remains face up. The face down cards will be in the discard piles. The round ends when all of a player's cards are face-up.
                The player with the lowest total score is the winner.
                </h5>
                <h2 id="greetings">Technical functions</h2> 
                <h5> 
                  Players who wishes to play this web clone of 6 cards golf must sign up or log in if have an account in order to create a room for the game. Each room holds up to
                  4 players max. Players cannot join a full room or a room that has a player with all their cards face-up. Therefore, a user must create a new room for separate game. A room must have 2 or more players for the game to start. Each players will
                  be granted a turn respectively based on the game state. If a player disconnect from the game, they will be removed from the game room
                  and if it is the disconnected player's turn, the next player will be granted a turn. Ex: 4 people in room, player 2's turn and disconnect happened, player 3 will be granted move.
                </h5>
                <h2 id="greetings">Deck</h2> 
                <h5> 
                  A double deck poker set is used for this web game. There are 108 cards total including the jokers. Therefore, there are many duplicate standard cards in this massive deck.
                </h5>
                <h2 id="greetings">Scoring</h2> 
                <h5> 
                If a column contains card of the same rank, the column will be disregarded and players will be rewarded 0 points. Aces are worth 1 point, numbered cards 2-10 are worth their numerical value respectively.
                Kings are worth 0 point, Jokers are -2 points, Jack and Queens are 10 points. If players have 2 columns next to each other with the same card ranks, they will be rewarded -20 points which almost guaranteed a victory.
                However in a very rare occassion where all 6 of the player cards are of equal ranks, the player will be rewarded -30 points final score which cannot be beaten. 
                </h5>
              </div>
          </React.Fragment>
        );  
      }
}

export default Rules;