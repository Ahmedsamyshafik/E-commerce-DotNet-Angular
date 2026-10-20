import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { IActiveAccountModel } from '../../shared/Models/Account/ActiveAccountModel';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-active',
  standalone: false,
  templateUrl: './active.component.html',
  styleUrl: './active.component.scss',
})
export class ActiveComponent implements OnInit {
  activeParm: IActiveAccountModel = {
    email: '',
    token: '',
  };

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly activeRouter: ActivatedRoute,
    private readonly identityService: IdentityService,
    private readonly router: Router,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.activeRouter.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const email = params['email'];
        const token = params['code'];

        if (typeof email !== 'string' || typeof token !== 'string' || !email || !token) {
          this.toastr.error('The activation link is invalid or incomplete.', 'Activation');
          this.router.navigate(['/']);
          return;
        }

        this.activeParm = { email, token };
        this.ActiveAcount();
      });
  }

  ActiveAcount(): void {
    this.identityService.Active(this.activeParm).subscribe({
      next: () => {
        this.toastr.success('Your email is now active. Please sign in.', 'Activation');
        this.router.navigate(['/account/login']);
      },
      error: (error) => {
        this.toastr.error(
          getHttpErrorMessage(
            error,
            'This activation link is invalid or has expired. Please request a new one.',
          ),
          'Activation',
        );
        this.router.navigate(['/']);
      },
    });
  }
}
