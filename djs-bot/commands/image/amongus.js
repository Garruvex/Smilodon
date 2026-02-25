const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const { isImageUrl } = require("../../util/utils.js");

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

			// Ensure we get a static PNG and explicitly set the extension
			const avatarUrl = user.displayAvatarURL({ extension: "png", size: 256 });
			const username = user.displayName || user.username; 

			const url = new URL(SRA_BASE);
			url.searchParams.set("avatar", avatarUrl);
			url.searchParams.set("username", username);
			url.searchParams.set("impostor", String(impostor));

			const imageUrl = url.toString();
			const ok = await isImageUrl(imageUrl);
			if (!ok) {
				return interaction.reply({
					content:
						"Image API is unavailable or returned an error. Try again later.",
					flags: MessageFlags.Ephemeral,
				});
			}

			const embed = new EmbedBuilder()
				.setTitle(impostor ? "🔴 Impostor" : "Crewmate")
				.setImage(imageUrl)
				.setDescription(`${username} was ${impostor ? "the Impostor" : "a Crewmate"}.`)
				.setColor(impostor ? 0xFF0000 : 0x00FF00) // Optional: add some color flair!
				.setFooter({ text: "Powered by Some Random API" });

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
