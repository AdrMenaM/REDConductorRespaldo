import { Component,NgZone } from '@angular/core';
import { NavController, ModalController, LoadingController,ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { TermsOfServicePage } from '../terms-of-service/terms-of-service';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';
import { FacebookLoginService } from '../facebook-login/facebook-login.service';
import { GoogleLoginService } from '../google-login/google-login.service';

import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';
import * as $ from 'jquery';

import { Auth, User, UserDetails, IDetailedError } from '@ionic/cloud-angular';

@Component({
  selector: 'signup-page',
  templateUrl: 'signup.html'
})
export class SignupPage {
  signup: FormGroup;
  loading: any;
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  lstUsers: any=[];
  maxlengt: any;
  errorMsg: any;
  email:string;
  passwd:string;
  // enabledCi: boolean;
  constructor(
    public nav: NavController,
    public modal: ModalController,
    public facebookLoginService: FacebookLoginService,
    public googleLoginService: GoogleLoginService,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public storage: Storage,
    private fb: FormBuilder,
    public auth: Auth,
    public user: User
  ) {
    this.signup = new FormGroup({
      rdbciruc: new FormControl('rdbci'),
      // rdbruc: new FormControl(),
      
      ci: new FormControl(''),
      name: new FormControl('', Validators.required),
      lastName: new FormControl('',Validators.required),
      phone: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
      // ruc: new FormControl('', ),
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      confirm_password: new FormControl('', Validators.required),
      // role: new FormControl('', Validators.required)
    });

    // let control = this.signup.controls['ci'];
    // if (!control.valid) {
    //   if (control.errors['required']) {
    //     this.errorMsg = 'Provide a username please';
    //   } else if (control.errors['minlength']) {
    //     this.errorMsg = 'The username must have at least 5 characters';
    //   }
    // }

    // this.signup = this.fb.group({
    //   value: ['rdbci']
    // });

    // Manejo socket
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});
    this.socket.emit('AppDataUsersRequest','ex app');
    this.socket.on('AppSelectUsers',(data)=>{
      this.lstUsers = data;
    });  
    // Fin Manejo socket
    this.signup.get('ci').disable();
    this.selectCiRuc();
  }

  selectCiRuc(){
   
    if(this.signup.get('rdbciruc').value=='rdbci'){  
      this.maxlengt=10;
      this.signup.get('ci').setValidators(Validators.compose([Validators.required,Validators.minLength(10),Validators.maxLength(10)]));
      this.signup.get('ci').enable();
    }else{
      this.signup.get('ci').setValidators(Validators.compose([Validators.required,Validators.minLength(13),Validators.maxLength(13)]));
      this.maxlengt=13;
      this.signup.get('ci').enable();
 
    }
  }

  Vcedula()
    {
        var numc;
        var aux;
        var b;
        var sump= 0;
        var sumip=0;
        var i=9;
        var j;
        var ims=0;
        var v;
        var cedula=this.signup.get('ci').value;
        for( j=0;j<10;j+=2)
        {
            b=2*cedula[j];
            if(b>9)
                b=b-9;
            sump+=b;
        }
        for( j=1;j<8;j+=2)
        {
            b=cedula[j] * 1;    
            sumip+=b;
        }
        aux=sump+sumip;
        ims=aux-(aux%10)+10;
        v=ims-aux;
        if(v==10)
            v=0;
        if(v==cedula[9])
            return true;
        else
            return false;
    }

  doSignup(){
    var flag=false;
    for(var i=0;i<this.lstUsers.length;i++){
      console.log(this.lstUsers[i].person.PersonCi+" "+this.signup.get('ci').value);
      if(this.lstUsers[i].person.PersonCi==this.signup.get('ci').value){
        flag=true;
      }
    }
    console.log(flag);
    if(!flag){
        if(this.Vcedula()){
        if(this.signup.get('ci').value!="" && this.signup.get('name').value!=""&&this.signup.get('lastName').value!=""&&this.signup.get('phone').value!=""
          &&this.signup.get('address').value!=""&&this.signup.get('email').value!=""&&this.signup.get('password').value!=""
          &&this.signup.get('confirm_password').value!=""){
            if(this.signup.get('confirm_password').value==this.signup.get('password').value){
                let NewUser={
                  ci: this.signup.get('ci').value,
                  name: this.signup.get('name').value,
                  lastName: this.signup.get('lastName').value,
                  phone: this.signup.get('phone').value,
                  address: this.signup.get('address').value,
                  role: 'conductor',
                  email: this.signup.get('email').value,
                  pass: this.signup.get('password').value
                };
                // alert(this.storage.get('Position'));
                this.socket.emit('AppNewUserRequest',NewUser);
                let env = this;
                let toast = env.toastCtrl.create({
                      message: 'Tu solicitud de registro esta siendo procesada. Le notificaremos cuando su solicitud sea aceptada. Gracias',
                      duration: 4000,
                      position: 'center',
                          
                    });
                toast.present();
                this.email=NewUser.email;
                this.passwd=NewUser.pass;
                let details: UserDetails = {'email': this.email, 'password': this.passwd};

                this.auth.signup(details).then(() => {
                  // `this.user` is now registered
                }, (err: IDetailedError<string[]>) => {
                  for (let e of err.details) {
                    if (e === 'conflict_email') {
                      alert('El correo ingresado ya existe.');
                    } else {
                      // handle other errors
                    }
                  }
                });
            }else{
                let env = this;
                let toast = env.toastCtrl.create({
                      message: 'Las contraseñas ingresadas no coiciden. Por favor reingreselas.',
                      duration: 4000,
                      position: 'bottom'
                    });
                toast.present();
            }
        }else{
          let env = this;
          let toast = env.toastCtrl.create({
                message: 'Por favor ingrese todos los datos solicitados.',
                duration: 4000,
                position: 'bottom'
              });
          toast.present();
        }
      }else{
        let env = this;
        let toast = env.toastCtrl.create({
              message: 'La cédula ingresada no es válida, Por favor verifiquela y vuelva a ingresarla',
              duration: 4000,
              position: 'bottom'
            });
        toast.present();
      }
    }else{
        let env = this;
        let toast = env.toastCtrl.create({
              message: 'Ya existe un usuario registrado con ese número de cédula',
              duration: 4000,
              position: 'bottom'
            });
        toast.present();
    }
    // alert(flag);
  }

  doFacebookSignup() {
    this.loading = this.loadingCtrl.create();
    // Here we will check if the user is already logged in
    // because we don't want to ask users to log in each time they open the app
    let env = this;

    this.facebookLoginService.getFacebookUser()
    .then(function(data) {
       // user is previously logged with FB and we have his data we will let him access the app
      // env.nav.setRoot(env.maps_page.component);
    }, function(error){
      //we don't have the user data so we will ask him to log in
      env.facebookLoginService.doFacebookLogin()
      .then(function(res){
        env.loading.dismiss();
        // env.nav.setRoot(env.maps_page.component);
      }, function(err){
        console.log("Facebook Login error", err);
        env.loading.dismiss();
      });
    });
  }

  doGoogleSignup() {
    this.loading = this.loadingCtrl.create();

    // Here we will check if the user is already logged in because we don't want to ask users to log in each time they open the app
    let env = this;

    this.googleLoginService.trySilentLogin()
    .then(function(data) {
       // user is previously logged with Google and we have his data we will let him access the app
      // env.nav.setRoot(env.maps_page.component);
    }, function(error){
      //we don't have the user data so we will ask him to log in
      env.googleLoginService.doGoogleLogin()
      .then(function(res){
        env.loading.dismiss();
        // env.nav.setRoot(env.maps_page.component);
      }, function(err){
        console.log("Google Login error", err);
        env.loading.dismiss();
      });
    });
  }

  showTermsModal() {
    let modal = this.modal.create(TermsOfServicePage);
    modal.present();
  }

  showPrivacyModal() {
    let modal = this.modal.create(PrivacyPolicyPage);
    modal.present();
  }

}
