import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav, App } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { TabsNavigationPage } from '../pages/tabs-navigation/tabs-navigation';
import { FormsPage } from '../pages/forms/forms';
import { LayoutsPage } from '../pages/layouts/layouts';
import { WalkthroughPage } from '../pages/walkthrough/walkthrough';
import { SettingsPage } from '../pages/settings/settings';
import { FunctionalitiesPage } from '../pages/functionalities/functionalities';

import { AlertController } from 'ionic-angular';

// import { OneSignal } from '@ionic-native/onesignal';

import {
  Push,
  PushToken
} from '@ionic/cloud-angular';

import { Auth, User } from '@ionic/cloud-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html'
})
export class MyApp {

  @ViewChild(Nav) nav: Nav;

  // make WalkthroughPage the root (or first) page
  rootPage: any = WalkthroughPage;
  // rootPage: any = TabsNavigationPage;


  pages: Array<{title: string, icon: string, component: any}>;
  pushPages: Array<{title: string, icon: string, component: any}>;

  constructor(
    platform: Platform,
    public menu: MenuController,
    public app: App,
    public push: Push,
    public alertCtrl:AlertController,
    // private oneSignal: OneSignal
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
      // this.initPushNotification();
      
      
      // let notificationOpenedCallback = function(jsonData) {
      //   let alert =alertCtrl.create({
      //     title: jsonData.notification.payload.title,
      //     subTitle: jsonData.notification.payload.body,
      //     buttons: ['OK']
      //   });
      //   alert.present();
      //   console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
      // };

      // window["plugins"].OneSignal
      //   .startInit("000c6b1b-f9cb-4bfe-a87d-4e3a188ef722", "737509012599")
      //   .handleNotificationOpened(notificationOpenedCallback)
      //   .endInit();

      this.push.register().then((t: PushToken) => {
          return this.push.saveToken(t,{ignore_user:true});
        }).then((t: PushToken) => {
          console.log('Token saved:', t.token);
          alert(t.token);
      });

      this.push.rx.notification()
      .subscribe((msg) => {
        alert(msg.title + ': ' + msg.text);
      });
    
      
    });



    this.pages = [
      { title: 'Inicio', icon: 'home', component: TabsNavigationPage },
      // { title: 'Forms', icon: 'create', component: FormsPage },
      // { title: 'Functionalities', icon: 'code', component: FunctionalitiesPage }
    ];

    this.pushPages = [
      // { title: 'Layouts', icon: 'grid', component: LayoutsPage },
      { title: 'Perfil', icon: 'settings', component: SettingsPage },
    ];

    
  }

  
  

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  pushPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // rootNav is now deprecated (since beta 11) (https://forum.ionicframework.com/t/cant-access-rootnav-after-upgrade-to-beta-11/59889)
    this.app.getRootNav().push(page.component);
  }

  logout() {
    // navigate to the new page if it is not the current page
    this.menu.close();
    this.nav.setRoot(this.rootPage);
    
  }
}
