const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const { spliceQueue, skip } = require("../../util/player");
const { updateControlMessage } = require("../../util/controlChannel");

const command = new SlashCommand()
	.setName("skipto")
	.setDescription("skip to a specific song in the queue")
	.addNumberOption((option) =>
		option
			.setName("number")
			.setDescription("The number of tracks to skipto")
			.setRequired(true)
	)

	.setRun(async (client, interaction, options) => {
		const args = interaction.options.getNumber("number");
		//const duration = player.queue.current.duration

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
						.setDescription("I'm not in a channel."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		const position = Number(args);
		const queueSize = player.queue?.tracks?.length ?? player.queue?.size ?? 0;

		if (!position || position < 1 || position > queueSize) {
			const thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("❌ | Invalid position!");
			return interaction.editReply({ embeds: [thing] });
		}

		if (position === 1) {
			const skipStatus = await skip(player);
			if (skipStatus === 1) {
				const thing = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("❌ | There is nothing to skip to.");
				return interaction.editReply({ embeds: [thing] });
			}
		} else {
			await spliceQueue(player, 0, position - 1);
			await player.skip();
		}

		const nextTrack =
			player.queue?.current ??
			player.queue?.tracks?.[0] ??
			player.queue?.[0];
		updateControlMessage(interaction.guildId, nextTrack ?? undefined).catch(() => {});

		const thing = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription("✅ | Skipped to position " + position);

		return interaction.editReply({ embeds: [thing] });
	});

module.exports = command;
