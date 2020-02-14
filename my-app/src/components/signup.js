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

    validateEmail = (email)=>{
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(email)){
            this.setState({emailStatus: 'Email is not valid!'});
        }
        return re.test(email);
    }   

    validatePassword = (password)=>{
        if(password.length < 7){
            this.setState({passwordStatus: 'Password must be more than 7 characters!'});
            return 'WEAK';
        }
        var matchedCase = [];
        matchedCase.push("[$@$!%*#?&]"); // Special Charector
        matchedCase.push("[A-Z]");      // Uppercase 
        matchedCase.push("[0-9]");      // Numbers
        matchedCase.push("[a-z]");     // Lowercase
        var matched = 0;
        var strength = '';
        for (var i = 0; i < matchedCase.length; i++) {
            if (new RegExp(matchedCase[i]).test(password)) {
                matched++;
            }
        }
        switch (matched) {
            case 0:
            case 1:
            case 2:
                strength = 'WEAK';
                this.setState({passwordStatus: 'Password must contain uppercase, lowercase, and numbers or special characters'});
                break;
            case 3:
                strength = 'MEDIUM';
                break;
            case 4:
                strength = "STRONG";
                break;
        }
        return strength;
    }

    handleSubmit = (e) =>{
        if(this.state.password !== this.state.password_confirm){
            this.setState({password_confirmStatus: 'Password Must Match!'});
        }else{
            this.setState({userStatus: '', passwordStatus: '', password_confirmStatus: ''});
            let emailValidation = this.validateEmail(this.state.email);
            let password_strength = this.validatePassword(this.state.password);
            //only unique username and email will be inserted into db
            if(emailValidation && password_strength !== 'WEAK'){
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