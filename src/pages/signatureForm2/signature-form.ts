import { Component, ViewChild, NgZone } from '@angular/core';
import { NavController,NavParams,ViewController} from 'ionic-angular';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import * as io from 'socket.io-client';
import * as moment from 'moment';

 
@Component({
  selector: 'signature-form',
  templateUrl: 'signature-form.html'
})
export class SignatureForm2 {
  signature = '';
  isDrawing = false;

  orderId:any;
  data:any;
  sw:boolean=false;
  
  delivery_form: FormGroup;

  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  JourneyRoute: any;
  pickupData: any;
  
  sw2:boolean=false;
 
  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  public signaturePadOptions: Object = { // Check out https://github.com/szimek/signature_pad
    'minWidth': 2,
    'canvasWidth': 400,
    'canvasHeight': 300,
    'backgroundColor': '#f6fbff',
    'penColor': '#194e92',
    'throttle': 5
  };
 
  constructor(public navController: NavController, public storage: Storage, public toastCtrl: ToastController, public params:NavParams, public viewCtrl: ViewController) {
    this.data=params.get("data");
   
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});
    
    this.delivery_form = new FormGroup({
      observation: new FormControl(''),
      // signature: new FormControl('')
      
     
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

      this.pickupData={orderid: this.data.orderid, observation: this.data.observation, signatureGenerator:this.data.signature, signatureManager: split_2 , pickuptime: moment().format('YYYY-MM-DD h:mm:ss')};
      
      this.signaturePad.clear();
      
      let toast = this.toastCtrl.create({
        message: 'New Signature saved.',
        duration: 3000
      });
      toast.present();

      this.sw2=true;
      
  }
 
  clearPad() {
    this.signaturePad.clear();
  }
  
  saveSignature(){
    // console.log(this.delivery_form.value);
    // this.storage.get('savedSignature').then((signature)=>{console.log(signature +"----"+ typeof(signature))});

  }

  savePickup(){
    
      
      this.socket.emit('RegisterPickup',this.pickupData);
      this.socket.emit('UpdateOrderState', {state: "Completado", orderid: this.data.orderid});
      this.sw2=false;
      this.viewCtrl.dismiss();

    
  }


}