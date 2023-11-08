const SlashCommand = require("../../lib/SlashCommand");
const { getE621ImageAndReply } = require("../../util/utils.js");

const command = new SlashCommand()
	.setName("e926")
	.setDescription("Search on e926 for a random image")
	.addStringOption(
		(option) => option.setName("query").setDescription("add tags to search")
		// .setRequired(true)
	)
	.setRun(async (interaction) => {
		try {
			getE621ImageAndReply(
				interaction,
				(searchSite = "e926"),
				(replyColour = "#66ff33"),
				(limitFavCount = 100)
			);
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while processing your command.",
				ephemeral: true,
			});
		}
	});

module.exports = command;
