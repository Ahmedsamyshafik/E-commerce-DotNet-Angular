import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Loading } from '../services/loading.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(Loading);

  loading.loading();

  return next(req).pipe(
    finalize(() => {
      loading.hideLoader();
    }),
  );
};
