import React from 'react';
import '../App.css';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import signup from './signup';
import home from './Home';
import about from './About';
import lobby from './lobby';
import LogIn from './Login';
import room from './Room';
import rules from './rules';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../logo.svg';
import Button from 'react-bootstrap/Button';

const InvalidRoute = ({ location }) => (
    <React.Fragment>
        <br></br>
        <h3 style={{textAlign: 'center'}}>Error: 404 not found</h3>
        <h5 style={{textAlign: 'center'}}>Cannot find pages with the link of <code>{location.pathname}</code></h5>
    </React.Fragment>

);
const IllegalRequest = () => (
    <React.Fragment>
        <br></br>
        <h3 style={{textAlign: 'center'}}>Illegal Request to Protected Route.</h3>
        <h5 style={{textAlign: 'center'}}>Please <a href="/login">Log in</a> to access content or <a href="/signup">Sign Up</a> to create an account</h5>
    </React.Fragment>
  )
class nav extends React.Component{
    render(){
        function logout(){
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('roomID');
            window.location.reload();
        }
        var user = sessionStorage.getItem('user');
        if(user !== undefined && user !== 'undefined' && user !== null){
            return(
                <React.Fragment>
                    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
                        <Navbar.Brand href="/" exact="true"><img src={logo} alt="" width="30" height="30" className="d-inline-block align-top"/>
                        {' 6 Cards Golf'}
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                        <Navbar.Collapse id="responsive-navbar-nav">
                            <Nav className="mr-auto">
                                <Nav.Link  href="/" exact="true">Home</Nav.Link>
                                <Nav.Link  href="/lobby" exact="true">Lobby</Nav.Link>
                                <Nav.Link  href="/about">About</Nav.Link>
                                <Nav.Link  href="/rules">How to Play</Nav.Link>
                            </Nav>
                            <Nav>
                            <Button variant="outline-light" onClick={logout} href="/">Sign Out</Button>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                    <BrowserRouter>
                        <Switch>
                            <Route exact path="/" component={home} />
                            <Route path="/lobby" component={lobby} />
                            <Route path="/about" component={about} />
                            <Route path="/game" component={room} />
                            <Route path="/rules" component={rules} />
                            <Route component={InvalidRoute} />
                        </Switch>
                    </BrowserRouter>     
                </React.Fragment>
            );
        }else{
            return(
                <React.Fragment>
                    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
                        <Navbar.Brand href="/" exact="true"><img src={logo} alt="" width="30" height="30" className="d-inline-block align-top"/>
                        {' 6 Cards Golf'}
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                        <Navbar.Collapse id="responsive-navbar-nav">
                            <Nav className="mr-auto">
                                <Nav.Link  href="/" exact="true">Home</Nav.Link>
                                <Nav.Link  href="/about">About</Nav.Link>
                                <Nav.Link  href="/rules">How to Play</Nav.Link>
                            </Nav>
                            <Nav>
                                <Nav.Link  href="/login">Login</Nav.Link>
                                <Nav.Link  href="/signup">Sign Up</Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                    <BrowserRouter>
                        <Switch>
                            <Route exact path="/" component={home} />
                            <Route path="/lobby" component={IllegalRequest} />
                            <Route path="/login" component={LogIn} />
                            <Route path="/signup" component={signup} />
                            <Route path="/about" component={about} />
                            <Route path="/rules" component={rules} />
                            <Route component={InvalidRoute} />
                        </Switch>
                    </BrowserRouter>    
                </React.Fragment> 
            );
        }
    }
}

export default nav;