export interface IActiveAccountModel {
  email: string;
  token: string;
}
export interface IResetPasswordModel {
  email: string;
  code: string;
}
export interface IResetPasswordToBackEndModel {
  password: string;
  Email: string;
  Token: string;
}
