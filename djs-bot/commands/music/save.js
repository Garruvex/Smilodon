const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const prettyMsModule = require("pretty-ms");
const prettyMilliseconds = typeof prettyMsModule === "function" ? prettyMsModule : (prettyMsModule?.default ?? prettyMsModule);

const command = new SlashCommand()
	.setName("save")
	.setDescription("Saves current song to your DM's")
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
						.setDescription("There is no music playing right now."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
		
		const sendtoDmEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({
				name: "Saved track",
				iconURL: `${ interaction.user.displayAvatarURL({ dynamic: true }) }`,
			})
			.setDescription(
				`**Saved [${ (require("../../util/utils").getTrackDisplay(player.queue.current) || {}).title || player.queue.current?.info?.title || "Track" }](${ (require("../../util/utils").getTrackDisplay(player.queue.current) || {}).uri || player.queue.current?.info?.uri || "" }) to your DM**`,
			)
			.addFields(
				{
					name: "Track Duration",
					value: `\`${ prettyMilliseconds((player.queue.current?.info ?? player.queue.current)?.duration ?? 0, {
						colonNotation: true,
					}) }\``,
					inline: true,
				},
				{
					name: "Track Author",
					value: `\`${ player.queue.current?.info?.author ?? player.queue.current?.author ?? "Unknown" }\``,
					inline: true,
				},
				{
					name: "Requested Guild",
					value: `\`${ interaction.guild }\``,
					inline: true,
				},
			);
		
		interaction.user.send({ embeds: [sendtoDmEmbed] });
		
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						"Please check your **DMs**. If you didn't receive any message from me please make sure your **DMs** are open",
					),
			],
			flags: MessageFlags.Ephemeral,
		});
	});

module.exports = command;
