import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { IUser } from '../../shared/Models/Account/UserModel';
import { IStandaloneResponse } from '../../shared/Models/StandaloneResponse';
const USER_ID_KEY = 'userId';
const USER_NAME_KEY = 'userName';
const PENDING_ORDER_KEY = 'pendingOrderId';
/**
 * Owns the signed-in state for the whole SPA.
 * The JWT lives in an HttpOnly cookie, so localStorage is only a UI hint. `loadCurrentUser`
 * validates that hint against the API (`Account/Me`); on a 401 the stale hint is cleared and
 * the guards/nav fall back to guest mode. A network error keeps the cached user so an offline
 * blip does not sign the shopper out.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = `${environment.BASEURL}/Account`;
  // Starts empty on purpose: a localStorage id is only a hint and must be validated by Me
  // before the nav/guard treat the shopper as signed in.
  private readonly userSource = new BehaviorSubject<IUser | null>(null);
  private request: Observable<IUser | null> | null = null;
  readonly user$ = this.userSource.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map((user) => !!user));
  constructor(private readonly http: HttpClient) {}

  get userId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.userSource.value || !!localStorage.getItem(USER_ID_KEY);
  }

  get userName(): string {
    const user = this.userSource.value;
    return user?.displayName || user?.userName || localStorage.getItem(USER_NAME_KEY) || '';
  }

  /** Stores the profile returned by Login/Me and keeps the nav in sync. */
  setUser(user: IUser): void {
    localStorage.setItem(USER_ID_KEY, user.id);
    localStorage.setItem(USER_NAME_KEY, user.displayName || user.userName || '');
    this.userSource.next(user);
  }

  /** Clears local auth hints without calling the API (also used after a 401). */
  clearSession(): void {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    this.userSource.next(null);
  }

  /**
   * Validates the cookie session. Returns the cached profile unless `force` is set.
   * Concurrent callers share one request.
   */
  loadCurrentUser(force = false): Observable<IUser | null> {
    if (!force && this.userSource.value) {
      return of(this.userSource.value);
    }

    if (this.request) {
      return this.request;
    }

    this.request = this.http.get<IStandaloneResponse<IUser>>(`${this.baseUrl}/Me`).pipe(
      map((response) => response?.data ?? null),
      tap((user) => {
        if (user) {
          this.setUser(user);
        } else {
          this.clearSession();
        }
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 404)) {
          this.clearSession();
          return of(null);
        }

        // Network/server failure: keep the optimistic local hint instead of signing out.
        const fallback = this.userSource.value ?? this.readStoredUser();
        if (fallback) {
          this.userSource.next(fallback);
        } else {
          this.clearSession();
        }
        return of(fallback);
      }),
      finalize(() => {
        this.request = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.request;
  }

  /** Guard-friendly check: cookie-validated when possible, false for an obvious guest. */
  checkAuth(): Observable<boolean> {
    return this.loadCurrentUser().pipe(map((user) => !!user));
  }

  /** Clears the server cookie and always clears the local state, even if the call fails. */
  logout(): Observable<void> {
    return this.http.post<IStandaloneResponse<null>>(`${this.baseUrl}/Logout`, {}).pipe(
      catchError(() => of(null)),
      map(() => void 0),
      finalize(() => {
        this.clearSession();
        // An explicit sign-out must not leave a previous account's pending order behind.
        sessionStorage.removeItem(PENDING_ORDER_KEY);
      }),
    );
  }

  private readStoredUser(): IUser | null {
    const id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      return null;
    }
    const name = localStorage.getItem(USER_NAME_KEY) ?? '';
    return {
      id,
      userName: name,
      displayName: name,
      email: '',
      imgUrl: null,
    };
  }
}