const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
	.setName("loop")
	.setDescription("Loops the current song")
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
						.setDescription("Nothing is playing right now."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
		
		const nextMode = player.repeatMode === "track" ? "off" : "track";
		await player.setRepeatMode(nextMode);
		const trackRepeat = player.repeatMode === "track" ? "enabled" : "disabled";
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`👍 | **Loop has been \`${ trackRepeat }\`**`),
			],
		});
	});

module.exports = command;
