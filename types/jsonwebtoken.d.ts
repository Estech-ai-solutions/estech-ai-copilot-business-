declare module 'jsonwebtoken' {
  export function sign(payload: object, secretOrPrivateKey: string, options?: object): string;
  export function verify(token: string, secretOrPrivateKey: string): object;
}