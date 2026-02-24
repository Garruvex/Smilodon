const { MessageFlags } = require("discord.js");
const { embedNoLLNode, embedNoTrackPlaying, embedNotEnoughSong } = require("./embeds");

/**
 * @param {import("../lib/Bot")} client
 * @param {import("discord.js").Interaction} interaction
 * @param {{minimumQueueLength?: number}}
 */
const ccInteractionHook = async (client, interaction, { minimumQueueLength } = {}) => {
	if (!interaction.isButton()) {
		throw new Error("Invalid interaction type for this command");
	}

	const channel = await client.getChannel(client, interaction, {
		flags: MessageFlags.Ephemeral,
	});

	/**
	 * @template T
	 * @param {T} data
	 */
	const returnError = (data) => {
		return {
			error: true,
			data,
		};
	};

	if (!channel) {
		return returnError(undefined);
	}

	/**
	 * @param {import("discord.js").EmbedBuilder} embed
	 */
	const sendError = (embed) => {
		return interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	};

	const engine = client.manager?.Engine;
	if (!engine) {
		return returnError(sendError(embedNoLLNode()));
	}

	const player =
		(typeof engine.getPlayer === "function" ? engine.getPlayer(interaction.guild.id) : null) ??
		engine.players?.get?.(interaction.guild.id) ??
		null;

	if (!player) {
		return returnError(sendError(embedNoTrackPlaying()));
	}

	const queueLen = player.queue?.tracks?.length ?? player.queue?.size ?? player.queue?.length ?? 0;
	if (
		typeof minimumQueueLength === "number" &&
		queueLen < minimumQueueLength
	) {
		return returnError(sendError(embedNotEnoughSong()));
	}

	return { error: false, data: { channel, sendError, player } };
};

const checkPlayerVolume = async (player, interaction) => {
	if (typeof player.volume !== "number")
		return interaction.reply({
			content: "Something's wrong: volume is not a number",
			flags: MessageFlags.Ephemeral,
		});
};

module.exports = {
	ccInteractionHook,
	checkPlayerVolume,
};
