import { Component,NgZone, ViewChild } from '@angular/core';
import { NavController, LoadingController,Content,ToastController  } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';
import { SignupPage } from '../signup/signup';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

import { FacebookLoginService } from '../facebook-login/facebook-login.service';
import { GoogleLoginService } from '../google-login/google-login.service';

import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';

import {
  Push,
  PushToken
} from '@ionic/cloud-angular';


import { Auth, User, UserDetails, IDetailedError } from '@ionic/cloud-angular';

@Component({
  selector: 'login-page',
  templateUrl: 'login.html'
})
export class LoginPage {
  // Manejo socket
  @ViewChild(Content) content: Content;
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  lstUsers: any = [];
  // Fin manejo socket
  login: FormGroup;
  main_page: { component: any };
  loading: any;
  

  constructor(
    public nav: NavController,
    public facebookLoginService: FacebookLoginService,
    public googleLoginService: GoogleLoginService,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public storage: Storage,
    public auth: Auth,
    public user: User,
    public push: Push
  ) {
    
    this.main_page = { component: TabsNavigationPage };

    this.login = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });

    // Manejo socket
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});
    this.socket.emit('AppDataUsersRequest','ex app');
    this.socket.on('AppSelectUsers',(data)=>{
      this.lstUsers = data;
    });  
    // Fin Manejo socket
  }

  doLogin(){
    // console.log('numero de usuarios: '+this.lstUsers.length)
    var flag=false;
    for(var i=0;i<this.lstUsers.length;i++){
      if(this.login.get('email').value==this.lstUsers[i].user.USEREMAIL && this.login.get('password').value==this.lstUsers[i].user.USERPASSWORD){
        flag=true;
        this.storage.set('user', this.lstUsers[i].user);
        this.storage.set('person', this.lstUsers[i].person);
        console.log('Persona logueada '+this.storage.get('person'))
        break;
      }else{
        flag=false;
      }
      // console.log(this.lstUsers[i].user.UserEmail+' '+this.lstUsers[i].user.UserPassword);
    }
    if(flag){
      let stringemail:string=this.login.get('email').value;
      let stringpasswd:string=this.login.get('password').value;
      this.nav.setRoot(this.main_page.component);
      let details = {'email': stringemail, 'password': stringpasswd};

      this.auth.login('basic', details).then(() => {
                this.push.register().then((t: PushToken) => {
                  return this.push.saveToken(t);
                  }).then((t: PushToken) => {
                    console.log('Token saved:', t.token);
                });
                  // `this.user` is now registered
                }, (err: IDetailedError<string[]>) => {
                  for (let e of err.details) {
                    alert(e);
                  }
                
      });

      

    }else{
      let env = this;
      let toast = env.toastCtrl.create({
            message: 'El Usuario o contraseña ingresado es incorrecto, Por favor verifiquelos y vuelva a ingresarlos',
            duration: 4000,
            position: 'bottom'
          });
      toast.present();
    }
  }

  doFacebookLogin() {
    this.loading = this.loadingCtrl.create();

    // Here we will check if the user is already logged in because we don't want to ask users to log in each time they open the app
    let env = this;

    this.facebookLoginService.getFacebookUser()
    .then(function(data) {
       // user is previously logged with FB and we have his data we will let him access the app
      env.nav.setRoot(env.main_page.component);
    }, function(error){
      //we don't have the user data so we will ask him to log in
      env.facebookLoginService.doFacebookLogin()
      .then(function(res){
        env.loading.dismiss();
        env.nav.setRoot(env.main_page.component);
      }, function(err){
        console.log("Facebook Login error", err);
      });
    });
  }

  doGoogleLogin() {
    this.loading = this.loadingCtrl.create();

    // Here we will check if the user is already logged in because we don't want to ask users to log in each time they open the app
    let env = this;

    this.googleLoginService.trySilentLogin()
    .then(function(data) {
       // user is previously logged with Google and we have his data we will let him access the app
      env.nav.setRoot(env.main_page.component);
    }, function(error){
      //we don't have the user data so we will ask him to log in
      env.googleLoginService.doGoogleLogin()
      .then(function(res){
        env.loading.dismiss();
        env.nav.setRoot(env.main_page.component);
      }, function(err){
        console.log("Google Login error", err);
      });
    });
  }


  goToSignup() {
    this.nav.push(SignupPage);
  }

  goToForgotPassword() {
    this.nav.push(ForgotPasswordPage);
  }



}
