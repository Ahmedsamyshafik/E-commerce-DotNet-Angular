import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class Loading {
  //declare a variable
  requestCount = 0;
  //constructor
  constructor(private _serviceSpinner: NgxSpinnerService) {}
  //methods
  loading() {
    this.requestCount++;
    this._serviceSpinner.show(undefined, {
      bdColor: 'rgba(0,0,0,0.8)',
      size: 'large',
      color: '#5a68ce',
      type: 'square-jelly-box',
      fullScreen: true,
    });
  }

  
  hideLoader() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this._serviceSpinner.hide();
    }
  }
}
