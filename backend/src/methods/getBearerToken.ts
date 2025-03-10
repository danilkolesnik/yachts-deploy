import { Request } from 'express';

const getBearerToken = (request: Request) => {
  const authorizationHeader = request.headers['authorization'] as string;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1];
};

export default getBearerToken;