const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const { fetchData } = require("../../util/utils.js");

const command = new SlashCommand()
	.setName("raccoon")
	.setDescription("Get a random image/fact of raccoon")
	.setRun(async (client, interaction) => {
		try {
			const data = await fetchData("https://some-random-api.com/animal/raccoon");

			const statsEmbed = new EmbedBuilder()
				.setTitle("🦝")
				.setImage(data.image)
				.setDescription(`Fact: ${data.fact}`)
				.setFooter({ text: "RACCOON!" });
			return interaction.reply({ embeds: [statsEmbed], ephemeral: false });
		} catch (err) {
			console.log(err);
		}
	});

module.exports = command;
