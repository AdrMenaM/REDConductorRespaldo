import { Component, NgZone,ViewChild, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController, PopoverController, NavParams, ViewController, Events, Content, Button, Icon, Img } from 'ionic-angular';
import { Keyboard, Geolocation,Geoposition} from 'ionic-native';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import { GoogleMap } from "../../components/google-map/google-map";
import { GoogleMapsService } from "./maps.service";

import * as io from 'socket.io-client';
import { Storage } from '@ionic/storage';
import * as $ from 'jquery';
import * as moment from 'moment';
import { SignatureForm } from '../signatureForm/signature-form';
import { MapsPage, PopoverPage, PopoverPageEmergency} from './maps';

export class MapsModel {
  map: google.maps.Map;
	marker: google.maps.Marker;
	map_options: google.maps.MapOptions = {
    center: {lat: 40.785091, lng: -73.968285},
    zoom: 13,
    disableDefaultUI: true
  };

	socketHost: string = 'http://34.195.35.232:8080/';
  socket:any;

	map_places: Array<MapPlace> = [];

	search_query: string = '';
	search_places_predictions: Array<google.maps.places.AutocompletePrediction> = [];

	nearby_places: Array<MapPlace> = [];

	directions_origin: MapPlace = new MapPlace();
	directions_display: google.maps.DirectionsRenderer;
	directions_service: google.maps.DirectionsService;
	directions_request: google.maps.DirectionsRequest;
	directions_result: google.maps.DirectionsResult;
	directions_status: google.maps.DirectionsStatus;
	map_polyline: google.maps.Polyline;
	// alertCtrl: AlertController


	constructor(){
		
		this.socket=io.connect(this.socketHost);
		
	}

	
	
  // directionsDisplay = new google.maps.DirectionsRenderer({
  //           map: this.map
  //       })

	using_geolocation: boolean = false;

	// https://developers.google.com/maps/documentation/javascript/reference#Map
	init(map: google.maps.Map) {
		this.map = map;
		// this.map.
		// https://developers.google.com/maps/documentation/javascript/reference#DirectionsRenderer
		this.directions_display = new google.maps.DirectionsRenderer({
			map: this.map,
			suppressMarkers: true,
			preserveViewport: true
		});
	}

