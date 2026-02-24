const SlashCommand = require("../lib/SlashCommand");
const { ccInteractionHook } = require("../util/interactions");
const { updateControlMessage } = require("../util/controlChannel");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
	.setName("247")
	.setCategory("cc")
	.setDescription("24/7 mode – stay in voice channel (toggle)")
	.setRun(async (client, interaction) => {
		const { error, data } = await ccInteractionHook(client, interaction);
		if (error || !data || data instanceof Promise) return data;

		const { player, sendError } = data;
		const twentyFourSeven = player.get("twentyFourSeven");

		player.set("twentyFourSeven", !twentyFourSeven);

		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`**24/7 mode is** \`${!twentyFourSeven ? "ON" : "OFF"}\``)
			.setFooter({
				text: `The bot will ${!twentyFourSeven ? "now" : "no longer"} stay connected to the voice channel 24/7.`,
			});

		const currentTrack = player.queue?.current;
		if (currentTrack) updateControlMessage(interaction.guildId, currentTrack);

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	});

module.exports = command;
