// import { Component, ViewChild } from '@angular/core';
// import { NavController, SegmentButton, AlertController } from 'ionic-angular';
// import { Validators, FormGroup, FormControl } from '@angular/forms';
// import { counterRangeValidator } from '../../components/counter-input/counter-input';
// import { Storage } from '@ionic/storage';
// import { SignaturePad } from 'angular2-signaturepad/signature-pad';
// import { ToastController } from 'ionic-angular';

// @Component({
//   selector: 'form-delivery-page',
//   templateUrl: 'form-delivery.html'
// })
// export class FormDeliveryPage {
//   // section: string;

//   delivery_form: FormGroup;
  

//   signature = '';
//   isDrawing = false;
 
//   @ViewChild(SignaturePad) signaturePad: SignaturePad;
//   private signaturePadOptions: Object = { // Check out https://github.com/szimek/signature_pad
//     'minWidth': 2,
//     'canvasWidth': 400,
//     'canvasHeight': 200,
//     'backgroundColor': '#f6fbff',
//     'penColor': '#666a73'
//   };

//   constructor(public nav: NavController, public alertCtrl: AlertController,public storage: Storage,public toastCtrl: ToastController) {
    
 
//     this.delivery_form = new FormGroup({
//       observation: new FormControl(''),
//       // signature: new FormControl('')
     
//     });

   
    
//   }

//   ionViewDidEnter() {
//     this.signaturePad.clear()
//     this.storage.get('savedSignature').then((data) => {
//       this.signature = data;
//     });
//   }
 
//   drawComplete() {
//     this.isDrawing = false;
//   }
 
//   drawStart() {
//     this.isDrawing = true;
//   }
 
//   savePad() {
//     this.signature = this.signaturePad.toDataURL();
//     this.storage.set('savedSignature', this.signature);
//     this.signaturePad.clear();
//     let toast = this.toastCtrl.create({
//       message: 'New Signature saved.',
//       duration: 3000
//     });
//     toast.present();
//   }
 
//   clearPad() {
//     this.signaturePad.clear();
//   }

//   createDelivery(){
//     console.log(this.delivery_form.value);
//   }

  

  
// }



import { Component, ViewChild, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import * as io from 'socket.io-client';
import * as moment from 'moment';

 
@Component({
   selector: 'form-delivery-page',
  templateUrl: 'form-delivery.html'
})
export class FormDeliveryPage {
  signature = '';
  isDrawing = false;
  
  delivery_form: FormGroup;

  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  JourneyRoute: any;
 
  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  public signaturePadOptions: Object = { // Check out https://github.com/szimek/signature_pad
    'minWidth': 2,
    'canvasWidth': 400,
    'canvasHeight': 250,
    'backgroundColor': '#f6fbff',
    'penColor': '#194e92',
    'throttle': 5
  };
 
  constructor(public navController: NavController, public storage: Storage, public toastCtrl: ToastController) {
    
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});
    
    this.delivery_form = new FormGroup({
      observation: new FormControl(''),
      // signature: new FormControl('')
      
     
    });
    this.storage.get('person').then((val)=>{
      this.socket.emit('RequestJourneyRoute', val.PERSONID); //request al servidor con el parametro
    });

    this.socket.on('JourneyRouteData',(data)=>{
      this.JourneyRoute=data[0];
      console.log(this.JourneyRoute);
    });
  }
 
  ionViewDidEnter() {
    this.signaturePad.clear()
    this.storage.get('savedSignature').then((data) => {
      this.signature = data;
    });
  }
 
  drawComplete() {
    this.isDrawing = false;
  }
 
  drawStart() {
    this.isDrawing = true;
  }
 
  savePad() {
    

    this.signature = this.signaturePad.toDataURL();
    var split_1: string[] = this.signature.split(';');
    var split_2 = split_1[1].replace("base64,", "");
    this.storage.set('savedSignature', split_2);

    let deliveryData={journeyid: this.JourneyRoute.JourneyId, observation: this.delivery_form.get('observation').value, signature: split_2 , deliverytime: moment().format('YYYY-MM-DD h:mm:ss')};
    console.log(this.JourneyRoute.journeyid);
    this.socket.emit('RegisterDelivery',deliveryData);    
    
    

    this.signaturePad.clear();
    
    let toast = this.toastCtrl.create({
      message: 'New Signature saved.',
      duration: 3000
    });
    toast.present();
  }
 
  clearPad() {
    this.signaturePad.clear();
  }
  
  createDelivery(){
    console.log(this.delivery_form.value);
    this.storage.get('savedSignature').then((signature)=>{console.log(signature +"----"+ typeof(signature))});

  }
}