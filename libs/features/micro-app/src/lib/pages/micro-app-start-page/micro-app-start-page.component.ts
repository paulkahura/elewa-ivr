import { take } from 'rxjs';
import { SubSink } from 'subsink';

import { Component, OnDestroy, OnInit } from '@angular/core';

import { MicroAppTypes, MicroApp, MicroAppStatusTypes, MicroAppStatus, MicroAppSectionTypes } from '@app/model/convs-mgr/micro-app/base';
import { MicroAppStatusService, MicroAppStore } from '@app/state/convs-mgr/micro-app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-micro-app-start-page',
  templateUrl: './micro-app-start-page.component.html',
  styleUrls: ['./micro-app-start-page.component.scss']
})
export class MicroAppStartPageComponent implements OnInit, OnDestroy
{
  /** Comprehensive app data */
  app: MicroAppStatus;
  /** The microApp being launched */
  appType: MicroAppTypes;
  /** ID of the app */
  appId: string;
  /** Id of the end user interacting with the app */
  endUserId: string;
  /** Configuratins of a MicroApp */
  config: MicroApp;
  /** Tracking initialization (loading) */
  isInitializing = true;

  private _sbS = new SubSink();

  constructor(private _microApp$$: MicroAppStore,
              private _microAppStatusServ: MicroAppStatusService,
              private _router: Router,
  ) {}

  ngOnInit()
  {
    // STEP 1. Get app ID
     const app$ = this._microApp$$.get();
     this._sbS.sink = 
      app$.pipe(take(1)).subscribe(a => 
       {
        this.app = a;
        this.isInitializing = false;
        // TODO: If app state is already in completed here, what should we do?
       });
  }

  /**
   * Function called when a user clicks the start button
   * Sets the microApp status to started and the section types to main section
   * Redirects the user to the main section route
  */
  handleStart() 
  {
    const appStarted = MicroAppStatusTypes.Started;
    const mainSection = MicroAppSectionTypes.Main;
  
    this._microApp$$.next({
      appId: this.app.appId,
      endUserId: this.app.endUserId,
      config: this.app.config,
      startedOn: Date.now(),
      finishedOn: '',
    } as unknown as MicroAppStatusTypes);
  
    this._microAppStatusServ.setMicroAppSections(mainSection);
    this._microAppStatusServ.setMicroAppStatus(appStarted);
  
    this._router.navigate(['main']);
  }

  /** Unsubscribe from all subscriptions to prevent memory leaks */
  ngOnDestroy()
  {
    this._sbS.unsubscribe();
  }
}
