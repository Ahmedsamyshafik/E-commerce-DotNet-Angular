/**
 * Envelope returned by the API (`responseApi`): status code, message and payload.
 * `data` is `null` for endpoints without a payload.
 */
export interface IStandaloneResponse<T> {
  statusCode: number;
  statusMessage: string;
  data: T;
}
