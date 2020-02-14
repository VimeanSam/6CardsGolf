import io from 'socket.io-client';

const socket = io();
function socketClient(){
    return socket;
}

export default {socketClient}