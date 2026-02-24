/**
 * Types for the Lavalink-Client music engine (Lavalink v4).
 * @see https://github.com/Tomato6966/lavalink-client
 */

/** Lavalink-Client player (minimal interface used by the bot) */
export interface LavalinkPlayer {
	guildId: string;
	queue: LavalinkQueue;
	paused: boolean;
	playing: boolean;
	position: number;
	voiceChannelId?: string;
	voiceChannel?: string;
	textChannelId?: string;
	textChannel?: string;
	pause(): void;
	resume(): void;
	play(options?: { clientTrack?: unknown }): Promise<unknown>;
	skip(): void;
	seek(position: number): void;
	connect(): Promise<unknown>;
	destroy(reason?: string): void;
	changeVoiceState(options: { voiceChannelId: string }): Promise<unknown>;
	search(options: { query: string }, requestUser: unknown): Promise<LavalinkLoadResult>;
	get<T>(key: string): T;
	set(key: string, value: unknown): this;
}

/** Lavalink-Client queue (has .tracks array or is array-like) */
export interface LavalinkQueue {
	tracks?: unknown[];
	length?: number;
	current?: { info?: { identifier?: string }; identifier?: string; title?: string; author?: string; duration?: number };
	previous?: unknown[] | unknown;
	add(track: unknown | unknown[]): Promise<unknown>;
	remove(position: number, end?: number): unknown;
	splice(start: number, deleteCount: number, ...items: unknown[]): unknown[];
	shuffle(): this;
}

export interface LavalinkLoadResult {
	loadType?: string;
	tracks?: unknown[];
}

/** Lavalink-Client manager returned by the engine */
export interface LavalinkManagerLike {
	players: Map<string, LavalinkPlayer>;
	nodeManager?: { nodes?: Map<string, unknown>; leastUsedNodes?(): unknown[] };
	nodes?: Map<string, unknown>;
	getPlayer(guildId: string): LavalinkPlayer | null;
	createPlayer(options: { guildId: string; voiceChannelId: string; textChannelId: string }): LavalinkPlayer;
	init(options: { id: string; username: string }): Promise<void>;
	sendRawData(data: unknown): void;
	readonly initiated?: boolean;
}

export type MusicClient = LavalinkManagerLike;

/** Bot's music manager (has .Engine = Lavalink manager) */
export interface MusicManagerLike {
	Engine: LavalinkManagerLike;
}

export type IUsingPlayer = LavalinkPlayer;
