import { Component, NgZone,ViewChild, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController, PopoverController, NavParams, ViewController, Events } from 'ionic-angular';
import { Keyboard, Geolocation,Geoposition} from 'ionic-native';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';


import { Observable } from 'rxjs/Observable';

import { GoogleMap } from "../../components/google-map/google-map";
import { GoogleMapsService } from "./maps.service";
import { MapsModel, MapPlace } from './maps.model';

import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';
import * as $ from 'jquery';
import * as moment from 'moment';



//PopOver de Botón de Direcciones
@Component({
  template:  `
  <div>
  <h4 align="center">Direcciones</h4>
    <ul>
      <li *ngFor="let step of parameters">
        {{step}}
      </li>
    </ul>
  </div>
  ` 
})
export class PopoverPage {
  
  parameters: any;

  constructor(public viewCtrl: ViewController, public params: NavParams) {
    this.parameters=params.get('steps');
  }

  ngOnInit(){

  }
  close() {
    this.viewCtrl.dismiss();
  }
}


//PopOver de Botón de emergencia
@Component({
  template:  `
  <form [formGroup]="emergency">
    <div>
      <h4 align="center">Emergencia</h4>
      <div item-content style="width:100%; padding: 0px 15px 0px 15px; height: 60px;">
        <ion-textarea placeholder="Comentario" #box rows="3"  formControlName="comment"></ion-textarea>  
      </div>  
    
      <button ion-button block [disabled]="!emergency.valid" color='danger' (click)="sendAlert(box.value)" >Enviar</button>
    </div>
  </form>
  ` 
})
export class PopoverPageEmergency {
  
  // coment: string;
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  zone:any;
  JourneyRoute: any;
  Orders:any=[];
  lstActiveOrders: any=[];
  emergency: FormGroup;
  

  constructor(public viewCtrl: ViewController, public storage: Storage,public toastCtrl: ToastController, public viewControl:ViewController) {
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});

    this.socket.removeAllListeners();

    this.emergency = new FormGroup({
      comment: new FormControl('',Validators.required),
    });

    this.storage.get('person').then((val)=>{
      this.socket.emit('RequestJourneyRoute', val.PERSONID); //request al servidor con el parametro
    })

    this.socket.on('JourneyRouteData',(data)=>{
      this.JourneyRoute=data[0];

        this.socket.emit('RequestActiveOrders');
        this.socket.on('SelectActiveOrders',(data2)=>{
          this.lstActiveOrders = data2;
          for (var j = 0; j < this.lstActiveOrders.length; j++) {
            if(this.lstActiveOrders[j].JourneyId==this.JourneyRoute.JourneyId){
              this.Orders.push(this.lstActiveOrders[j]);
            }	  
          }
      });  
    })

    
    
  }


  ngOnInit(){
    
  }

  sendAlert(coment: string){
    let data={journeyid: this.JourneyRoute.JourneyId,  alerttype: "E", comment: coment, truckid: this.JourneyRoute.truckid ,date: moment().format('YYYY-MM-DD h:mm:ss')};
    // alert(data.journeyid+" "+data.alerttype+" "+data.comment+" "+data.truckid+" "+data.date);
    this.socket.emit('AppEmergencyNotification',data);

    let toast = this.toastCtrl.create({
                message: 'Su notificación ha sido enviada',
                duration: 10000
              });
    toast.present();

    this.setOrdersToPending();
    this.viewControl.dismiss();
    
  }

  setOrdersToPending(){
    

     console.log("num de ordenes"+this.Orders.length);
      for(var j=0;j<this.Orders.length;j++){
          // console.log("ordenes:"+this.Orders[j].DistributorId);
          if(this.Orders[j].OrderState=="En Proceso"){
            this.socket.emit('UpdateOrderState', {state: "Pendiente", orderid: this.Orders[j].OrderId});
          }
      }
  }

  

  close() {
    this.viewCtrl.dismiss();
  }
}


@Component({
  selector: 'maps-page',
  templateUrl: 'maps.html'
})

export class MapsPage implements OnInit {
  @ViewChild(GoogleMap) _GoogleMap: GoogleMap;
  // Manejo socket
//  messages: any = [];
  socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;
  //username: string;
  zone:any;
  lstUsers: any = [] ;
  lstJourneys: any = [] ;
  lstOrders: any=[];
  lstDistributors: any = [];
  lstRecyclingCenters: any = [];
  lstActiveOrders: any = [];
  JourneyRoute: any;
  steps: any = [];
  numMilestone: any = [];
  milestone: any=[];
  userMarker: any;
  distributorMarker: any = [];
  lstRoutePointAux:any=[];
  watch: any;
  current_user: any;
  Orders:any=[];
  lstRoutePoint:any=[];
  k: any=0;
  registrandoPosicion: boolean=false;
  flaglstRoute: boolean;
  flagButton:boolean;
  driverName:any;
  driverPhone:any;
  driverLastName:any;
  flagflag: boolean;
  routeItem:any=[];

  // Fin manejo socket
  map_model: MapsModel;
  constructor(
    public nav: NavController,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public GoogleMapsService: GoogleMapsService,
    public storage: Storage,
    public alertCtrl: AlertController,
    public popoverCtrl: PopoverController
  ) {
    this.socket=io.connect(this.socketHost);
    this.zone= new NgZone({enableLongStackTrace: false});
    this.geolocateMe();

    this.flagflag=true;
    // this.storage.get('person').then((aux)=>{
    //   this.ShowJourney(aux)
    // })
    //this.ShowJourney(1);
    this.map_model = new MapsModel();
    this.storage.get('person').then((valPerson)=>{
        this.driverName=valPerson.PERSONNAME,
        this.driverLastName=valPerson.PERSONLASTNAME,
        this.driverPhone=valPerson.PERSONPHONE
    });

    

    // Fin Manejo socket
    this.socketUpdate();


  }

