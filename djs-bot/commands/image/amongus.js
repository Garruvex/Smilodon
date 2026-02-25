const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const SRA_BASE = "https://some-random-api.com/premium/amongus";

const command = new SlashCommand()
	.setName("amoogoos")
	.setDescription("Generate an amoogoos crewmate image from a user's avatar")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("User whose avatar to use (default: you)")
			.setRequired(false)
	)
	.addBooleanOption((option) =>
		option
			.setName("impostor")
			.setDescription("Show as impostor (red)")
			.setRequired(false)
	)
	.setRun(async (client, interaction) => {
		try {
			const user = interaction.options.getUser("user") || interaction.user;
			const impostor = interaction.options.getBoolean("impostor") ?? false;
			const avatarUrl = user.displayAvatarURL({ format: "png", size: 256 });
			const username = user.username;

			const url = new URL(SRA_BASE);
			url.searchParams.set("avatar", avatarUrl);
			url.searchParams.set("username", username);
			url.searchParams.set("impostor", String(impostor));

			const embed = new EmbedBuilder()
				.setTitle(impostor ? "🔴 Impostor" : "Crewmate")
				.setImage(url.toString())
				.setDescription(`${username} as ${impostor ? "an impostor" : "a crewmate"}`)
				.setFooter({ text: "Some Random API" });

			return interaction.reply({ embeds: [embed] });
		} catch (e) {
			console.error(e);
			return interaction.reply({
				content: "Failed to generate amoogoos image. Try again later.",
				flags: MessageFlags.Ephemeral,
			});
		}
	});

module.exports = command;
