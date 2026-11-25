
declare global {
  namespace Express {
    interface User {
      id: number | string;
      googleId?: string;
      name?: string;
      email?: string;
      avatar?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
