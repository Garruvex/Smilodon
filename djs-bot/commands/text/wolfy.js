const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const { emptyStrHandler } = require("../../util/utils.js");

const command = new SlashCommand()
	.setName("wolfy")
	.setDescription("translate a sentence into owo languages")
	.addStringOption((option) =>
		option.setName("text").setDescription("wooooof!").setRequired(true)
	)
	.setRun(async (client, interaction) => {
		const text = interaction.options.getString("text");
		emptyStrHandler(interaction, text);
		const dogNoises = [
			"Woof",
			"Bark",
			"Arf",
			"Ruff",
			"Bow-wow",
			"Yip",
			"Yap",
			"Howl",
			"Growl",
			"Snarl",
			"Baying",
			"Whine",
			"Whimper",
			"Yelp",
			"Grrr",
		];
		try {
			const words = text.split(" "); // Split the sentence into words
			const dogSentence = words.map(() => {
				const randomIndex = Math.floor(Math.random() * dogNoises.length); // Get a random index
				return dogNoises[randomIndex].toLowerCase(); // Return a random word from the dogNoises array in lowercase
			});

			const authorMention = `<@!${interaction.user.id}>`;

			const statsEmbed = new EmbedBuilder()
				// .setTitle(`${authorMention} Rawr!`)
				.setTitle(`${dogSentence.join(" ")}`)
				// .setImage(data.image)
				.setColor("#cc00cc")
				// .setDescription(`${dogSentence.join(" ")}`)
				.setFooter({ text: "Woooooooooooof? *waises paw*" })
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
