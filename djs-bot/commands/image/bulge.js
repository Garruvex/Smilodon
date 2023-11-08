const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const { fetchData } = require("../../util/utils.js");

const slashKey = "bulge";

const command = new SlashCommand()
	.setName(slashKey)
	.setDescription("Get a random image of a big baggy")
	.setRun(async (client, interaction) => {
		try {
			const data = await fetchData(`https://v2.yiff.rest/furry/${slashKey}`);

			const statsEmbed = new EmbedBuilder()
				.setTitle("✋🦝🤚")
				.setImage(data.images[0].url)
				.setDescription(`OwO whats this?*notices bulge*`)
				.setFooter({ text: "🦦" });
			return interaction.reply({ embeds: [statsEmbed], ephemeral: false });
		} catch (e) {
			console.log(e);
			return interaction.reply({ content: "fail to get image" });
		}
	});

module.exports = command;
