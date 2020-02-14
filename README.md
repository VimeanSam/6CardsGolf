# 6CardsGolf

## Dependencies
1. React.js -> used for rendering client data
2. Node.js -> used for backend server functions
3. Express -> Node.js framework for backend
4. Socket.io -> used for real-time player actions/turns and in-game chats
5. Axios -> used for transfering data from client to server
6. Bcrypt -> used for encrypting passwords
7. Passport -> used for authenticating password for login
8. MongoDB -> database used for players storage and game room information
9. Visual Studio Code -> IDE used to program this project

## Download
1. Git clone project link.
2. npm install in the directory containing the server folder
3. cd my-app and npm install again in there
4. npm run dev to run project

## Screenshots
1. Login Screen: players are required to login to access game rooms.
![](/my-app/Screenshots/login.png)
2. Signup: signup will direct players to lobby. Just like Login. 
![](/my-app/Screenshots/signup.png)
3. Lobby: Players can join an existing game or create a new one.
![](/my-app/Screenshots/lobby.png)
4. The maximum player per room is 4. Therefore, players cannot join a full room. In addition, players also cannot join a room that is in an endgame phase (someone has all the cards face-up) 
![](/my-app/Screenshots/fullroom.png)
5. Game room: Game will start when there are more than 2 players. First player to join will be granted the first turn. The rest of players have to await their turns. Player cards will be brightly lit to indicate their turns.  
![](/my-app/Screenshots/gameroom.png)
6. Whoever has the lowest score wins.
![](/my-app/Screenshots/winner.png)
7. Lowest score a player can get. 
![](/my-app/Screenshots/lowestscore.png)

