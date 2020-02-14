import React from 'react';
import '../App.css';
import { Button, FormGroup} from "react-bootstrap";
import axios from 'axios';
import {Redirect} from 'react-router-dom';
import Lobby from './lobby';

class Login extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            login: false,
            userStatus: '',
            passwordStatus: '',
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleSubmit = (e) =>{
        axios.post('/login', {
            username: this.state.username,
            password: this.state.password,
        })
        .then((response) => {
            this.setState({userStatus: ''});
            if (response.status === 200) {
                sessionStorage.setItem('user', this.state.username);
                this.setState({login: true});
                window.location.reload();
            }
        })
        .catch((error) =>{
            this.setState({userStatus: 'Invalid username or password'});
            console.log('error');
        }); 
        e.preventDefault();
    }
    render(){
        if(this.state.login){
            return(
                <React.Fragment>
                    <Redirect to= '/lobby'/>
                    <Lobby name={this.state.username}/>
                </React.Fragment>
            );
        }
        return(     
            <React.Fragment>
                <br></br>
                <h1 id='greetings'>Log In</h1>
                <div className="Login">
                    <p style={{textAlign: 'center'}}>Please log in to your account to access contents</p>
                    <form onSubmit={this.handleSubmit}>
                        <div id='user_error' style={{color: 'red'}}>{this.state.userStatus}</div>
                        <FormGroup controlId="username" bssize="large">
                            <label>Username</label>
                            <input type="text" placeholder="Enter Username" name="username" onChange={(e)=> this.setState({username: e.target.value})} required/>
                        </FormGroup>
                        <FormGroup controlId="password" bssize="large">
                            <label>Password</label>
                            <div id='password_error' style={{color: 'red'}}>{this.state.passwordStatus}</div>
                            <input type="password" placeholder="Enter Password" name="psw" onChange={(e)=> this.setState({password: e.target.value})} required/>
                        </FormGroup>
                        <Button block bssize="large" variant="success" type="submit">Login</Button>
                    </form>
                    <br></br>
                    <p style={{textAlign: 'center'}}>No account? <a href="/signup">Sign Up</a> anytime</p>
                </div>        
          </React.Fragment>
        );  
    }
}

export default Login;