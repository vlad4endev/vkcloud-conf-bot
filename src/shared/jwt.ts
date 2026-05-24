declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AdminJwtPayload;
    user: AdminJwtPayload;
  }
}

export type AdminJwtPayload = {
  sub: string;
  email?: string;
  role: 'admin';
};
