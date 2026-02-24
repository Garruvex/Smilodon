const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const { removeTrack } = require("../../util/player");

const command = new SlashCommand()
	.setName("remove")
	.setDescription("Remove track you don't want from queue")
	.addNumberOption((option) =>
		option.setName("number").setDescription("Enter track number.").setRequired(true)
	)

	.setRun(async (client, interaction) => {
		const args = interaction.options.getNumber("number");

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
						.setDescription("There are no songs to remove."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		const position = Number(args) - 1;
		const queueSize = player.queue?.tracks?.length ?? player.queue?.size ?? 0;
		if (position > queueSize) {
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`Current queue has only **${queueSize}** track`
				);
			return interaction.editReply({ embeds: [thing] });
		}

		removeTrack(player, position);

		const number = position + 1;
		let removeEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`Removed track number **${number}** from queue`);

		return interaction.editReply({ embeds: [removeEmbed] });
	});

module.exports = command;
