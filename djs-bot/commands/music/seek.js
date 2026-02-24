const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const ms = require("ms");

const command = new SlashCommand()
	.setName("seek")
	.setDescription("Seek to a specific time in the current song.")
	.addStringOption((option) =>
		option
			.setName("time")
			.setDescription("Seek to time you want. Ex 1h 30m | 2h | 80m | 53s")
			.setRequired(true),
	)
	.setRun(async (client, interaction) => {
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
						.setDescription("There is no music playing."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
		
		await interaction.deferReply();

		const rawArgs = interaction.options.getString("time");
		const args = rawArgs.split(' ');
		var rawTime = [];
		for (let i = 0; i < args.length; i++){
			rawTime.push(ms(args[i]));
		}
		const time = rawTime.reduce((a,b) => a + b, 0);
		const position = player.position;
		const cur = player.queue.current;
		const duration = cur?.info?.duration ?? cur?.duration ?? 0;
		
		if (time <= duration) {
			player.seek(time);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription(
							`⏩ | **${ cur?.info?.title ?? cur?.title ?? "Track" }** has been ${
								time < position? "rewound" : "seeked"
							} to **${ ms(time) }**`,
						),
				],
			});
		} else {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription(
							`Unable to seek current playing track. This may be due to exceeding track duration or an incorrect time format. Please check and try again`,
						),
				],
			});
		}
	});

module.exports = command;
