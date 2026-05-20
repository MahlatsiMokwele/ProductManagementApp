import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

// Functional guard - Bounces unauthenticated users to /login, preserving the requested URL as `returnUrl` so we can send them back after a successful sign-in.

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
