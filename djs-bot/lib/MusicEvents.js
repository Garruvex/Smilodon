"use strict";

const colors = require("colors");
const { getClient } = require("../bot");
const socket = require("../api/v1/dist/ws/eventsHandler");
const {
	updateControlMessage,
	updateNowPlaying,
	runIfNotControlChannel,
	updatePauseControlMessage,
	getControlChannelMessage,
} = require("../util/controlChannel");

const { controlChannelMessage, redEmbed, trackStartedEmbed } = require("../util/embeds");

// entries in this map should be removed when bot disconnected from vc
const progressUpdater = new Map();

function stopProgressUpdater(guildId) {
	const prevInterval = progressUpdater.get(guildId);

	if (prevInterval) {
		clearInterval(prevInterval);
		progressUpdater.delete(guildId);
	}
}

function _gid(player) {
	return player.guildId ?? player.guild;
}

async function updateProgress({ player, track }) {
	const gid = _gid(player);
	if (!gid?.length) return;

	stopProgressUpdater(gid);

	const client = getClient();
	const engine = client?.manager?.Engine;
	const getCurrentPlayer = () =>
		(typeof engine?.getPlayer === "function" ? engine.getPlayer(gid) : null) ??
		engine?.players?.get?.(gid) ??
		null;

	const message = await getControlChannelMessage(gid);
	let lastMsgUpdateTime = Date.now();
	let isPause = false;
	let isReset = true;
	progressUpdater.set(
		gid,
		setInterval(() => {
			const currentPlayer = getCurrentPlayer();
			if (!currentPlayer) {
				stopProgressUpdater(gid);
				return;
			}
			if (!currentPlayer.playing && !currentPlayer.paused) return;
			if (!currentPlayer.playing || currentPlayer.paused) {
				if (message && currentPlayer.paused) {
					if (!isPause) {
						try {
							updatePauseControlMessage(gid, track);
							isPause = true;
						} catch (error) {
							console.error("Error updating message:", error);
						}
						isReset = true;
					}
				}
				return;
			}

			const currentTime = Date.now();
			isPause = false;
			// position is read-only on Lavalink-Client Player; library updates it (clientBasedPositionUpdateInterval / server)

			if (message) {
				const elapsedTime = currentTime - lastMsgUpdateTime;
				if (elapsedTime >= 10000 || isReset) {
					try {
						updateControlMessage(gid, track);
						lastMsgUpdateTime = currentTime;
						isReset = false;
					} catch (error) {
						console.error("Error updating message:", error);
					}
				}
			}

			const position = currentPlayer.position ?? 0;
			socket.handleProgressUpdate({
				guildId: gid,
				position,
			});
		}, 1000)
	);
}

function handleVoiceStateUpdate(oldState, newState) {
	// not leaving vc
	if (newState.channelId) return;

	// not client user
	if (newState.member.id !== newState.client.user.id) return;

	const gid = newState.guild.id;

	stopProgressUpdater(gid);
	socket.handleStop({ guildId: gid });
}

function handleStop({ player }) {
	socket.handleStop({ guildId: _gid(player) });
}

function handleQueueUpdate({ guildId, player }) {
	socket.handleQueueUpdate({ guildId, player });
}

function sendTrackHistory({ player, track }) {
	const history = player.get("history");
	if (!history) return;

	const textChannelId = player.textChannelId ?? player.textChannel;
	runIfNotControlChannel(player, () => {
		const client = getClient();
		client.channels.cache
			.get(textChannelId)
			?.send({
				embeds: [
					trackStartedEmbed({ track, player, title: "Played track" }),
				],
			})
			.catch(client.warn);
	});
}

/**
 * @param {import("./MusicEvents").IHandleTrackStartParams}
 */
function handleTrackStart({ player, track }) {
	const client = getClient();
	const gid = _gid(player);
	const playedTracks = client.playedTracks;

	if (playedTracks.length >= 25) playedTracks.shift();

	if (!playedTracks.includes(track)) playedTracks.push(track);

	updateNowPlaying(player, track);
	updateControlMessage(gid, track);
	sendTrackHistory({ player, track });

	socket.handleTrackStart({ player, track });
	socket.handlePause({ guildId: gid, state: player.paused });
	handleQueueUpdate({ guildId: gid, player });

	updateProgress({ player, track });

	const trackTitle = track?.info?.title ?? track?.title ?? "Unknown";
	client.warn(
		`Player: ${gid} | Track has started playing [${colors.blue(trackTitle)}]`
	);
	client.songsPlayed++;
}

function handlePause({ player, state }) {
	socket.handlePause({ guildId: _gid(player), state });
}

module.exports = {
	handleTrackStart,
	handleQueueUpdate,
	handleStop,
	updateProgress,
	stopProgressUpdater,
	handleVoiceStateUpdate,
	handlePause,
};
