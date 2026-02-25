const SlashCommand = require("../lib/SlashCommand");
const { MessageFlags } = require("discord.js");
const { redEmbed } = require("../util/embeds");
const { ccInteractionHook } = require("../util/interactions");
const playerUtil = require("../util/player");
const { updateControlMessage } = require("../util/controlChannel");

const command = new SlashCommand()
	.setName("prev")
	.setCategory("cc")
	.setDescription("Prev interaction")
	.setRun(async (client, interaction, options) => {
		const { error, data } = await ccInteractionHook(client, interaction);

		if (error || !data || data instanceof Promise) return data;

		const { player, channel, sendError } = data;

		const status = await playerUtil.playPrevious(player);

		if (status === 1)
			return interaction.reply({
				embeds: [
					redEmbed({
						desc: "There is no previous song in the queue.",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});

		const currentTrack =
			player.queue?.current ?? player.queue?.tracks?.[0] ?? player.queue?.[0];
		updateControlMessage(interaction.guildId, currentTrack ?? undefined).catch(() => {});

		return interaction.deferUpdate();
	});

module.exports = command;
