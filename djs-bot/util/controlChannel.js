const { Message } = require("discord.js");
const { getClient } = require("../bot");
const { controlChannelMessage, redEmbed, trackStartedEmbed } = require("./embeds");
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

	if (!client.db) throw new Error("No database configured");

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

	if (!client.db) throw new Error("No db configured");

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

	if (!client.db) throw new Error("No database configured");

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
	const message = await getControlChannelMessage(guildId);

	if (!message) throw new Error("Guild doesn't have control channel");

	return message.edit(controlChannelMessage({ guildId, track }));
};

const updatePauseControlMessage = async (guildId, track) => {
	const message = await getControlChannelMessage(guildId);

	if (!message) throw new Error("Guild doesn't have control channel");

	return message.edit(controlChannelMessage({ guildId, track, isPause: true }));
};

const runIfNotControlChannel = async (player, cb) => {
	const controlMessage = await getControlChannelMessage(player.guild);

	if (player.textChannel !== controlMessage?.channelId) {
		return cb();
	}
};

/**
 * @param {import("../lib/clients/MusicClient").CosmicordPlayerExtended} player
 * @param {import("cosmicord.js").CosmiTrack} track
 */
const updateNowPlaying = async (player, track) => {
	return runIfNotControlChannel(player, async () => {
		const client = getClient();

		const emb = trackUpdateEmbed({ track, player });

		const nowPlaying = await client.channels.cache
			.get(player.textChannel)
			.send({ embeds: [emb] })
			.catch(client.warn);

		player.setNowplayingMessage(client, nowPlaying);
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
		ephemeral: true,
	});
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
};
