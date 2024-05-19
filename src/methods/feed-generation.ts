import express, { query } from 'express';
import { InvalidRequestError } from '@atproto/xrpc-server';
import { Server } from '../lexicon';
import { AppContext, Config } from '../config';
import algos from '../algos';
import { validateAuth } from '../auth';
import { AtUri } from '@atproto/syntax';
import { QueryParams, OutputSchema } from '../lexicon/types/app/bsky/feed/getListFeed';

interface jwtRequest extends express.Request {
  jwt?: string;
}

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.getFeedSkeleton(async ({ params, req}) => {
    const customReq = req as jwtRequest;

    const feedUri = new AtUri(params.feed);
    let errorDetails: string[] = [];

    if (feedUri.hostname !== ctx.cfg.publisherDid) {
      errorDetails.push(`Hostname '${feedUri.hostname}' does not match publisher DID '${ctx.cfg.publisherDid}'.`);
    }
    if (feedUri.collection !== 'app.bsky.feed.generator') {
      errorDetails.push(`Collection '${feedUri.collection}' is not 'app.bsky.feed.generator'.`);
    }
    if (!algos[feedUri.rkey]) {
      errorDetails.push(`Algorithm '${feedUri.rkey}' is unsupported or undefined.`);
    }

    if (errorDetails.length > 0) {
      throw new InvalidRequestError(
        'Unsupported algorithm or configuration: ' + errorDetails.join(' '),
        'UnsupportedAlgorithm'
      );
    }

    try {
      await validateAuth(customReq, ctx.cfg.serviceDid, ctx.didResolver);
      console.log('Validated!');
      const body = await algos[feedUri.rkey](ctx, params);
      console.log('Algos passed!');
      console.log('JWT from feed-generation:', customReq.jwt);
      return {
        encoding: 'application/json',
        body: body
      };
    } catch (error) {
      console.log("Error!");
      throw error;
    }
  });

  server.app.bsky.feed.getListFeed(async (cfg: any) => {
    const atUri = new AtUri('at://did:plc:4xnoets5bad7npb4q2yauhs3/app.bsky.graph.list/3knnqm63qtu2m');
    const hostname = atUri.hostname;
    const collection = atUri.collection;
  
    if (hostname !== cfg.publisherDid) {
      throw new Error('Hostname mismatch in At-URI');
    }
  
    if (collection !== 'app.bsky.feed.list') {
      throw new Error('Invalid collection in At-URI');
    }
  
    const req = ctx.req as express.Request;
    const queryParams: QueryParams = {
      list: req.query.list?.toString() || '',
      limit: parseInt(req.query.limit?.toString() || '10'),
      cursor: req.query.cursor?.toString() || undefined,
    };
  
    const jwtRequest = req as express.Request & { jwt?: string };
    if (!jwtRequest.jwt) {
      throw new Error('Missing JWT token in authorization header');
    }

    const someData: OutputSchema = {
      queryParams,
      cursor: undefined,
      feed: [],
    };

    return {
      encoding: 'application/json',
      body: someData,
    };
  });  
}