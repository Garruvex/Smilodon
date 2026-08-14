import { FastifyInstance, FastifyPluginAsync  } from 'fastify';
import * as uws from 'uWebSockets.js';
import { ERROR_CODES, STATUS_CODES } from '../lib/constants';
import type DJSBot from '../../../../lib/Bot';
import type { MusicManagerLike } from '../../../../lib/clients/MusicClient';

export type Bot = DJSBot;

/** Bot type with manager.Engine guaranteed for api usage (avoids resolution issues) */
export type BotWithEngine = Bot & { manager?: MusicManagerLike };

export type RegisterRouteHandler = FastifyPluginAsync;

export type FastifyRouteHandler = Parameters<
  FastifyInstance['route']
>[0]['handler'];

export interface IRouteHandlerOptions {
  requiresAuth?: boolean;
}

export interface APIRouteHandler {
  default: FastifyRouteHandler;
  method?: IServerMethod;
  options?: IRouteHandlerOptions;
}

export type IServerMethod =
  | 'delete'
  | 'get'
  | 'head'
  | 'patch'
  | 'post'
  | 'put'
  | 'options';

export interface RouteHandlerEntry {
  handler: FastifyRouteHandler;
  method: IServerMethod;
  options?: IRouteHandlerOptions;
}

export type RouteHandler = FastifyRouteHandler | RouteHandlerEntry;

export type RouteErrorHandler = Parameters<
  FastifyInstance['setErrorHandler']
>[0];

export type IErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type IStatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];

export type WSApp = ReturnType<typeof uws.App>;