  socketUpdate(){
     // Manejo socket
    
    this.socket.removeAllListeners();

    this.socket.emit('AppDataUsersRequest','ex app');
    this.socket.on('AppSelectUsers',(data)=>{
      this.lstUsers = data;
    });  
    
    this.socket.emit('SelectJourneys','ex app');
    this.socket.on('SelectJourneys',(data)=>{
      this.lstJourneys = data;
    });  
    
    this.socket.emit('SelectDistributors','ex app');
    this.socket.on('SelectDistributors',(data)=>{
      this.lstDistributors = data;
    });

    this.socket.emit('SelectRecyclingCenters','ex app');
    this.socket.on('SelectRecyclingCenters',(data)=>{
      this.lstRecyclingCenters = data;
    });  

    this.socket.emit('RequestActiveOrders');
    this.socket.on('SelectActiveOrders',(data)=>{
      this.lstActiveOrders = data;
    });  

    this.socket.emit('SelectJourneys','ex app');
    this.socket.on('SelectJourneys',(data)=>{
      this.lstJourneys = data;
    });  

    // recuperacion dato de storage
    this.storage.get('person').then((val)=>{
      this.socket.emit('RequestJourneyRoute', val.PERSONID); //request al servidor con el parametro
    });

    this.socket.on('JourneyRouteData',(data)=>{
      this.JourneyRoute=data[data.length-1];

    });
    // fin manejo socket  
  }

  ngOnInit() {
    let _loading = this.loadingCtrl.create();
    _loading.present();

    this._GoogleMap.$mapReady.subscribe(map => {
      this.map_model.init(map);
      _loading.dismiss();
    });
    this.socketUpdate();
    this.flagflag=true;
    // this.ShowJourney(); 
    // for(var i = 0; i < this.lstDistributors.length; i++){
    //   for(var j=0;j<this.Orders.length;j++){
    //     // this.lstDistributors[i].DistributorId==route[j]
    //     if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
    //       this.routeItem.push(this.lstDistributors[i]);
    //     }    
    //     }
    //   }  

    //   this.routeItem.reverse(); 
  }
  
  ionViewDidEnter() {
    // Use ngOnInit 

  }

  searchPlacesPredictions(query: string){
    let env = this;
    
    if(query !== "")
    {
      env.GoogleMapsService.getPlacePredictions(query).subscribe(
        places_predictions => {
          env.map_model.search_places_predictions = places_predictions;
        },
        e => {
          console.log('onError: %s', e);
        },
        () => {
          console.log('onCompleted');
        }
      );
    }else{
      env.map_model.search_places_predictions = [];
    }
  }

