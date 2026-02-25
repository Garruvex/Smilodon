const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const SRA_BASE = "https://some-random-api.com/premium/petpet";

const command = new SlashCommand()
	.setName("petpet")
	.setDescription("Generate a pet pet gif from a user's avatar")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("User whose avatar to use (default: you)")
			.setRequired(false)
	)
	.setRun(async (client, interaction) => {
		try {
			const user = interaction.options.getUser("user") || interaction.user;
			const avatarUrl = user.displayAvatarURL({ format: "png", size: 256 });

			const url = new URL(SRA_BASE);
			url.searchParams.set("avatar", avatarUrl);

			// API returns the image directly at this URL (like img.src), not JSON
			const imageUrl = url.toString();

			const embed = new EmbedBuilder()
				.setTitle("🐾 Pet pet!")
				.setImage(imageUrl)
				.setDescription(`${user.username} got pet pet'd`)
				.setFooter({ text: "Some Random API" });

			return interaction.reply({ embeds: [embed] });
		} catch (e) {
			console.error(e);
			return interaction.reply({
				content: "Failed to generate pet pet image. Try again later.",
				flags: MessageFlags.Ephemeral,
			});
		}
	});

module.exports = command;
