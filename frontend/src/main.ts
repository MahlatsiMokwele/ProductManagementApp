import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Standalone-app bootstrap (Angular 17+ pattern, default since v18).
// No NgModule — providers and routes live in app.config.ts.
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
