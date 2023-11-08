const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const { optionsLanguageList } = require("../../util/languageList.js");

const {
	translate,
	Translator,
	speak,
	singleTranslate,
	batchTranslate,
	languages,
	isSupported,
	getCode,
} = require("google-translate-api-x");

const command = new SlashCommand()
	.setName("translate")
	.setDescription("translate a sentence any language, default is Chinese")
	.addStringOption((option) =>
		option.setName("query").setDescription("add sentence to search").setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("language")
			.setDescription("Select a Language")
			// .setRequired(true)
			// Add choices from the optionsList
			.addChoices(...optionsLanguageList)
	)
	.setRun(async (client, interaction) => {
		const query = interaction.options.getString("query");
		const language = interaction.options.getString("language") || "zh-TW";
		await interaction.deferReply({ ephemeral: false });
		try {
			const result = await translate(query, {
				to: "auto",
				to: language,
				autoCorrect: true,
			});

			const statsEmbed = new EmbedBuilder()
				// .setTitle(`${authorMention} w-want to teww you that...`)
				// .setImage(data.image)
				.setTitle(
					`Translator [${
						optionsLanguageList.find(
							(lang) => lang.value === language
						).name
					}]`
				)
				.setColor("#99ff99")
				.setDescription(
					`\`\`\`yml\nOriginal: ${query}\n\n\nResults: ${result.text}\n\n\nPronunciation: ${result.pronunciation}\`\`\``
				)
				.setFooter({ text: "Powew By GoogleX!" })
				.setAuthor({
					name:
						interaction.member.nickname ||
						interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				});
			return interaction.editReply({ embeds: [statsEmbed], ephemeral: false });
		} catch (e) {
			console.log(e);
			return interaction.editReply({
				content: "somthing went wrong, please try again",
				ephemeral: true,
			});
		}
	});

module.exports = command;
