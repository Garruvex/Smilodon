const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
	.setName("replay")
	.setDescription("Replay current playing track")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager.Engine) {
			player = client.manager.Engine.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Lavalink node is not connected"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("I'm not playing anything."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
		
		await interaction.deferReply();
		
		player.seek(0);
		
		let song = player.queue.current;
		const { getTrackDisplay } = require("../../util/utils");
		const t = getTrackDisplay(song) || {};
		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`Replay [${ t.title }](${ t.uri })`),
			],
		});
	});

module.exports = command;
