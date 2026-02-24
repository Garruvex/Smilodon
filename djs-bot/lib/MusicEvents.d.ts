import type { LavalinkPlayer } from "./clients/MusicClient";
import { VoiceState } from "discord.js";

export type IUsingPlayer = LavalinkPlayer;

/** Lavalink track (info object) or compatible shape */
export interface ILavalinkTrack {
	info?: { title?: string; author?: string; identifier?: string; duration?: number };
	identifier?: string;
	title?: string;
	author?: string;
	duration?: number;
}

export interface IHandleStopParams {
	guildId: string;
	player?: IUsingPlayer;
}

export interface IHandleTrackStartParams {
	player: IUsingPlayer;
	track: ILavalinkTrack | unknown;
}

export interface IHandleQueueUpdateParams {
	guildId: string;
	player: IUsingPlayer;
}

export interface IHandlePauseParams {
	player: IUsingPlayer;
	state: boolean;
}

export function handleStop(params: IHandleStopParams): void;

export function handleTrackStart(params: IHandleTrackStartParams): void;

export function handleQueueUpdate(params: IHandleQueueUpdateParams): void;

export function updateProgress(params: IHandleTrackStartParams): void;

export function stopProgressUpdater(guildId: string): void;

export function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void;

export function handlePause(params: IHandlePauseParams): void;
