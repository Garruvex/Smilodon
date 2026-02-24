const SlashCommand = require("../../lib/SlashCommand.js");
const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
	.setName("qa")
	.setDescription("create a Q & A")
	.addStringOption((option) =>
		option.setName("question").setDescription("your question?").setRequired(true)
	)
	.addStringOption((option) =>
		option.setName("answer").setDescription("your answer..").setRequired(true)
	)
	.addAttachmentOption((option) =>
		option
			.setName("image")
			.setDescription("the image you want to add")
			.setRequired(false)
	)
	.addBooleanOption((option) =>
		option.setName("spoiler").setDescription("is it spoiler?").setRequired(false)
	)
	.setRun(async (client, interaction) => {
		const question = interaction.options.getString("question");
		const answer = interaction.options.getString("answer");
		const file = interaction.options.getAttachment("image");
		const isSpoiler = interaction.options.getBoolean("spoiler") || true;
		try {
			const questionEmbed = new EmbedBuilder()
				.setTitle(
					`Question: ${
						question.endsWith("?") ? question : question + "?"
					}`
				)
				.setColor("#ff3300")
				.setDescription(
					"Answer: " +
						(isSpoiler ? `\" ||${answer}|| \"` : `${answer}`)
				)
				// .setFooter({ text: "Powew B-By OwO! *nuzzles*" })
				.setAuthor({
					name:
						interaction.member.nickname ||
						interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				});
			// const anserEmbed = new EmbedBuilder()
			// 	.setTitle(
			// 		`Question: ${
			// 			question.endsWith("?") ? question : question + "?"
			// 		}`
			// 	)
			// 	.setColor("#ff3300")
			// 	.setDescription(
			// 		"Answer: " + (isSpoiler ? `||${answer}||` : `${answer}`)
			// 	)
			// 	// .setFooter({ text: "Powew B-By OwO! *nuzzles*" })
			// 	.setAuthor({
			// 		name:
			// 			interaction.member.nickname ||
			// 			interaction.user.username,
			// 		iconURL: interaction.user.displayAvatarURL(),
			// 	});
			replyObj = { embeds: [questionEmbed] };
			if (file) {
				if (file.contentType && file.contentType.startsWith("image/")) {
					attachEmbed = new AttachmentBuilder().setFile(file.url);
				} else {
					return interaction.reply({
						content: "not an image, please try again",
						flags: MessageFlags.Ephemeral,
					});
				}

				if (isSpoiler) {
					attachEmbed.setName(`SPOILER_${file.name}`);
				}
				replyObj["files"] = [attachEmbed];
			}
			return await interaction.reply(replyObj);
		} catch (e) {
			console.log(e);
			return interaction.reply({
				content: "somthing went wrong, please try again",
				flags: MessageFlags.Ephemeral,
			});
		}
	});

module.exports = command;
