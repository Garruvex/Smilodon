"use strict";

/**
 * Lavalink-Client (Lavalink v4) music engine wrapper.
 * Options aligned with official API: ManagerOptions, ManagerPlayerOptions (onEmptyQueue.autoPlayFunction, etc.).
 * @see https://github.com/Tomato6966/lavalink-client
 * @see https://tomato6966.github.io/lavalink-client/api/lavalinkmanager/classes/lavalinkmanager/
 * @see https://tomato6966.github.io/lavalink-client/api/types/manager/interfaces/manageroptions/
 */

const { LavalinkManager } = require("lavalink-client");
const { EmbedBuilder } = require("discord.js");
const colors = require("colors");
const { updateControlMessage } = require("../../util/controlChannel");
const { addAutoQueueTrack } = require("../../util/autoQueue");
const { handleTrackStart } = require("../MusicEvents");
const { setDefaultPlayerConfig } = require("../../util/musicManager");

/**
 * @param {import("../Bot")} client
 * @returns {import("lavalink-client").LavalinkManager & { leastUsedNode: import("lavalink-client").LavalinkNode | null }}
 */
module.exports = (client) => {
	const rawNodes = Array.isArray(client.config.nodes) ? client.config.nodes : [];
	const nodes = rawNodes
		.filter((n) => n && (n.host || n.port))
		.map((n) => ({
			id: n.id || n.identifier || "node",
			host: String(n.host || "127.0.0.1"),
			port: Number(n.port) || 2333,
			authorization: String(n.authorization || n.password || ""),
			secure: n.secure === true,
		}));

	if (nodes.length === 0) {
		throw new SyntaxError(
			"ManagerOption.nodes must be an Array of NodeOptions with at least 1 node. Set LAVALINK_PASSWORD (and optionally LAVALINK_HOST, LAVALINK_PORT) in .env or check config.nodes."
		);
	}

	const manager = new LavalinkManager({
		nodes,
		sendToShard: (guildId, payload) => {
			const guild = client.guilds.cache.get(guildId);
			if (guild?.shard) guild.shard.send(payload);
		},
		client: {
			id: client.user?.id || client.config.clientId,
			username: client.config.name || "Smilodon",
		},
		autoSkip: true,
		autoSkipOnResolveError: true,
		autoMove: true,
		playerOptions: {
			clientBasedPositionUpdateInterval: 1000,
			defaultSearchPlatform: "ytsearch",
			onDisconnect: {
				destroyPlayer: true,
				autoReconnect: false,
			},
			onEmptyQueue: {
				destroyAfterMs: client.config.disconnectTime ?? 120_000,
				minAutoPlayMs: 10_000,
				async autoPlayFunction(player, lastPlayedTrack) {
					if (player.get("autoQueue") && lastPlayedTrack) {
						await addAutoQueueTrack(player, lastPlayedTrack, { skipPlay: true });
					}
				},
			},
		},
		queueOptions: {
			maxPreviousTracks: 25,
		},
	});

	// Expose leastUsedNode for getLavalink() compatibility
	Object.defineProperty(manager, "leastUsedNode", {
		get() {
			const list = this.nodeManager?.leastUsedNodes?.() ?? [];
			return list[0] ?? null;
		},
		configurable: true,
	});

	client.once("ready", () => {
		manager
			.init({
				id: client.user.id,
				username: client.user.username,
			})
			.then(() => client.log("Lavalink-Client: Manager initialized"))
			.catch((err) => client.error("Lavalink-Client init error:", err));
	});

	client.on("raw", (data) => {
		if (manager.initiated) manager.sendRawData(data);
	});

	// Create player: apply default config after creation
	manager.on("playerCreate", (player) => {
		setDefaultPlayerConfig(player);
	});

	manager.on("trackStart", (player, track) => {
		handleTrackStart({ player, track });
	});

	manager.on("trackEnd", (player, track) => {
		// Handled by library (auto-advance). We only need queueEnd for "queue empty" UI.
	});

	manager.on("trackException", (player, track, exception) => {
		client.error("Track exception:", exception?.message ?? exception);
		const ch = player.textChannelId && client.channels.cache.get(player.textChannelId);
		if (ch) {
			ch.send({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setTitle("Track error")
						.setDescription(`\`\`\`${exception?.message ?? String(exception)}\`\`\``),
				],
			}).catch(() => {});
		}
	});

	manager.on("trackStuck", (player, track, thresholdMs) => {
		client.warn(`Track stuck (${thresholdMs}ms), skipping.`);
		const ch = player.textChannelId && client.channels.cache.get(player.textChannelId);
		if (ch) {
			ch.send({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setTitle("Track stuck")
						.setDescription("Skipping to the next track."),
				],
			}).catch(() => {});
		}
	});

	manager.on("queueEnd", async (player) => {
		const twentyFourSeven = player.get("twentyFourSeven");

		// Reset control channel embed to "No song currently playing" when queue ends
		updateControlMessage(player.guildId).catch(() => {});

		const ch = player.textChannelId && client.channels.cache.get(player.textChannelId);
		if (ch) {
			const msg = await ch
				.send({
					embeds: [
						new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setAuthor({
								name: `Queue ended ${twentyFourSeven ? "but 24/7 is on!" : ""}`,
								iconURL: client.config.iconURL,
							})
							.setDescription(
								twentyFourSeven
									? "The bot will stay in the VC (24/7)."
									: "Leaving the voice channel soon. Use `/autoqueue` for endless playback."
							)
							.setFooter({ text: "Use /autoqueue for related tracks when the queue ends." })
							.setTimestamp(),
					],
				})
				.catch(() => {});
			if (msg) setTimeout(() => msg.delete().catch(() => {}), 20000);
		}

		if (!twentyFourSeven && client.config.disconnectTime) {
			setTimeout(() => {
				const p = manager.getPlayer(player.guildId);
				if (p && !p.playing && (p.queue.tracks?.length ?? p.queue?.length ?? 0) === 0) {
					p.destroy("Queue ended and 24/7 off");
				}
			}, client.config.disconnectTime);
		}
	});

	manager.on("playerDestroy", (player) => {
		updateControlMessage(player.guildId);
	});

	manager.on("playerMove", (player, oldChannelId, newChannelId) => {
		if (oldChannelId === newChannelId) return;
		const guild = client.guilds.cache.get(player.guildId);
		if (!guild) return;
		const ch = player.textChannelId && guild.channels.cache.get(player.textChannelId);
		if (!newChannelId) {
			if (ch) {
				ch.send({
					embeds: [
						new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(`Disconnected from <#${oldChannelId}>`),
					],
				}).catch(() => {});
			}
			player.destroy("Left voice channel");
		}
	});

	return manager;
};
