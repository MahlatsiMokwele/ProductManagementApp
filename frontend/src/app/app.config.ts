import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import localeEnZa from "@angular/common/locales/en-ZA";
import { registerLocaleData } from "@angular/common";

import { appRoutes } from "./app.routes";

import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

registerLocaleData(localeEnZa, "en-ZA"); // for currencey, date and number formatting

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),

    { provide: LOCALE_ID, useValue: "en-ZA" },
    { provide: DEFAULT_CURRENCY_CODE, useValue: "ZAR" },
  ],
};