	cleanMap() {
		// Empty nearby places array
		this.nearby_places = [];

		// To clear previous directions
		this.directions_display.setDirections({routes: []});

		// To remove all previous markers from the map
		this.map_places.forEach((place) => {
      place.marker.setMap(null);
    });

		// Empty markers array
		this.map_places = [];

		this.using_geolocation = false;
	}
	myPosition(location: google.maps.LatLng, color: string = '#333333') : MapPlace {
		this.map.setCenter(location);
		let _map_place = new MapPlace();

		_map_place.location = location;
		_map_place.marker = new google.maps.Marker({
      position: location,
      map: this.map,
			draggable: true,
      icon: './assets/images/maps/truck.png'
    });

		this.map_places.push(_map_place);

		return _map_place;
	}
addPlaceToMap(location: google.maps.LatLng, color: string = '#333333', contnt: string, order:any, nav:NavController, flagButton: boolean) : MapPlace {
		let _map_place = new MapPlace();
		
		//<ion-icon name="clipboard"></ion-icon>
		let buttonConfirmSign=`<ion-grid>
          <ion-row>
            <ion-col>
              <button id="ButtonConfirm" style="color:white;background-color:#D3170B">
                <div>
                  <ion-grid>
                    <ion-row>
                      <ion-col>
                       
                      </ion-col>
                      <ion-col>
                        <label>CONFIRMAR</label>
                        
                      </ion-col>
                    </ion-row>
                  </ion-grid>
                </div>
              </button>
            </ion-col>
            <ion-col>
              <button id="ButtonSign" *ngIf="flagButton" style="color:white;background-color:#D3170B">
                  <div>
                  <ion-grid>
                    <ion-row>
                      <ion-col>
                    <ion-icon name="create"></ion-icon>
                    </ion-col>
                      <ion-col>
                    <label>FIRMAR</label>
                    </ion-col>
                    </ion-row>
                  </ion-grid>
                  </div>
              </button>
            </ion-col>
          </ion-row>
        </ion-grid>`;
		_map_place.location = location;
		if(order.OrderState=="Completado"){
			_map_place.marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: './assets/images/maps/dListo.png',
				/*title:[
						buttonConfirmSign.toString()
				].join(""),*/
    	});
		}else{
		_map_place.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: './assets/images/maps/dPendiente.png',
			/*title:[
						buttonConfirmSign.toString()
				].join(""),*/
    });
		var infoWindow = new google.maps.InfoWindow({content: contnt}); //infoWindow.open(_map_place.marker.get('map'), _map_place.marker);
		//_map_place.marker.addListener('click', ()=>{let infoWindow = new google.maps.InfoWindow({content: ""}); infoWindow.open(_map_place.marker.get('map'), _map_place.marker) });
		_map_place.marker.addListener('click',()=>{
			//this.map_page.sendPosition();
			infoWindow.open(_map_place.marker.get('map'), _map_place.marker);//alert('hola2')
			
			if(order.OrderState!="Completado")
			{
				infoWindow.setContent(contnt+buttonConfirmSign);
			}
			else
			{
				// alert("esta lejos");
				infoWindow.setContent(contnt);
			}
		});
		google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
			var btnSign,btnConfirm;

			btnSign=document.getElementById('ButtonSign');
			if(btnSign)
			{
							btnSign.addEventListener('click', () => {
							//alert(num_order);
							this.goToSignaturePad(order.OrderId,nav);
						});
			}			
	  	btnConfirm=document.getElementById('ButtonConfirm');
			if(btnConfirm)
			{
				btnConfirm.addEventListener('click', () => {
//////////////////////////////////////////////////////////////////////
				


///////////////////////////////////////////////////////////////////////

				var cantidad,cant;
										cantidad=document.getElementById('textQuantity');
										
										if(cantidad)
										{
											// 	alert("Si encontro");
												cant=$('#textQuantity').val();
										}
										
										let data={orderid:order.OrderId,quantity:cant};
										//alert(data.orderid+" "+data.quantity);
										this.socket.emit('UpdateOrderQuantity',data);
					// orderQty=cant;

					alert("Cantidad confirmada");
					
      	});
			}		
						// $('input#textQuantity').on('change',function(){
    				// 	var valor = $(this).val();
   					//  	alert(valor);
						// });
						
		});
		//HTMLDocument.getElementById("firmar").addEventListener('click',function(){infoWindow.getPosition()});
		this.map_places.push(_map_place);
		
		return _map_place;
	}}
	addRecyclingCenter(location: google.maps.LatLng, color: string = '#333333', contnt: string) : MapPlace {
		let _map_place = new MapPlace();

		_map_place.location = location;
		_map_place.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: './assets/images/maps/recycle.png'
    });

		_map_place.marker.addListener('click', ()=>{let infoWindow = new google.maps.InfoWindow({content: contnt}); infoWindow.open(_map_place.marker.get('map'), _map_place.marker) });


		this.map_places.push(_map_place);



		return _map_place;
	}

	goToSignaturePad( orderId: any, nav:NavController){
    
		nav.push(SignatureForm, {OrderId: orderId});
  }

	addMilestone(location: google.maps.LatLng, contnt: string) : MapPlace {
		let _map_place = new MapPlace();

		_map_place.location = location;
		_map_place.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: {
               path: google.maps.SymbolPath.CIRCLE,
               fillColor: 'red',
               fillOpacity: 3,
               scale: 3,
               strokeWeight: 1
             }
    });
		var currentInfoWindow = null;
		_map_place.marker.addListener('click', ()=>{let infoWindow = new google.maps.InfoWindow({content: contnt}); 
			
			if (currentInfoWindow != null) { 
        currentInfoWindow.close(); 
			}
			infoWindow.open(_map_place.marker.get('map'), _map_place.marker); 
			currentInfoWindow = infoWindow; 
		});


		this.map_places.push(_map_place);



		return _map_place;
	}

	// addNearbyPlace(place_result: google.maps.places.PlaceResult) {
	// 	let _map_place = this.addPlaceToMap(place_result.geometry.location, '#666666');

	// 	// This is an extra attribute for nearby places only
	// 	_map_place.details = place_result;
  //   let getRandom = (min:number, max:number) : number => {
  //     return Math.floor(Math.random() * (max - min + 1) + min);
  //   };
  //   // Add a random image
	// 	_map_place.details["image"] = "./assets/images/maps/place-"+getRandom(1, 9)+".jpg";

	// 	this.nearby_places.push(_map_place);
	// }

	deselectPlaces() {
		this.nearby_places.forEach((place) => {
      place.deselect();
    });
	}
}

export class MapPlace {
	marker: google.maps.Marker;
	location: google.maps.LatLng;
	selected: boolean = false;
	// This is an extra attribute for nearby places only
	details: google.maps.places.PlaceResult;

	// https://developers.google.com/maps/documentation/javascript/reference#Symbol
	static createIcon(color: string) : google.maps.Symbol {
    let _icon: google.maps.Symbol = {
      path: "M144 400c80 0 144 -60 144 -134c0 -104 -144 -282 -144 -282s-144 178 -144 282c0 74 64 134 144 134zM144 209c26 0 47 21 47 47s-21 47 -47 47s-47 -21 -47 -47s21 -47 47 -47z",
      fillColor: color,
      fillOpacity: .6,
      anchor: new google.maps.Point(0,0),
      strokeWeight: 0,
      scale: 0.08,
      rotation: 180
    }
    return _icon;
  }

	setIcon(color: string) : void {
		this.marker.setIcon(MapPlace.createIcon(color));
	}

	deselect() {
		this.selected = false;
    this.setIcon('#666666');
	}

	select() {
		this.selected = true;
    this.setIcon('#ae75e7');
	}
}
