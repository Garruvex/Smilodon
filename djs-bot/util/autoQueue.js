"use strict";

const { getClient } = require("../bot");

/**
 * AutoQueue: add one related track (YouTube "Related" mix).
 * Original behavior from Erela/Cosmicord (queueEnd): same search URL and "first unplayed" pick;
 * we use Lavalink-Client's onEmptyQueue.autoPlayFunction and queue.add (library plays after add).
 * @see https://github.com/wtfnotavailable/Discord-MusicBot/blob/develop/djs-bot/lib/clients/Erela.js (queueEnd)
 * @see https://github.com/wtfnotavailable/Discord-MusicBot/blob/develop/djs-bot/lib/clients/Cosmicord.js (queueEnd)
 * @param {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @param {import("../lib/MusicEvents").ILavalinkTrack} sourceTrack - track to get related from (current or last previous)
 * @param {{ skipPlay?: boolean }} [opts] - skipPlay: true when used from Lavalink-Client autoPlayFunction (library will play after we add)
 * @returns {Promise<boolean>} true if a track was added
 */
async function addAutoQueueTrack(player, sourceTrack, opts = {}) {
	const client = getClient();
	const requester = player.get("requester");
	const identifier = sourceTrack?.info?.identifier ?? sourceTrack?.identifier;
	if (!identifier || !requester) return false;

	const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
	try {
		const res = await player.search({ query: search }, requester);
		if (res?.loadType !== "track" && res?.loadType !== "search" && res?.loadType !== "playlist")
			return false;

		const tracks = res.tracks ?? [];
		const playedIds = (client.playedTracks || []).map((t) => t?.info?.identifier ?? t?.identifier);
		const next =
			tracks.find((t) => !playedIds.includes(t?.info?.identifier ?? t?.identifier)) ?? tracks[0];
		if (!next) return false;

		await player.queue.add(next);
		if (!opts.skipPlay) await player.play();
		return true;
	} catch (e) {
		client.warn("AutoQueue search failed:", e?.message);
		return false;
	}
}

module.exports = {
	addAutoQueueTrack,
};
