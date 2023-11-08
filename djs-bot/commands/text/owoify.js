const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { startOwoifier } = require("../../util/owoifier.js");
const { emptyStrHandler } = require("../../util/utils.js");

const command = new SlashCommand()
	.setName("owoify")
	.setDescription("translate a sentence into owo languages")
	.addStringOption((option) =>
		option.setName("text").setDescription("add sentence to search").setRequired(true)
	)
	.setRun(async (client, interaction) => {
		const text = interaction.options.getString("text");
		emptyStrHandler(interaction, text);
		try {
			const authorMention = `<@!${interaction.user.id}>`;
			const owoText = startOwoifier(text);
			const statsEmbed = new EmbedBuilder()
				// .setTitle(`${authorMention} w-want to teww you that...`)
				// .setImage(data.image)
				.setTitle(`${owoText}`)
				.setColor("#ffbdde")
				// .setDescription(`${owoText}`)
				.setFooter({ text: "Powew B-By OwO! *nuzzles*" })
				.setAuthor({
					name:
						interaction.member.nickname ||
						interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				});
			return interaction.reply({ embeds: [statsEmbed], ephemeral: false });
		} catch (e) {
			console.log(e);
			return interaction.reply({
				content: "somthing went wrong, please try again",
				ephemeral: true,
			});
		}
	});

module.exports = command;
