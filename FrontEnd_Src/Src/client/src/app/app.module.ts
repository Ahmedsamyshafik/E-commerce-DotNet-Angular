import {
  NgModule,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core/core.module';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { HomeModule } from './home/home-module';
import { loaderInterceptor } from './core/interceptor/loader-interceptor';
import { ToastrModule } from 'ngx-toastr';
import { credentialsInterceptor } from './core/interceptor/credentials.interceptor';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    HomeModule,
    NgxSpinnerModule,
    ToastrModule.forRoot({
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      countDuplicates: true,
      timeOut: 4000,
    }),
  ],

  // provideZoneChangeDetection() keeps change detection working for subscriptions.
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptors([loaderInterceptor, credentialsInterceptor])),
  ],

  bootstrap: [App],
})
export class AppModule {}
