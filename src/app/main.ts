import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

// import {OneSignal} from '@ionic-native/onesignal';
// import {Platform} from 'ionic-angular';
 
// constructor(private _OneSignal: OneSignal, private _platform: Platform) {
//   initializeApp();
// }

// initializeApp() {
//     this._platform.ready().then(() => {
//       this._OneSignal.startInit(appId, googleProjectId);
//       this._OneSignal.inFocusDisplaying(this._OneSignal.OSInFocusDisplayOption.Notification);
//       this._OneSignal.setSubscription(true);
//       this._OneSignal.handleNotificationReceived().subscribe(() => {
//         // handle received here how you wish.
//       });
//       this._OneSignal.handleNotificationOpened().subscribe(() => {
//         // handle opened here how you wish.
//       });
//       this._OneSignal.endInit();        
//     })    
//   }



platformBrowserDynamic().bootstrapModule(AppModule);
