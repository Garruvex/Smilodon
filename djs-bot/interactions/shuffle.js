const SlashCommand = require("../lib/SlashCommand");
const { MessageFlags } = require("discord.js");
const { colorEmbed } = require("../util/embeds");
const { ccInteractionHook } = require("../util/interactions");
const playerUtil = require("../util/player");

const command = new SlashCommand()
	.setName("shuffle")
	.setCategory("cc")
	.setDescription("Shuffle interaction")
	.setRun(async (client, interaction, options) => {
		const { error, data } = await ccInteractionHook(client, interaction, {
			minimumQueueLength: 1,
		});

		if (error || !data || data instanceof Promise) return data;

		const { player, channel, sendError } = data;

		playerUtil.shuffleQueue(player);

		return interaction.reply({
			embeds: [colorEmbed({ desc: "🔀 | **Successfully shuffled the queue.**" })],
			flags: MessageFlags.Ephemeral,
		});
	});

module.exports = command;
