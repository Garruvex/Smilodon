import type { GuildMember } from "discord.js";
import type { IUsingPlayer } from "../lib/MusicEvents";

export function triggerSocketQueueUpdate(player: IUsingPlayer): void;

export function spliceQueue(
	player: IUsingPlayer,
	...restArgs: unknown[]
): Promise<unknown>;

export function clearQueue(player: IUsingPlayer): Promise<void>;

export function removeTrack(player: IUsingPlayer, ...restArgs: unknown[]): unknown;

export function shuffleQueue(player: IUsingPlayer): ReturnType<IUsingPlayer["queue"]["shuffle"]>;

export function playPrevious(player: IUsingPlayer): Promise<number>;

export function stop(player: IUsingPlayer): number;

export function skip(player: IUsingPlayer): number;

export function joinStageChannelRoutine(me: GuildMember): void;

export function addTrack(
	player: IUsingPlayer,
	tracks: unknown | unknown[]
): Promise<unknown>;

export function triggerSocketPause(player: IUsingPlayer, state: boolean): void;

export function pause(player: IUsingPlayer, state: boolean): Promise<IUsingPlayer>;
