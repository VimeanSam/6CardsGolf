import React from 'react';
import '../App.css';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import {Redirect} from 'react-router-dom';
import Lobby from './lobby';

class signup extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            username: '',
            userStatus: '',
            email: '',
            emailStatus: '',
            password: '',
            passwordStatus: '',
            password_confirm: '',
            password_confirmStatus: '',
            login: false,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit = (e) =>{
        if(this.state.password !== this.state.password_confirm){
            this.setState({password_confirmStatus: 'Password Must Match!'});
        }else{
            this.setState({userStatus: '', passwordStatus: '', password_confirmStatus: ''});
            axios.post('/signup', {
                username: this.state.username,
                email: this.state.email,
                password: this.state.password,
                unhashed: this.state.password
            })
            .then((response) => {
                if (!response.data.error) {
                    this.setState({login: true});
                    sessionStorage.setItem('user', this.state.username);
                    window.location.reload();
                }else{
                    this.setState({userStatus: response.data.error});
                }
            })
            .catch(function (error) {
                console.log(error);
            }); 
        }
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
                <h1 id='greetings'>Sign Up</h1>
                <form onSubmit={this.handleSubmit}>
                    <div class="container">
                        <p>Please fill in this form to create an account.</p>
                        <label><b>Username</b></label>
                            <div style={{color: 'red'}}>{this.state.userStatus}</div>
                            <input type="text" placeholder="Enter Username" name="username" onChange={(e)=> this.setState({username: e.target.value})} required/>
                            <br></br>
                            <br></br>
                        <label><b>Email</b></label>
                        <div style={{color: 'red'}}>{this.state.emailStatus}</div>
                            <input type="text" placeholder="Enter Email" name="email" onChange={(e)=> this.setState({email: e.target.value})} required/>
                            <br></br>
                            <br></br>
                        <label><b>Password</b></label>
                            <div style={{color: 'red'}}>{this.state.passwordStatus}</div>
                            <input type="password" placeholder="Enter Password" name="psw" onChange={(e)=> this.setState({password: e.target.value})} required/>
                            <br></br>
                            <br></br>
                        <label><b>Repeat Password</b></label>
                            <div style={{color: 'red'}}>{this.state.password_confirmStatus}</div>
                            <input type="password" placeholder="Repeat Password" name="psw-repeat" onChange={(e)=> this.setState({password_confirm: e.target.value})} required/>
                            <br></br>
                            <br></br>
                        <div style={{textAlign: 'center'}}>
                            <Button variant="success" size="lg" type="submit">Sign Up</Button> 
                        </div>
                    </div>       
                </form>
            </React.Fragment>
        );
    }
}

export default signup;