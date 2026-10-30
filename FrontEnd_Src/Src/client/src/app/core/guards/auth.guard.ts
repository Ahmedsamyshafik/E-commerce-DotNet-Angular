import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for signed-in areas (checkout, payment result). It validates the cookie
 * session through `Account/Me` instead of trusting the localStorage hint alone, so an
 * expired token cannot leave the UI in a fake signed-in state.
 *
 * This remains a UX guard: every protected API endpoint still enforces the JWT itself.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return auth.checkAuth().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      toastr.info('Please sign in to continue.', 'Sign in required');
      return router.createUrlTree(['/account/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
