import { Component, NgZone } from '@angular/core';
import { NavController, ModalController, LoadingController } from 'ionic-angular';
import { FormGroup, FormControl } from '@angular/forms';

import { TermsOfServicePage } from '../terms-of-service/terms-of-service';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';

import { WalkthroughPage } from '../walkthrough/walkthrough';

import 'rxjs/Rx';

import { ProfileModel } from '../profile/profile.model';
import { ProfileService } from '../profile/profile.service';

import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'settings-page',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  settingsForm: FormGroup;
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  userSelected:any;
  // make WalkthroughPage the root (or first) page
  rootPage: any = WalkthroughPage;
  loading: any;
  profile: ProfileModel = new ProfileModel();
  personid: any;

  constructor(
    public nav: NavController,
    public modal: ModalController,
    public loadingCtrl: LoadingController,
    public profileService: ProfileService,
    public storage: Storage
  ) {
    this.loading = this.loadingCtrl.create();

    this.settingsForm = new FormGroup({
      name: new FormControl(),
      lastname: new FormControl(),
      ruc: new FormControl(),
      phone: new FormControl(),
      address: new FormControl(),
      password: new FormControl(),
      email:new FormControl()
      
    });

    this.socket=io.connect(this.socketHost);
    

    // this.socket.on('SelectUserData',(data)=>{
    //   this.userSelected=data[0];
    // });

    
  }

  ionViewDidLoad() {
    // this.loading.present();
    this.storage.get('person').then((valPerson)=>{
      this.personid=valPerson.PERSONID;
      this.storage.get('user').then((valUser)=>{
        this.settingsForm.setValue({
          name: valPerson.PERSONNAME,
          lastname: valPerson.PERSONLASTNAME,
          ruc: valPerson.PERSONCIRUC,
          phone: valPerson.PERSONPHONE,
          address: valPerson.PERSONADDRESS,
          password: valUser.USERPASSWORD,
          email: valUser.USEREMAIL
        });
      })
      
      // this.socket.emit('RequestUserData',val.PERSONID);
    });

        

        // this.loading.dismiss();
      
  }

  saveChanges(){
    let userData={
      personid: this.personid,
      name:this.settingsForm.get('name').value,
      lastName: this.settingsForm.get('lastname').value,
      phone: this.settingsForm.get('phone').value,
      address: this.settingsForm.get('address').value,
      ruc: this.settingsForm.get('ruc').value,
      password: this.settingsForm.get('password').value,
      email: this.settingsForm.get('email').value
    }

    let user={
      
      USEREMAIL: this.settingsForm.get('email').value,
      PERSONID: this.personid,
      USERPASSWORD: this.settingsForm.get('password').value,
      USERPROFILE: 'cliente'
    }

    let person={
      PERSONID: this.personid,
      PERSONCIRUC: this.settingsForm.get('ruc').value,
      PERSONNAME:this.settingsForm.get('name').value,
      PERSONLASTNAME: this.settingsForm.get('lastname').value,
      PERSONPHONE: this.settingsForm.get('phone').value,
      PERSONADDRESS: this.settingsForm.get('address').value,
      PERSONROLE: 'conductor'
     
    }

    this.storage.set('user', user);
    this.storage.set('person', person);
    this.socket.emit('AppUserUpdate',userData);

    this.ionViewDidLoad();
  }

  logout() {
    // navigate to the new page if it is not the current page
    this.nav.setRoot(this.rootPage);
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
