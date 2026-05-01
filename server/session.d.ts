import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      claims: {
        sub: string;
      };
    };
  }
}
