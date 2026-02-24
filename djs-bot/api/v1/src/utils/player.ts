/*
API should roll its own player utils, importing from main utils is BAD and causes circular import
as api should only be imported by Bot, not the other way around
*/
import type { LavalinkPlayer } from '../../../../lib/clients/MusicClient';
import { handleQueueUpdate, handleStop } from '../ws/eventsHandler';

export async function spliceQueue(player: LavalinkPlayer, ...restArgs: unknown[]) {
  const q = player.queue as { splice: (...a: unknown[]) => unknown };
  const ret = await q.splice(...restArgs);
  handleQueueUpdate({ guildId: player.guildId, player });
  return ret;
}

export async function playPrevious(player: LavalinkPlayer) {
  const prevArr = (player.queue as { previous?: unknown[] | unknown }).previous;
  const previousSong = Array.isArray(prevArr) ? prevArr[prevArr.length - 1] : prevArr;
  const currentSong = player.queue.current;
  const queueTracks = player.queue.tracks ?? (Array.isArray(player.queue) ? player.queue : []);
  const nextSong = queueTracks[0];

  if (
    !previousSong ||
    previousSong === currentSong ||
    previousSong === nextSong
  ) {
    return 1;
  }

  if (currentSong && previousSong !== currentSong && previousSong !== nextSong) {
    await spliceQueue(player, 0, 0, currentSong);
    await player.play({ clientTrack: previousSong });
  }
  return 0;
}

export async function skip(player: LavalinkPlayer) {
  const autoQueue = player.get?.('autoQueue');
  const queueTracks = player.queue.tracks ?? (Array.isArray(player.queue) ? player.queue : []);
  const hasNext = (queueTracks?.length ?? 0) > 0;
  if (!hasNext && !autoQueue) {
    return 1;
  }
  player.skip();
  handleStop({ guildId: player.guildId });
  return 0;
}