  beginJourney(){

    // var routeItem=[];
    var orderItem=[];
    var distributorPosition;
    var registrandoPosicion=false;
    
    // this.socketUpdate();

    if($('#btnBeginJourney').text()!="Pausar"){
      $('#btnBeginJourney').text("Pausar");

      //primera posicion antes de moverse
      var info1={
              position: this.userMarker.marker.getPosition(),
              user: this.current_user
            }

      this.socket.emit('AppTruckLocation',info1);
      //////////////////////////////////
      
      for(var i = 0; i < this.lstDistributors.length; i++){
      for(var j=0;j<this.Orders.length;j++){
        // this.lstDistributors[i].DistributorId==route[j]
        if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
          this.routeItem.push(this.lstDistributors[i]);
          if(this.Orders[j].OrderState=="En Proceso"){
            orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
            }
          }     

        }
      }

      

      this.routeItem.reverse(); 

      // console.log(routeItem.reverse());
      
      this.userMarker.marker.setIcon('./assets/images/maps/truckS.png');
       
       this.watch=Geolocation.watchPosition({enableHighAccuracy: true,maximumAge: 30000}).subscribe((position: Geoposition)=>{
        
        var ultimaPosicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
              this.userMarker.marker.setPosition(ultimaPosicion);
            var info={
              position: ultimaPosicion,
              user: this.current_user
            }

            // let penultimaPosicion=ultimaPosicion;
            //   if(google.maps.geometry.spherical.computeDistanceBetween(ultimaPosicion,distributorPosition) < 20){

            //   }

// /////////////////////////////////////////////////////////////////////////////////////

      if(!registrandoPosicion){
              registrandoPosicion=true;
              ultimaPosicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
               
             }else{
              
              
               var posicionActual = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
               if (google.maps.geometry.spherical.computeDistanceBetween(posicionActual, ultimaPosicion) > 20) { 
                 
                 ultimaPosicion = posicionActual;
                  this.userMarker.marker.setPosition(posicionActual);

                  this.sendPosition(ultimaPosicion);
                 
                  //  distributorPosition = new google.maps.LatLng(routeItem[routeItem.length-1].CoordX, routeItem[routeItem.length-1].CoordY);
                  //   if(google.maps.geometry.spherical.computeDistanceBetween(ultimaPosicion,distributorPosition) < 300){
                  //     this.socket.emit('NearNotification',routeItem[routeItem.length-1].DistributorName);
                  //     routeItem.pop();
           
                    // }
                  // Manejo socket
                  // console.log("apptrucklocation"+info);
                  this.socket=io.connect(this.socketHost);
                  this.zone= new NgZone({enableLongStackTrace: false});
                  // this.socket.emit('AppTruckLocation',info);
                  // this.markMilestone();
                  // Fin Manejo socket
               }
              
      }

      

// /////////////////////////////////////////////////////////////////////////////
              

              

             
      });
      
    }else{
        $('#btnBeginJourney').text("Iniciar Viaje");
        this.watch.unsubscribe();
        this.userMarker.marker.setIcon('./assets/images/maps/truck.png');
      }
  }

  setOrigin(location: google.maps.LatLng){
    let env = this;
    
    // Clean map
    env.map_model.cleanMap();
    
    env.map_model.map_options.clickableIcons=true;

    // Set the origin for later directions
    env.map_model.directions_origin.location = location;

    this.userMarker = env.map_model.myPosition(location, '#00e9d5');
    this.storage.get('user').then((User)=>{
      this.storage.get('person').then((Person)=>{
        this.current_user = {
            user: User,
            person: Person   
        }
      });
    });
    this.current_user = {
        user: this.storage.get('user'),
        person: this.storage.get('person')   
    }
    this.storage.get('user').then((user)=>{
      console.log('Bienvenido: '+ user.USEREMAIL);
    });

     if(this.flagflag==true)
    {
      this.flaglstRoute=true;
      this.flagflag=false;
    }

    this.lstRoutePointAux=this.lstRoutePoint;

    this.ShowJourney(location);


    
    // With this result we should find restaurants (*places) arround this location and then show them in the map

    // Now we are able to search *restaurants near this location
    // env.GoogleMapsService.getPlacesNearby(location).subscribe(
    //   nearby_places => {
    //     // Create a location bound to center the map based on the results
    //     let bound = new google.maps.LatLngBounds();

    //     for (var i = 0; i < nearby_places.length; i++) {
    //       bound.extend(nearby_places[i].geometry.location);
    //       env.map_model.addNearbyPlace(nearby_places[i]);
    //     }

    //     // Select first place to give a hint to the user about how this works
    //     env.choosePlace(env.map_model.nearby_places[3]);

    //     // To fit map with places
//bound.extend(nearby_places[i].geometry.location);
    //     env.map_model.map.fitBounds(bound);
    //   },
    //   e => {
    //     console.log('onError: %s', e);
    //   },
    //   () => {
    //     console.log('onCompleted');
    //   }
    // );
  }

  sendPosition(posactual: google.maps.LatLng){
    // var routeItem=[];
    // var orderItem=[];
    // var distributorPosition;
    // for(var i = 0; i < this.lstDistributors.length; i++){
    //   for(var j=0;j<this.Orders.length;j++){
    //     // this.lstDistributors[i].DistributorId==route[j]
    //     if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
    //       routeItem.push(this.lstDistributors[i]);
    //       if(this.Orders[j].OrderState=="En Proceso"){
    //         orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
    //         }
    //       }     

    //     }
    //   }

    //   routeItem.reverse();

    // console.log(this.userMarker.marker.getPosition().lat()+" "+this.userMarker.marker.getPosition().lng());
    // var info={
    //           position: this.userMarker.marker.getPosition(),
    //           user: this.current_user
    //         }

    //         distributorPosition = new google.maps.LatLng(routeItem[routeItem.length-1].CoordX, routeItem[routeItem.length-1].CoordY);
    //           if(google.maps.geometry.spherical.computeDistanceBetween(info.position,distributorPosition) < 300){
    //             this.socket.emit('NearNotification',routeItem[routeItem.length-1].DistributorName);
    //             routeItem.pop();
    //   //waypnts.push(distributorPosition);
    //         }

    //         // this.socket=io.connect(this.socketHost);
    //         // this.zone= new NgZone({enableLongStackTrace: false});
    //         this.markMilestone();
    //         this.socket.emit('AppTruckLocation',info);
    this.lstRoutePointAux=this.lstRoutePoint;
    //console.log(this.lstRoutePointAux.length);
    
    var orderItem=[];
    var distributorPosition;
    this.flagButton=false;
    // for(var i = 0; i < this.lstDistributors.length; i++){
    //   for(var j=0;j<this.Orders.length;j++){
    //     // this.lstDistributors[i].DistributorId==route[j]
    //     if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
    //       routeItem.push(this.lstDistributors[i]);
    //       if(this.Orders[j].OrderState=="En Proceso"){
    //         orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
    //         }
    //       }     

    //     }
    //   }

      // console.log(routeItem.reverse());

    //console.log(this.userMarker.marker.getPosition().lat()+" "+this.userMarker.marker.getPosition().lng());
    var info={
              position: posactual,
              // position: posactual,
              user: this.current_user
            }

            if(this.routeItem.length!=0){
              distributorPosition = new google.maps.LatLng(this.routeItem[this.routeItem.length-1].CoordX, this.routeItem[this.routeItem.length-1].CoordY);
              if(google.maps.geometry.spherical.computeDistanceBetween(info.position,distributorPosition) < 300){
                
                this.flagButton=true;
                //console.log(this.flagButton);
                this.socket.emit('NearNotification',this.routeItem[this.routeItem.length-1].DistributorName);
                console.log(this.routeItem.pop());
      //waypnts.push(distributorPosition);
              }else
              {
                console.log(this.flagButton);
              }
              
            }
            
            this.socketUpdate();
            //this.ShowJourney(info.position);
            this.setOrigin(info.position);


            // this.socket=io.connect(this.socketHost);
            // this.zone= new NgZone({enableLongStackTrace: false});
            this.socket.emit('AppTruckLocation',info);
           
    
  }


  sendPosition1(){
    // var routeItem=[];
    // var orderItem=[];
    // var distributorPosition;
    // for(var i = 0; i < this.lstDistributors.length; i++){
    //   for(var j=0;j<this.Orders.length;j++){
    //     // this.lstDistributors[i].DistributorId==route[j]
    //     if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
    //       routeItem.push(this.lstDistributors[i]);
    //       if(this.Orders[j].OrderState=="En Proceso"){
    //         orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
    //         }
    //       }     

    //     }
    //   }

    //   routeItem.reverse();

    // console.log(this.userMarker.marker.getPosition().lat()+" "+this.userMarker.marker.getPosition().lng());
    // var info={
    //           position: this.userMarker.marker.getPosition(),
    //           user: this.current_user
    //         }

    //         distributorPosition = new google.maps.LatLng(routeItem[routeItem.length-1].CoordX, routeItem[routeItem.length-1].CoordY);
    //           if(google.maps.geometry.spherical.computeDistanceBetween(info.position,distributorPosition) < 300){
    //             this.socket.emit('NearNotification',routeItem[routeItem.length-1].DistributorName);
    //             routeItem.pop();
    //   //waypnts.push(distributorPosition);
    //         }

    //         // this.socket=io.connect(this.socketHost);
    //         // this.zone= new NgZone({enableLongStackTrace: false});
    //         this.markMilestone();
    //         this.socket.emit('AppTruckLocation',info);
    this.lstRoutePointAux=this.lstRoutePoint;
    //console.log(this.lstRoutePointAux.length);
    
    var orderItem=[];
    var distributorPosition;
    this.flagButton=false;
    // for(var i = 0; i < this.lstDistributors.length; i++){
    //   for(var j=0;j<this.Orders.length;j++){
    //     // this.lstDistributors[i].DistributorId==route[j]
    //     if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
    //       routeItem.push(this.lstDistributors[i]);
    //       if(this.Orders[j].OrderState=="En Proceso"){
    //         orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
    //         }
    //       }     

    //     }
    //   }

      // console.log(routeItem.reverse());

    //console.log(this.userMarker.marker.getPosition().lat()+" "+this.userMarker.marker.getPosition().lng());
    
    var info={
              position: this.userMarker.marker.getPosition(),
              // position: posactual,
              user: this.current_user
            }

            if(this.routeItem.length!=0){
              distributorPosition = new google.maps.LatLng(this.routeItem[this.routeItem.length-1].CoordX, this.routeItem[this.routeItem.length-1].CoordY);
              if(google.maps.geometry.spherical.computeDistanceBetween(info.position,distributorPosition) < 300){
                
                this.flagButton=true;
                //console.log(this.flagButton);
                console.log(info.user);
                var mail=this.getEmail(this.routeItem[this.routeItem.length-1].PersonId);
                var data={
                  distributorName:this.routeItem[this.routeItem.length-1].DistributorName,
                  email: mail
                }
                this.socket.emit('NearNotification',data);
                console.log(this.routeItem.pop());
      //waypnts.push(distributorPosition);
              }else
              {
                console.log(this.flagButton);
              }
              
            }
            
            this.socketUpdate();
            //this.ShowJourney(info.position);
            this.setOrigin(info.position);


            // this.socket=io.connect(this.socketHost);
            // this.zone= new NgZone({enableLongStackTrace: false});
            this.socket.emit('AppTruckLocation',info);

            this.markMilestone();
           
    
  }

  getEmail(personId:any){
    for(var i=0; i<this.lstUsers.length;i++){
      if(this.lstUsers[i].user.PERSONID==personId){
        return this.lstUsers[i].user.USEREMAIL;
      }
    }
  }

  selectSearchResult(place: google.maps.places.AutocompletePrediction){
    let env = this;

    env.map_model.search_query = place.description;
    env.map_model.search_places_predictions = [];

    // We need to get the location from this place. Let's geocode this place!
    env.GoogleMapsService.geocodePlace(place.place_id).subscribe(
      place_location => {
        env.setOrigin(place_location);
      },
      e => {
        console.log('onError: %s', e);
      },
      () => {
        console.log('onCompleted');
      }
    );
  }

  clearSearch(){
    let env = this;
    Keyboard.close();
    // Clean map
    env.map_model.cleanMap();
  }

  geolocateMe(){


    this.socketUpdate();
    let env = this,
        _loading = env.loadingCtrl.create();

    _loading.present();

    
    Geolocation.getCurrentPosition().then((position) => {
      let current_location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      env.map_model.search_query = position.coords.latitude.toFixed(2) + ", " + position.coords.longitude.toFixed(2);
      env.setOrigin(current_location);
      env.map_model.using_geolocation = true;

      _loading.dismiss();
    }).catch((error) => {
      console.log('Error getting location', error);
      _loading.dismiss();
    });
  }

  choosePlace(place: MapPlace){
    let env = this;

    // Check if the place is not already selected
    if(!place.selected)
    {
      // De-select previous places
      env.map_model.deselectPlaces();
      // Select current place
      place.select();

      // Get both route directions and distance between the two locations
      let directions_observable = env.GoogleMapsService
            .getDirections(env.map_model.directions_origin.location, place.location),
          distance_observable = env.GoogleMapsService
            .getDistanceMatrix(env.map_model.directions_origin.location, place.location);

      Observable.forkJoin(directions_observable, distance_observable).subscribe(
        data => {
          let directions = data[0],
              distance = data[1].rows[0].elements[0].distance.text,
              duration = data[1].rows[0].elements[0].duration.text;

          env.map_model.directions_display.setDirections(directions);

          let toast = env.toastCtrl.create({
                message: 'That\'s '+distance+' away and will take '+duration,
                duration: 3000
              });
          toast.present();
        },
        e => {
          console.log('onError: %s', e);
        },
        () => {
          console.log('onCompleted');
        }
      );
    }
  }

  // ShowJourney(location: google.maps.LatLng){
  //   let env=this;
  //   //let bound = new google.maps.LatLngBounds();
  //   var route;
  //   var recyclerId;
  //   var recycler;
  //   var routeItem=[];
  //   var orderItem=[];
  //   var routeItemOrder=[];
  //   this.Orders=[];
  //   // var Orders=[];
  //   var waypnts=[];

  //   var ObjJourney;
  //   ObjJourney=this.lstJourneys[0];
    
  //   for (var j = 0; j < this.lstActiveOrders.length; j++) {
  //     if(this.lstActiveOrders[j].JourneyId==this.JourneyRoute.JourneyId){
  //       this.Orders.push(this.lstActiveOrders[j]);
  //     }	  
  //   }
  //   console.log(this.Orders);

  //   recyclerId=this.JourneyRoute.recyclingcenterid;
  //   route=this.JourneyRoute.JourneyRoute.split(',');
  //   //alert(route.length);

  //   console.log(route.length);
  //   var distributorPosition;
  //   // var distributorPosition1 = new google.maps.LatLng(this.lstDistributors[0].CoordX, this.lstDistributors[0].CoordY);
  //   //bound.extend(distributorPosition);
  //   // var limits = new google.maps.LatLngBounds(distributorPosition,location);
  //   // env.map_model.map.fitBounds(limits);
  //       env.map_model.map.setCenter(location);
  //       env.map_model.map.setZoom(11);
  //   // limits.extend(current_location);
  //     // for(var j=0;j<this.lstActiveOrders.length;j++){
  //     //   if(this.lstActiveOrders[j].JourneyId==this.lstJourneys[i].JourneyId){
  //     //     Orders.push(this.lstActiveOrders[j]);
  //     //   }
  //     // }
  //   // for(var i=0;i<this.lstDistributors.length;i++){
  //   //   distributorPosition = new google.maps.LatLng(this.lstDistributors[i].CoordX, this.lstDistributors[i].CoordY);
  //   //   this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5');
  //   // }
      
  //   for(var i = 0; i < this.lstDistributors.length; i++){
  //     for(var j=0;j<this.Orders.length;j++){
  //       // this.lstDistributors[i].DistributorId==route[j]
  //       if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
  //         routeItem.push(this.lstDistributors[i]);
  //         if(this.Orders[j].OrderState=="En Proceso"){
  //           orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
  //         }
  //       }     
        
  //       //Obtener ordenes con estado En proceso

  //       // for (var k = 0; k < Orders.length; k++) {
 	// 			// 	if(this.lstDistributors[i].DistributorId==Orders[k].DistributorId){
 	// 			// 		routeItemOrder.push(Orders[k].OrderQuantity)
 	// 			// 	}
 	// 		  // }
  //     }
  //   }
  //             console.log(orderItem);

  //   for(var i=0;i<this.lstRecyclingCenters.length;i++){
  //     if(this.lstRecyclingCenters[i].RecyclingCenterId==recyclerId){
  //         recycler=this.lstRecyclingCenters[i];
  //       }
  //   }

    
  //   for(var i=0;i<routeItem.length;i++){
  //     distributorPosition = new google.maps.LatLng(routeItem[i].CoordX, routeItem[i].CoordY);
  //     let content = '<h4>'+routeItem[i].DistributorName+'</h4><p>'+routeItem[i].DistributorAddress+'</p><p> Telf: '+routeItem[i].DistributorPhone+'</p><p>Stock disponible: <input type="text" id="textQuantity" size="5" maxlength="3" value='+this.Orders[i].OrderQuantity+'> </p>';
  //     this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5', content,this.Orders[i].OrderState,this.Orders[i].OrderId,this.nav,this.flagButton,this.Orders[i].OrderQuantity);
  //     //waypnts.push(distributorPosition);
  //   }

  //   // for(var i=0;i<orderItem.length;i++){
  //   //   distributorPosition = new google.maps.LatLng(orderItem[i].CoordX, orderItem[i].CoordY);
  //   //   let content = '<h4>'+orderItem[i].DistributorName+'</h4><p>'+orderItem[i].DistributorAddress+'</p><p> Telf: '+orderItem[i].DistributorPhone+'</p><p>Stock disponible: '+this.Orders[i].OrderQuantity+' </p>';
  //   //   this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5', content,"Completado");
  //   //   //waypnts.push(distributorPosition);
  //   // }

  //     var recyclerPosition=new google.maps.LatLng(recycler.CoordX, recycler.CoordY);
  //     let recyclerContent='<h4>'+recycler.RecyclingCenterName+'</h4><p>'+recycler.RecyclingCenterAddress+'</p><p> Telf: '+recycler.RecyclingCenterPhone+'</p>';
  //     var recyclerMarker = env.map_model.addRecyclingCenter(recyclerPosition, '#00e9d5', recyclerContent);

  //   //====================================================================================
  //   for (var i = 0; i < orderItem.length; i++) {
      
	// 		waypnts.push({
	// 			location: new google.maps.LatLng(orderItem[i].CoordX,orderItem[i].CoordY),
	// 			stopover: true 
	// 		});
  //     // console.log(waypnts[i]);
	// 	}
  //   this.SortRoute(location,waypnts);
  //   console.log(waypnts);

  //   let directions_observable = env.GoogleMapsService.getDirectionsWaypoints(location, recyclerPosition, waypnts),
  //       distance_observable = env.GoogleMapsService.getDistanceMatrix(location, recyclerPosition);

  //    Observable.forkJoin(directions_observable, distance_observable).subscribe(
  //       data => {
  //         let directions = data[0],
  //             // distance1 = data[1].rows[0].elements[0].distance.text,
  //             distance=data[0].routes[0].legs[0].distance.text,            
  //             //distance2= data[1].rows[0].elements[0].distance.text,         
  //             duration = data[0].routes[0].legs[0].duration.text;
  //             for(var i=0;i<data[0].routes[0].legs[0].steps.length;i++){
  //               var cad=data[0].routes[0].legs[0].steps[i].instructions;
  //               while(cad.includes("<b>")==true)
  //               {
  //                   cad=cad.replace("<b>","");
  //               }  
  //               while(cad.includes("</b>")==true)
  //               {
  //                   cad=cad.replace("</b>","");
  //               } 
  //               //console.log(cad+" "+i);
  //               //this.steps.push(data[0].routes[0].legs[0].steps[i].instructions);
  //               this.steps.push(cad);
  //             }

  //         env.map_model.directions_display.setDirections(directions);
  //         // env.map_model.map.setOptions()
          
  //         let toast = env.toastCtrl.create({
  //               message: 'La distancia es '+distance+' y le tomará '+duration,
  //               duration: 5000
  //             });
  //         toast.present();
  //         console.log(this.steps);
  //         //this.presentPopover(steps) ;
  //         this.lstRoutePoint=[]; 
  //         this.numMilestone = data[0].routes[0];
  //         for (var j = 0; j < this.numMilestone.legs.length; j++) {
  //           this.milestone = data[0].routes[0].legs[j];
  //            for (var i = 0; i < this.milestone.steps.length; i++) {
  //              this.lstRoutePoint.push(env.map_model.addMilestone(this.milestone.steps[i].start_location,this.milestone.steps[i].instructions));
  //            }
  //         }

  //         if(this.flaglstRoute==false)
  //         {
  //             if(this.OtherRoute(this.lstRoutePoint[1].marker.getPosition().lat(),this.lstRoutePointAux[1].marker.getPosition().lat(),this.lstRoutePoint[1].marker.getPosition().lng(),this.lstRoutePointAux[1].marker.getPosition().lng()))
  //             {
  //                 // alert("Se desvio");
  //                 let data={
  //                   name:this.driverName + this.driverLastName,
  //                   phone:this.driverPhone
  //                 }
  //                 console.log(data);
  //                 this.socket.emit('DeviationNotification',data);
  //             }
  //             else
  //             {
  //                 // alert("No se desvio");
  //             }
  //         }
  //         this.flaglstRoute=false;

  //         // this.lstRoutePoint.reverse();
  //         // console.log("numero de hitos "+this.lstRoutePoint.length);

  //       },
  //       e => {
  //         console.log('onError: %s', e);
  //       },
  //       () => {
  //         console.log('onCompleted');
  //       }
  //     );
    
	// 	//env.map_model.calculateAndDisplayRoute(location, recycler, waypnts);

  // }

  ShowJourney(location: google.maps.LatLng){
    //this.socketUpdate();
    //this.socketUpdate();
    let env=this;
    
    
    //let bound = new google.maps.LatLngBounds();
    
    var route;
    var recyclerId;
    var recycler;
    var routeItem=[];
    var orderItem=[];
    var routeItemOrder=[];
    this.Orders=[];
    // var Orders=[];
    var waypnts=[];
    var ObjJourney;
    
    ObjJourney=this.lstJourneys[0];
    this.socketUpdate();
    for (var j = 0; j < this.lstActiveOrders.length; j++) {
      if(this.lstActiveOrders[j].JourneyId==this.JourneyRoute.JourneyId){
        this.Orders.push(this.lstActiveOrders[j]);
      }	  
    }
    console.log(this.Orders);

    recyclerId=this.JourneyRoute.recyclingcenterid;
    route=this.JourneyRoute.JourneyRoute.split(',');
    //alert(route.length);

    console.log(route.length);
    var distributorPosition;
    // var distributorPosition1 = new google.maps.LatLng(this.lstDistributors[0].CoordX, this.lstDistributors[0].CoordY);
    //bound.extend(distributorPosition);
    // var limits = new google.maps.LatLngBounds(distributorPosition,location);
    // env.map_model.map.fitBounds(limits);
        env.map_model.map.setCenter(location);
        env.map_model.map.setZoom(11);
    // limits.extend(current_location);
      // for(var j=0;j<this.lstActiveOrders.length;j++){
      //   if(this.lstActiveOrders[j].JourneyId==this.lstJourneys[i].JourneyId){
      //     Orders.push(this.lstActiveOrders[j]);
      //   }
      // }
    // for(var i=0;i<this.lstDistributors.length;i++){
    //   distributorPosition = new google.maps.LatLng(this.lstDistributors[i].CoordX, this.lstDistributors[i].CoordY);
    //   this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5');
    // }
      
    for(var i = 0; i < this.lstDistributors.length; i++){
      for(var j=0;j<this.Orders.length;j++){
        // this.lstDistributors[i].DistributorId==route[j]
        if(this.lstDistributors[i].DistributorId==this.Orders[j].DistributorId){
          
          routeItem.push(this.lstDistributors[i]);
          if(this.Orders[j].OrderState=="En Proceso"){
            orderItem.push(this.lstDistributors[i]);//contiene solo ordenes que aun no han sido completadas
          }
        }     
        
        //Obtener ordenes con estado En proceso

        // for (var k = 0; k < Orders.length; k++) {
 				// 	if(this.lstDistributors[i].DistributorId==Orders[k].DistributorId){
 				// 		routeItemOrder.push(Orders[k].OrderQuantity)
 				// 	}
 			  // }
      }
    }
              //console.log(orderItem);

    for(var i=0;i<this.lstRecyclingCenters.length;i++){
      if(this.lstRecyclingCenters[i].RecyclingCenterId==recyclerId){
          recycler=this.lstRecyclingCenters[i];
        }
    }

    
    for(var i=0;i<routeItem.length;i++){
      distributorPosition = new google.maps.LatLng(routeItem[i].CoordX, routeItem[i].CoordY);           
      // alert(this.Orders[i].OrderQuantity);
      let content = '<h4>'+routeItem[i].DistributorName+'</h4><p>'+routeItem[i].DistributorAddress+'</p><p> Telf: '+routeItem[i].DistributorPhone+'</p><p>Stock disponible: <input type="text" id="textQuantity" size="5" maxlength="3" value='+this.Orders[i].OrderQuantity+'> </p>';
      //this.sendPosition();
      //var bandera=this.flagButton;
      //alert(bandera+" Antes de arreglo");
      
      this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5', content,this.Orders[i],this.nav,this.flagButton);
      
      //waypnts.push(distributorPosition);
    }
    
    // alert(this.flagConfirm);
    // if(this.flagConfirm==true)
    // {
    //   this.socketUpdate();
    //   this.flagConfirm=false;
    // }
    // for(var i=0;i<orderItem.length;i++){
    //   distributorPosition = new google.maps.LatLng(orderItem[i].CoordX, orderItem[i].CoordY);
    //   let content = '<h4>'+orderItem[i].DistributorName+'</h4><p>'+orderItem[i].DistributorAddress+'</p><p> Telf: '+orderItem[i].DistributorPhone+'</p><p>Stock disponible: '+this.Orders[i].OrderQuantity+' </p>';
    //   this.distributorMarker[i] = env.map_model.addPlaceToMap(distributorPosition, '#00e9d5', content,"Completado");
    //   //waypnts.push(distributorPosition);
    // }

      var recyclerPosition=new google.maps.LatLng(recycler.CoordX, recycler.CoordY);
      let recyclerContent='<h4>'+recycler.RecyclingCenterName+'</h4><p>'+recycler.RecyclingCenterAddress+'</p><p> Telf: '+recycler.RecyclingCenterPhone+'</p>';
      var recyclerMarker = env.map_model.addRecyclingCenter(recyclerPosition, '#00e9d5', recyclerContent);

    //====================================================================================
    for (var i = 0; i < orderItem.length; i++) {
      
			waypnts.push({
				location: new google.maps.LatLng(orderItem[i].CoordX,orderItem[i].CoordY),
				stopover: false 
			});
      // console.log(waypnts[i]);
		}
    console.log(location.lat()+" "+location.lng());
    this.SortRoute(location,waypnts);
    //console.log(waypnts);

    let directions_observable = env.GoogleMapsService.getDirectionsWaypoints(location, recyclerPosition, waypnts),
        distance_observable = env.GoogleMapsService.getDistanceMatrix(location, recyclerPosition);
    
     Observable.forkJoin(directions_observable, distance_observable).subscribe(
        data => {
          let directions = data[0],
              //distance = data[1].rows[0].elements[0].distance.text,
              distance=data[0].routes[0].legs[0].distance.text,            
              //distance2= data[1].rows[0].elements[0].distance.text,         
              duration = data[0].routes[0].legs[0].duration.text;
              for(var i=0;i<data[0].routes[0].legs[0].steps.length;i++){
                var cad=data[0].routes[0].legs[0].steps[i].instructions;
                while(cad.includes("<b>")==true)
                {
                    cad=cad.replace("<b>","");
                }  
                while(cad.includes("</b>")==true)
                {
                    cad=cad.replace("</b>","");
                } 
                //console.log(cad+" "+i);
                //this.steps.push(data[0].routes[0].legs[0].steps[i].instructions);
                this.steps.push(cad);
              }

          env.map_model.directions_display.setDirections(directions);
          // env.map_model.map.setOptions()
          
          let toast = env.toastCtrl.create({
                message: 'La distancia es '+distance+' y le tomará '+duration,
                duration: 5000
              });
          toast.present();
          //console.log(this.steps);
          //this.presentPopover(steps) ;
          this.lstRoutePoint=[]; 
          this.numMilestone = data[0].routes[0];
          for (var j = 0; j < this.numMilestone.legs.length; j++) {
            this.milestone = data[0].routes[0].legs[j]; //Lista de puntos de control 
             for (var i = 0; i < this.milestone.steps.length; i++) {
               this.lstRoutePoint.push(env.map_model.addMilestone(this.milestone.steps[i].start_location,this.milestone.steps[i].instructions));
               
             }
          }

          this.lstRoutePoint.reverse();


          if(this.flaglstRoute==false)
          {
              if(this.OtherRoute(this.lstRoutePoint[1].marker.getPosition().lat(),this.lstRoutePointAux[1].marker.getPosition().lat(),this.lstRoutePoint[1].marker.getPosition().lng(),this.lstRoutePointAux[1].marker.getPosition().lng()))
              {
                  // alert("Se desvio");
                  let data={
                    name:this.driverName + this.driverLastName,
                    phone:this.driverPhone
                  }
                  console.log(data);
                  this.socket.emit('DeviationNotification',data);
              }
              else
              {
                  // alert("No se desvio");
              }
          }
          this.flaglstRoute=false;
        },
        e => {
          console.log('onError: %s', e);
        },
        () => {
          console.log('onCompleted');
        }
      );
    
		//env.map_model.calculateAndDisplayRoute(location, recycler, waypnts);
    
  }

  

  SortRoute(reference,rt){
    
   var x1= new google.maps.LatLng(reference.lat(),reference.lng());
   console.log("X1 "+x1);
   var RouteInGoAux = [];
   var i;
   var j;
   for (i=0; i<rt.length; i++){
     for (j=0 ; j<rt.length - 1; j++){
       console.log(rt[j].CoordX);
       console.log("X1");
       console.log(x1);
       //console.log("new google.maps.LatLng(rt[j].CoordX,rt[j].CoordY) ");
       console.log("Distancia 1 "+google.maps.geometry.spherical.computeDistanceBetween(x1,rt[j].location))
       console.log("Distancia 2 "+google.maps.geometry.spherical.computeDistanceBetween(x1,rt[j+1].location))
     if (google.maps.geometry.spherical.computeDistanceBetween(x1,rt[j].location) 
         > google.maps.geometry.spherical.computeDistanceBetween(x1,rt[j+1].location)){
         var temp = rt[j];
         rt[j] = rt[j+1];
         rt[j+1] = temp;
         console.log("rt length "+rt.length);
       }
     }
   }
 }

  OtherRoute(x1:any,x2:any,y1:any,y2:any) : Boolean
  {
    if(x1!=x2||y1!=y2)
      return true;
    else
    {
      //console.log("falsooo");
      return false;
    }
  }

  markMilestone(){
    var DistanciaLng;
    console.log("Antes");
    console.log("K= "+this.k)
    // for (var i = 0; i < this.lstRoutePoint.length; i++) {
      for(var i=0;i<this.lstRoutePoint.length;i++){
        console.log(i+"  "+this.lstRoutePoint[i].marker.getPosition().lat()+" "+this.lstRoutePoint[i].marker.getPosition().lng())
      }
      DistanciaLng=google.maps.geometry.spherical.computeDistanceBetween(this.userMarker.marker.getPosition(),this.lstRoutePoint[this.lstRoutePoint.length-1].marker.getPosition());
      console.log("distancia");
      console.log(DistanciaLng);
      if(DistanciaLng < 200){
        this.lstRoutePoint[this.lstRoutePoint.length-1].marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: 'green',
          fillOpacity: 3, 
          scale: 3,
          strokeWeight: 1
        });
        this.k++;
        // break;
         this.lstRoutePoint.pop();
         console.log("Hito marcado");
         console.log("K= "+this.k)
         for(var i=0;i<this.lstRoutePoint.length;i++){
           console.log(i+"  "+this.lstRoutePoint[i].marker.getPosition().lat()+" "+this.lstRoutePoint[i].marker.getPosition().lng())
         }
        //  console.log(this.lstRoutePoint.length);
      }
    // }
  }
  sendToRecycler(location: google.maps.LatLng){

    let env=this;
    //let bound = new google.maps.LatLngBounds();
    var route;
    var recyclerId;
    var recycler;
    var routeItem=[];
    var routeItemOrder=[];
    
    var waypnts=[];
    recyclerId=this.JourneyRoute.recyclingcenterid;

    for(var i=0;i<this.lstRecyclingCenters.length;i++){
      if(this.lstRecyclingCenters[i].RecyclingCenterId==recyclerId){
          recycler=this.lstRecyclingCenters[i];
        }
    }
     var recyclerPosition=new google.maps.LatLng(recycler.CoordX, recycler.CoordY);
      let recyclerContent='<h4>'+recycler.RecyclingCenterName+'</h4><p>'+recycler.RecyclingCenterAddress+'</p><p> Telf: '+recycler.RecyclingCenterPhone+'</p>';
      var recyclerMarker = env.map_model.addRecyclingCenter(recyclerPosition, '#00e9d5', recyclerContent);

     let directions_observable = env.GoogleMapsService.getDirectionsWaypoints(location, recyclerPosition, waypnts),
        distance_observable = env.GoogleMapsService.getDistanceMatrix(location, recyclerPosition);

     Observable.forkJoin(directions_observable, distance_observable).subscribe(
        data => {
          let directions = data[0],
              //distance = data[1].rows[0].elements[0].distance.text,
              distance=data[0].routes[0].legs[0].distance.text,            
              //distance2= data[1].rows[0].elements[0].distance.text,         
              duration = data[0].routes[0].legs[0].duration.text;             
              for(var i=0;i<data[0].routes[0].legs[0].steps.length;i++){
                this.steps.push(data[0].routes[0].legs[0].steps[i].instructions); 
              }

          env.map_model.directions_display.setDirections(directions);
          

          let toast = env.toastCtrl.create({
                message: 'La distancia es '+distance+' y le tomará '+duration,
                duration: 10000
              });
          toast.present();
          console.log(this.steps);
          //this.presentPopover(steps) ; 
        },
        e => {
          console.log('onError: %s', e);
        },
        () => {
          console.log('onCompleted');
        }
      );
  }

  // presentPopover() {
  //   let popover = this.popoverCtrl.create(MyPopOverPage);
  //   popover.present();
  // }

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage, {steps: this.steps});
    
    popover.present({
      
      ev: myEvent
    });

  }

  setOrdersToPending(){
    this.socketUpdate();

     console.log("num de ordenes"+this.Orders.length);
      for(var j=0;j<this.Orders.length;j++){
          // console.log("ordenes:"+this.Orders[j].DistributorId);
          if(this.Orders[j].OrderState=="En Proceso"){
            this.socket.emit('UpdateOrderState', {state: "Pendiente", orderid: this.Orders[j].OrderId});
          }
      }
  }

  setEmergency(myEvent){
    
    let alert = this.alertCtrl.create({
          title: 'CONFIRMACIÓN',
          subTitle: '¿Está seguro de enviar un mensaje de alerta por emergencia? Esto cancelará sus ordenes no completadas.',
            buttons: [
              {
                text: 'Cancelar',
                handler: () => {
                  
                }
              },
              {
                text: 'Confirmar',
                handler: () => {
                  let env = this,
                  _loading = env.loadingCtrl.create();
                  _loading.present();
                  let popover = this.popoverCtrl.create(PopoverPageEmergency);
                  popover.present({
                    ev: myEvent
                  });

                  Geolocation.getCurrentPosition().then((position) => {
                    let current_location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    env.map_model.search_query = position.coords.latitude.toFixed(2) + ", " + position.coords.longitude.toFixed(2);
                    this.sendToRecycler(current_location);
                    env.map_model.using_geolocation = true;

                    _loading.dismiss();
                  }).catch((error) => {
                    console.log('Error getting location', error);
                    _loading.dismiss();
                  });
                }
              }
            ]
    
    });

   
    alert.present();

    
 
  }

  setFullTruck(){

    let alert = this.alertCtrl.create({
          title: 'CONFIRMACIÓN',
          subTitle: '¿Está seguro de enviar la alerta? Esto cancelará sus ordenes no completadas y lo enviará directamente al centro de reciclaje.',
            buttons: [
              {
                text: 'Cancelar',
                handler: () => {
                  
                }
              },
              {
                text: 'Confirmar',
                handler: () => {
                 //var moment = require('moment');
                  let env = this,
                      _loading = env.loadingCtrl.create();
                      _loading.present();
                  let data={journeyid: this.JourneyRoute.JourneyId,  alerttype: "CL", comment: "Camion Lleno", truckid: this.JourneyRoute.truckid ,date: moment().format('YYYY-MM-DD h:mm:ss')};
                  // alert(data.journeyid+" "+data.alerttype+" "+data.comment+" "+data.truckid+" "+data.date);
                  this.socket.emit('AppFullNotification',data);

                  let toast = this.toastCtrl.create({
                              message: 'Su notificación ha sido enviada',
                              duration: 10000
                            });
                  toast.present();
                  this.setOrdersToPending();

                  Geolocation.getCurrentPosition().then((position) => {
                    let current_location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    env.map_model.search_query = position.coords.latitude.toFixed(2) + ", " + position.coords.longitude.toFixed(2);
                    this.sendToRecycler(current_location);
                    // this.ShowJourney(current_location);
                    env.map_model.using_geolocation = true;

                    _loading.dismiss();
                  }).catch((error) => {
                    console.log('Error getting location', error);
                    _loading.dismiss();
                  });
                }
              }
            ]
    
    });
    
    alert.present();
    
    

  }


}