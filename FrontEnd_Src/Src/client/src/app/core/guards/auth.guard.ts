import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

/**
 * Client-side UX guard for signed-in areas (checkout). The API still authorizes every
 * request, so this is not a security boundary.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (localStorage.getItem('userId')) {
    return true;
  }

  toastr.info('Please sign in to continue.', 'Sign in required');
  return router.createUrlTree(['/account/login'], {
    queryParams: { returnUrl: state.url },
  });
};
