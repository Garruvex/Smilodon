const { Message, MessageFlags } = require("discord.js");
const { getClient } = require("../bot");
const { controlChannelMessage, redEmbed } = require("./embeds");
const { trackUpdateEmbed } = require("./utils.js");

/**
 * @type {Map<string, Message>}
 */
const controlChannelMessageCache = new Map();

const setControlChannelMessage = (guildId, message) => {
	return controlChannelMessageCache.set(guildId, message);
};

/**
 * @param {string} guildId
 * @returns {Promise<Message | null>}
 */
const getControlChannelMessage = async (guildId) => {
	if (!guildId) throw new Error("No guild Id provided");

	const cache = controlChannelMessageCache.get(guildId);
	if (cache !== undefined) return cache;

	const client = getClient();

	// no db? simply ignore
	if (!client.db) return;

	const { controlChannelId, controlChannelMessageId } =
		(await client.db.guild.findFirst({
			where: {
				guildId,
			},
		})) || {};

	if (!controlChannelId || !controlChannelMessageId) {
		setControlChannelMessage(guildId, null);
		return null;
	}

	const message = new Message(client, {
		id: controlChannelMessageId,
		channel_id: controlChannelId,
	});

	setControlChannelMessage(guildId, message);

	return message;
};

/**
 * Get the stored control channel id and message id for a guild (for editing the single control panel message).
 * Uses cache first, then DB, so we always have valid channelId + messageId for REST edit.
 * @param {string} guildId
 * @returns {Promise<{ channelId: string, messageId: string } | null>}
 */
const getControlChannelIds = async (guildId) => {
	const cached = controlChannelMessageCache.get(guildId);
	if (cached && cached.id && (cached.channelId ?? cached.channel_id)) {
		return {
			channelId: cached.channelId ?? cached.channel_id,
			messageId: cached.id,
		};
	}
	const client = getClient();
	if (!client.db) return null;
	const row = await client.db.guild.findFirst({ where: { guildId } });
	if (!row?.controlChannelId || !row?.controlChannelMessageId) return null;
	return {
		channelId: row.controlChannelId,
		messageId: row.controlChannelMessageId,
	};
};

const deleteControlChannelMessage = (guildId) => {
	return controlChannelMessageCache.delete(guildId);
};

const setDbControlChannel = async ({ guildId, channelId, messageId } = {}) => {
	if (!guildId) throw new Error("No guildId provided");

	const client = getClient();

	if (channelId?.length && messageId?.length)
		setControlChannelMessage(
			guildId,
			new Message(client, {
				id: messageId,
				channel_id: channelId,
			})
		);
	else deleteControlChannelMessage(guildId);

	// no db? simply ignore
	if (!client.db) return;

	await client.db.guild.upsert({
		where: {
			guildId,
		},
		create: {
			controlChannelId: channelId,
			guildId,
			controlChannelMessageId: messageId,
		},
		update: {
			controlChannelId: channelId,
			controlChannelMessageId: messageId,
		},
	});
};

// handle control message delete
// the only way to recreate message is running `/config control-channel`
// command again
const handleMessageDelete = async (message) => {
	const guildId = message.guildId;

	const savedMessage = await getControlChannelMessage(guildId);

	if (
		!savedMessage ||
		savedMessage.id !== message.id ||
		savedMessage.channelId !== message.channelId
	)
		return;

	deleteControlChannelMessage(guildId);

	const client = getClient();

	// no db? simply ignore
	if (!client.db) return;

	await client.db.guild.update({
		where: {
			controlChannelId: message.channelId,
			controlChannelMessageId: message.id,
			guildId,
		},
		data: {
			controlChannelMessageId: null,
		},
	});
};

