import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IRegisterModel } from '../shared/Models/Account/RegisterModel';
import {
  IActiveAccountModel,
  IResetPasswordToBackEndModel,
} from '../shared/Models/Account/ActiveAccountModel';
import { ILoginModel } from '../shared/Models/Account/LoginModel';
import { IUser } from '../shared/Models/Account/UserModel';
import { IStandaloneResponse } from '../shared/Models/StandaloneResponse';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private readonly baseUrl = `${environment.BASEURL}/Account`;

  constructor(private readonly http: HttpClient) {}

  register(registerUser: IRegisterModel) {
    return this.http.post<IStandaloneResponse<null>>(`${this.baseUrl}/Register`, registerUser);
  }

  Active(active: IActiveAccountModel) {
    return this.http.post<IStandaloneResponse<null>>(`${this.baseUrl}/ActiveAccount`, active);
  }

  Login(loginUser: ILoginModel) {
    return this.http.post<IStandaloneResponse<IUser>>(`${this.baseUrl}/Login`, loginUser);
  }

  ForgetPassword(email: string) {
    return this.http.post<IStandaloneResponse<null>>(`${this.baseUrl}/ForgetPassword`, { email });
  }

  ResetPassword(resetPass: IResetPasswordToBackEndModel) {
    return this.http.post<IStandaloneResponse<null>>(`${this.baseUrl}/ResetPassword`, resetPass);
  }
}
