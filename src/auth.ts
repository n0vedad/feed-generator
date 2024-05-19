import express from 'express';
import { verifyJwt, AuthRequiredError } from '@atproto/xrpc-server';
import { DidResolver } from '@atproto/identity';


interface jwtRequest extends express.Request {
  jwt?: string;
}

export const validateAuth = async (
  req: jwtRequest,
  serviceDid: string,
  didResolver: DidResolver
): Promise<void> => {
  const { authorization = '' } = req.headers;
  if (!authorization.startsWith('Bearer ')) {
    throw new AuthRequiredError('Authorization header must start with Bearer');
  }
  const jwt = authorization.replace('Bearer ', '').trim();
  const isValid = await verifyJwt(jwt, serviceDid, async (did: string) => {
    return didResolver.resolveAtprotoKey(did);
  });
  if (!isValid) {
    throw new AuthRequiredError('Invalid JWT');
  }
  req.jwt = jwt;
}