const updateControlMessage = async (guildId, track) => {
	const ids = await getControlChannelIds(guildId);
	if (!ids) return;

	const client = getClient();
	let channel = client.channels?.cache?.get(ids.channelId);
	if (!channel && guildId) {
		const guild = client.guilds?.cache?.get(guildId);
		if (guild) channel = await guild.channels.fetch(ids.channelId).catch(() => null);
	}
	if (!channel?.messages) return;

	let payload;
	try {
		payload = controlChannelMessage({ guildId, track });
	} catch (err) {
		client.warn("Control panel: build payload failed", err?.message ?? err);
		return;
	}
	try {
		const message = await channel.messages.fetch(ids.messageId).catch((e) => {
			client.warn("Control panel: fetch message failed", e?.message ?? e);
			return null;
		});
		if (!message) return;
		await message.edit(payload);
	} catch (err) {
		client.warn("Control panel: edit failed", err?.message ?? err);
	}
};

const updatePauseControlMessage = async (guildId, track) => {
	const ids = await getControlChannelIds(guildId);
	if (!ids) return;

	const client = getClient();
	let channel = client.channels?.cache?.get(ids.channelId);
	if (!channel && guildId) {
		const guild = client.guilds?.cache?.get(guildId);
		if (guild) channel = await guild.channels.fetch(ids.channelId).catch(() => null);
	}
	if (!channel?.messages) return;

	try {
		const payload = controlChannelMessage({ guildId, track, isPause: true });
		const message = await channel.messages.fetch(ids.messageId).catch(() => null);
		if (!message) return;
		await message.edit(payload);
	} catch (err) {
		client.warn("Control panel: pause edit failed", err?.message ?? err);
	}
};

const runIfNotControlChannel = async (player, cb) => {
	const guildId = player.guildId ?? player.guild;
	const controlMessage = await getControlChannelMessage(guildId);
	const textChannelId = player.textChannelId ?? player.textChannel;

	if (textChannelId !== controlMessage?.channelId) {
		return cb();
	}
};

/**
 * @param {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @param {import("../lib/MusicEvents").ILavalinkTrack} track
 */
const updateNowPlaying = async (player, track) => {
	return runIfNotControlChannel(player, async () => {
		const client = getClient();
		const textChannelId = player.textChannelId ?? player.textChannel;
		const emb = trackUpdateEmbed({ track, player });

		const nowPlaying = await client.channels.cache
			.get(textChannelId)
			.send({ embeds: [emb] })
			.catch(client.warn);

		if (typeof player.setNowplayingMessage === "function") {
			player.setNowplayingMessage(client, nowPlaying);
		}
	});
};

/**
 * @param {import("discord.js").Interaction} interaction
 */
const preventInteraction = async (interaction) => {
	if (!interaction.channelId) return;

	const controlChannelMessage = await getControlChannelMessage(interaction.guildId);

	if (!controlChannelMessage || controlChannelMessage.channelId !== interaction.channelId)
		return;

	return interaction.reply({
		embeds: [
			redEmbed({
				desc: "You can't run commands in dedicated Server Control Channel!",
			}),
		],
		flags: MessageFlags.Ephemeral,
	});
};

/**
 * Refresh the control channel embed for every guild that has one configured.
 * Call this when the bot comes online so control panels show correct state (or "No song currently playing").
 */
const refreshAllControlChannels = async () => {
	const client = getClient();
	if (!client?.db) return;

	const guilds = await client.db.guild.findMany({
		where: {
			controlChannelId: { not: null },
			controlChannelMessageId: { not: null },
		},
		select: { guildId: true },
	});

	const engine = client.manager?.Engine;
	for (const g of guilds) {
		let track = null;
		if (engine) {
			const player =
				(typeof engine.getPlayer === "function" ? engine.getPlayer(g.guildId) : null) ??
				engine.players?.get?.(g.guildId);
			if (player?.track) track = player.track;
		}
		await updateControlMessage(g.guildId, track).catch((err) => {
			if (client.config?.OPLevel > 1) client.warn("Control channel refresh failed for guild " + g.guildId, err?.message ?? err);
		});
	}
};

module.exports = {
	handleMessageDelete,
	setControlChannelMessage,
	getControlChannelMessage,
	deleteControlChannelMessage,
	updateControlMessage,
	updatePauseControlMessage,
	setDbControlChannel,
	updateNowPlaying,
	runIfNotControlChannel,
	preventInteraction,
	refreshAllControlChannels,
};
