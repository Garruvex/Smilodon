const { GuildMember } = require("discord.js");
const { handleQueueUpdate, handleStop, handlePause } = require("../lib/MusicEvents");
const { updateControlMessage } = require("./controlChannel");
const { addAutoQueueTrack } = require("./autoQueue");

const triggerSocketQueueUpdate = (player) => {
	handleQueueUpdate({
		guildId: player.guildId ?? player.guild,
		player,
	});
};

const triggerSocketPause = (player, state) => {
	handlePause({
		player,
		state,
	});
};

const spliceQueue = async (player, ...restArgs) => {
	const ret = await player.queue.splice(...restArgs);
	triggerSocketQueueUpdate(player);
	return ret;
};

const clearQueue = async (player) => {
	const q = player.queue;
	const len = q.tracks?.length ?? 0;
	if (len) await q.splice(0, len);
	triggerSocketQueueUpdate(player);
};

const removeTrack = (player, ...restArgs) => {
	const ret = player.queue.remove(...restArgs);

	triggerSocketQueueUpdate(player);

	return ret;
};

const shuffleQueue = (player) => {
	const ret = player.queue.shuffle();

	triggerSocketQueueUpdate(player);

	return ret;
};

/**
 * Play the previous track (Lavalink-Client: queue.previous is array)
 */
const playPrevious = async (player) => {
	const prevArr = player.queue.previous;
	const previousSong = Array.isArray(prevArr) ? prevArr[prevArr.length - 1] : prevArr;
	const currentSong = player.queue.current;
	const nextSong = player.queue.tracks?.[0] ?? player.queue[0];

	if (!previousSong || previousSong === currentSong || previousSong === nextSong) {
		return 1;
	}

	spliceQueue(player, 0, 0, currentSong);
	await player.play({ clientTrack: previousSong });
	triggerSocketQueueUpdate(player);
	return 0;
};

/**
 * Stop playback (Lavalink-Client: stopPlaying or destroy)
 */
const stop = async (player) => {
	const twentyFourSeven = player.get?.("twentyFourSeven") ?? player.twentyFourSeven;
	if (twentyFourSeven) {
		await clearQueue(player);
		await player.stopPlaying(true);
		player.set("autoQueue", false);
	} else {
		await player.destroy();
	}
	handleStop({ player });
	triggerSocketQueueUpdate(player);
	// Reset control channel to "No song currently playing" when stop is used
	updateControlMessage(player.guildId).catch(() => {});
	return 0;
};

/**
 * Skip current track (Lavalink-Client: player.skip()).
 * When queue is empty and autoQueue is on, add a related track first so skip() does not throw.
 */
const skip = async (player) => {
	const autoQueue = player.get("autoQueue");
	const queueLen = player.queue?.tracks?.length ?? player.queue?.length ?? 0;
	const hasNext = queueLen > 0;

	if (!hasNext && !autoQueue) {
		return 1;
	}

	if (!hasNext && autoQueue) {
		const sourceTrack =
			player.queue?.current ??
			(player.queue?.previous?.length
				? player.queue.previous[player.queue.previous.length - 1]
				: null);
		if (!sourceTrack) return 1;
		const added = await addAutoQueueTrack(player, sourceTrack, { skipPlay: true });
		if (!added) return 1;
		// Queue now has 1 track; skip current so the library plays the added track
	}

	await player.skip();
	handleStop({ player });
	return 0;
};

const joinStageChannelRoutine = (me) => {
	if (!(me instanceof GuildMember)) throw new TypeError("me is not GuildMember");

	setTimeout(() => {
		if (me.voice.suppress == true) {
			try {
				me.voice.setSuppressed(false);
			} catch (e) {
				me.voice.setRequestToSpeak(true);
			}
		}
	}, 2000); // Need this because discord api is buggy asf, and without this the bot will not request to speak on a stage - Darren
};

/**
 * Add track(s) to queue (Lavalink-Client: queue.add is async)
 */
const addTrack = async (player, tracks) => {
	const ret = await player.queue.add(tracks);
	triggerSocketQueueUpdate(player);
	return ret;
};

const pause = async (player, state) => {
	if (state) {
		player.pause();
	} else {
		player.resume();
	}
	triggerSocketPause(player, state);
	return player;
};

module.exports = {
	playPrevious,
	stop,
	skip,
	joinStageChannelRoutine,
	addTrack,
	spliceQueue,
	triggerSocketQueueUpdate,
	clearQueue,
	removeTrack,
	shuffleQueue,
	triggerSocketPause,
	pause,
};
