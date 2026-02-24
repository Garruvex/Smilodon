import { HttpResponse, WebSocket } from 'uWebSockets.js';
import { WS_ROUTES_PREFIX } from '../lib/constants';
import { IPlayerSocket } from '../interfaces/ws';
import { ESocketEventType, ISocketEvent, ITrack } from '../interfaces/wsShared';
import { getBot } from '..';
import type { LavalinkPlayer } from '../../../../lib/clients/MusicClient';
import { constructITrack } from './wsShared';

export function createWsRoute(route: string) {
  return WS_ROUTES_PREFIX + route;
}

export function bufferToString(buf: ArrayBuffer) {
  return Buffer.from(buf).toString();
}

export function resEndJson(res: HttpResponse, json: object) {
  res.writeHeader('Content-Type', 'application/json').end(JSON.stringify(json));
}

export function wsSendJson<T = {}>(ws: WebSocket<T>, json: object) {
  ws.send(JSON.stringify(json));
}

export function wsPlayerSubscribe(ws: WebSocket<IPlayerSocket>) {
  const wsData = ws.getUserData();

  ws.subscribe('player/' + wsData.serverId);
}

export function wsPublish<K extends ESocketEventType>(
  topic: string,
  e: ISocketEvent<K>,
) {
  const bot = getBot(true);

  // silently fail if server isn't initialized
  if (!bot) return;

  bot.wsServer?.publish(topic, JSON.stringify(e));
}

export function getPlayerQueue(player?: LavalinkPlayer | { queue: { tracks?: unknown[] } | unknown[] }, hqThumbnail?: boolean) {
  if (!player) return [];

  const q = (player as { queue?: { tracks?: unknown[] } | unknown[] }).queue;
  const arr = q && typeof q === 'object' && 'tracks' in q ? (q as { tracks?: unknown[] }).tracks ?? [] : (Array.isArray(q) ? q : []);
  return arr.map((t: any, idx: number) =>
    constructITrack({ track: t, id: idx, hqThumbnail }),
  );
}
