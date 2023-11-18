"use strict";

const colors = require("colors");
const { getClient } = require("../bot");
const socket = require("../api/v1/dist/ws/eventsHandler");
const {
	updateControlMessage,
	updatePauseControlMessage,
	updateNowPlaying,
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

async function updateProgress({ player, track }) {
	const gid = player.guild;
	if (!gid?.length) return;

	stopProgressUpdater(gid);

	const message = await getControlChannelMessage(gid);
	let lastMsgUpdateTime = Date.now();
	let lastIntervalTime = Date.now();
	let isPause = false;
	let isReset = true;
	progressUpdater.set(
		gid,
		setInterval(() => {
			if (!player.playing || player.paused) {
				if (message && player.paused) {
					if (!isPause) {
						try {
							// console.log("pause message");
							updatePauseControlMessage(
								player.guild,
								track
							);
							isPause = true;
						} catch (error) {
							console.error(
								"Error updating message:",
								error
							);
						}
						isReset = true;
					}
				}
				return;
			}

			const currentTime = Date.now();
			isPause = false;
			const IntervalElapsedTime = currentTime - lastIntervalTime;
			player.position += IntervalElapsedTime;
			lastIntervalTime = currentTime;
			// player.position += 1000;

			if (message) {
				const elapsedTime = currentTime - lastMsgUpdateTime;

				// Update the message only if more than 5 seconds have passed since the last update
				if (elapsedTime >= 10000 || isReset) {
					// console.log("Update message");
					try {
						updateControlMessage(player.guild, track);
						lastMsgUpdateTime = currentTime; // Update the lastUpdateTime to the current time
						isReset = false;
					} catch (error) {
						console.error("Error updating message:", error);
					}
				}
			}

			socket.handleProgressUpdate({
				guildId: player.guild,
				position: player.position,
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
	socket.handleStop({ guildId: player.guild });
}

function handleQueueUpdate({ guildId, player }) {
	socket.handleQueueUpdate({ guildId, player });
}

/**
 * @param {import("./MusicEvents").IHandleTrackStartParams}
 */
function handleTrackStart({ player, track }) {
	const client = getClient();

	const playedTracks = client.playedTracks;

	if (playedTracks.length >= 25) playedTracks.shift();

	if (!playedTracks.includes(track)) playedTracks.push(track);

	updateNowPlaying(player, track);
	updateControlMessage(player.guild, track);

	socket.handleTrackStart({ player, track });
	socket.handlePause({ guildId: player.guild, state: player.paused });
	handleQueueUpdate({ guildId: player.guild, player });

	updateProgress({ player, track });

	client.warn(
		`Player: ${player.guild} | Track has started playing [${colors.blue(track.title)}]`
	);
}

function handlePause({ player, state }) {
	socket.handlePause({ guildId: player.guild, state });
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
