import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, LoadingController, Content } from 'ionic-angular';
import { SignatureForm } from '../signatureForm/signature-form';



// import { FeedPage } from '../feed/feed';
import 'rxjs/Rx';

// import { ListingModel } from './listing.model';
// import { ListingService } from './listing.service';


import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'listing-page',
  templateUrl: 'listing.html',
})

// @Component({
//     selector:'my-app',
//     template: `
//     <ul>
//       <li *ngFor="let journey of journeys">
//         {{lst.title}}
//       </li>
//     </ul>
//     `
//     // template: `
//     //   <ion-card *ngFor="let journey of journeys">
//     //     <div class="card-title">{{lst.title}}</div>
//     //   </ion-card>
//     // `
// })



export class ListingPage {

  // Manejo socket
  @ViewChild(Content) content: Content;
  messages: any = [];
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  chat:any;
  username: string;
  zone:any;
  lstJourneys: any = [];
  lstJourneyOrders:any=[];
  JourneyRoute: any;
  ActiveOrders: any=[];
  lstActiveOrders:any=[];
  // Fin manejo socket
  
  
  // lst=[{id:1, title:'Ruta 1'},{id:2, title:'Ruta 2'},{id:3, title:'Ruta 3'}];

  // listing: ListingModel = new ListingModel();
  // loading: any;



  

  constructor(public NavCtrl:NavController, public storage: Storage) {
    //this.data.journeys=[{journey_id:1, title:'Ruta 1', description:'Descripción de ruta 1', tires: 100},{journey_id:2, title:'Ruta 2', description:'Descripción de ruta 2', tires: 200},{journey_id:3, title:'Ruta 3', description:'Descripción de ruta 3', tires: 300}];
    
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});

    // this.setActiveOrders();
    
  }

  ngOnInit(){
    this.socket.removeAllListeners();

    this.ActiveOrders=[];
    this.socketUpdate();
  }

  socketUpdate(){
     // Manejo socket
    
    
    

    this.storage.get('person').then((val)=>{
      this.socket.emit('RequestJourneyRoute', val.PERSONID); //request al servidor con el parametro
      // alert("personid:"+val.PERSONID);
    })

    this.socket.on('JourneyRouteData',(data)=>{
      // console.log(data.length);
      this.JourneyRoute=data[data.length-1];
      // console.log(this.JourneyRoute.JourneyId);
      if(this.JourneyRoute!=null){
        this.socket.emit('RequestJourneyOrders',this.JourneyRoute.JourneyId);
      }
      else{
        alert("No tiene viajes asignados");
      }
      
    })
    // var JournId=this.JourneyRoute.JourneyId;
    // alert("journeyID:"+JournId);
    
    this.socket.on('ResponseJourneyOrders',(data)=>{
      // this.lstJourneyOrders=data;
      
      console.log(data);
      this.ActiveOrders=[];
      for(var i=0 ; i<data.length ; i++){
        if(data[i].ORDERSTATE=="En Proceso"||data[i].ORDERSTATE=="Completado"){
          this.ActiveOrders.push(data[i]);
        }
      }
      console.log(this.ActiveOrders); 
    }) 
    
    // Fin Manejo socket
  }

  cleanList(){
    this.ActiveOrders=[];
  }

  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    this.ngOnInit();
    
    setTimeout(() => {
      
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }

  // setActiveOrders(){
  //   console.log(this.lstJourneyOrders.lenght);
  //   for(var i=0;i<=this.lstJourneyOrders.lenght;i++){
        
  //       if(this.lstJourneyOrders.ORDERSTATE=="En Proceso"||this.lstJourneyOrders.ORDERSTATE=="Completado"){
  //         this.ActiveOrders.push(this.lstJourneyOrders[i]);
  //       }
  //   } 
  //     console.log(this.ActiveOrders);
  // }

  goToSignaturePad(orderId: any){
    this.NavCtrl.push(SignatureForm, {OrderId: orderId});
  }
  
  
  // ionViewDidLoad() {
  //   this.loading.present();
  //   this.listingService
  //     .getData()
  //     .then(data => {
  //       this.listing.banner_image = data.banner_image;
  //       this.listing.banner_title = data.banner_title;
  //       this.listing.populars = data.populars;
  //       this.listing.categories = data.categories;
  //       this.loading.dismiss();
  //     });
  // }


  // goToFeed(category: any) {
  //   console.log("Clicked goToFeed", category);
  //   this.nav.push(FeedPage, { category: category });
  // }

}
