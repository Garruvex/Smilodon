const { assert } = require("console");
const SlashCommand = require("../../lib/SlashCommand.js");
const { EmbedBuilder } = require("discord.js");
const { guildSpecificIDs } = require("../../util/utils.js");

const destiny2RaidPhase = ["raid", "掠奪"];
const updateIntervalSeconds = 1;

function createTextBar(count, maxVotes, barLength = 20) {
	const barUnit = maxVotes / barLength;
	const barSize = Math.round(count / barUnit);
	return "▓".repeat(barSize) + "░".repeat(barLength - barSize);
}

const command = new SlashCommand()
	.setName("vote")
	.setDescription("create a vote")
	.addStringOption((option) =>
		option.setName("title").setDescription("title of the pool").setRequired(true)
	)
	.addStringOption((option) =>
		option.setName("text").setDescription("description of the pool").setRequired(true)
	)
	.addIntegerOption((option) =>
		option
			.setName("duration")
			.setDescription("vote time duration (seconds)")
			.setMinValue(10)
			.setRequired(false)
	)
	.setRun(async (client, interaction) => {
		const title = interaction.options.getString("title");
		const text = interaction.options.getString("text");
		const duration = interaction.options.getInteger("duration") || undefined;
		try {
			const statsEmbed = new EmbedBuilder()
				// .setTitle(`${authorMention} w-want to teww you that...`)
				// .setImage(data.image)
				.setTitle(duration ? `[LIVE] Poll: ${title}` : `Poll: ${title}`)
				.setColor(duration ? "#66ff66" : "#ffffff")
				.setDescription(`${text}`)
				// .setFooter({ text: "Powew B-By OwO! *nuzzles*" })
				.setAuthor({
					name:
						interaction.member.nickname ||
						interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				});

			if (
				destiny2RaidPhase.some(
					(word) =>
						title.toLowerCase().includes(word) ||
						text.toLowerCase().includes(word)
				) &&
				interaction.guildId &&
				guildSpecificIDs.includes(interaction.guildId)
			) {
				const member = await interaction.guild.members.fetch(
					"785119912883650560"
				);
				// This will be the user's nickname if they have one, or their username if they don't
				const displayName = member
					? member.displayName
					: member.user.username;
				statsEmbed.setFooter({
					text: `💠${displayName}大大您這次輸出能>5萬嗎?`,
				});
			}
			await interaction.reply({ embeds: [statsEmbed], ephemeral: false });
			let replyMessage = await interaction.fetchReply();
			await replyMessage.react("⭕");
			await replyMessage.react("✖️");
			if (duration) {
				//update the countdown timer
				let durationCount = duration;
				let lastUpdateTime = Date.now();
				const updateInterval = setInterval(async () => {
					// Edit the message
					const currentTime = Date.now();
					const elapsedTime = currentTime - lastUpdateTime;

					let displayDurationCount = durationCount;
					if (durationCount <= 0) displayDurationCount = 0;
					if (
						durationCount <= 10 ||
						elapsedTime > 5000 ||
						durationCount === duration
					) {
						statsEmbed.setTitle(
							`[LIVE |⏰${displayDurationCount}s ] Poll: ${title}`
						);
						await interaction.editReply({
							embeds: [statsEmbed],
						});
						lastUpdateTime = currentTime;
					}
					durationCount -= updateIntervalSeconds;
				}, 1000 * updateIntervalSeconds);

				setTimeout(async () => {
					clearInterval(updateInterval);
					console.log("Vote Ended. Counting the votes...");
					const finalPollMessage = await interaction.fetchReply();

					const yesReaction =
						await finalPollMessage.reactions.resolve("⭕");
					const noReaction = await finalPollMessage.reactions.resolve(
						"✖️"
					);

					// Make sure the reactions exist
					if (!yesReaction || !noReaction) {
						console.log("Reactions not found");
						return finalPollMessage.edit(
							"*VOTE ERROR EMOJI NOT FOUND*"
						); // Exit the function if reactions are not found
					}

					// Fetch the users for each reaction
					const yesUsers = yesReaction
						? await yesReaction.users.fetch()
						: new Discord.Collection();
					const noUsers = noReaction
						? await noReaction.users.fetch()
						: new Discord.Collection();

					// Subtract the bot's own reaction if it exists
					const yesCount = yesReaction
						? yesUsers.size -
						  (yesUsers.has(client.user.id) ? 1 : 0)
						: 0;
					const noCount = noReaction
						? noUsers.size -
						  (noUsers.has(client.user.id) ? 1 : 0)
						: 0;

					// Create a text-based bar chart
					const results = [
						{ emoji: "⭕", count: yesCount },
						{ emoji: "✖️", count: noCount },
					];
					let barChart = results
						.map((result) => {
							// Log the result to make sure it's what we expect

							return `${result.emoji} ${createTextBar(
								result.count,
								yesCount + noCount
							)} ${result.count}`;
						})
						.join("\n");
					// console.log(barChart);
					statsEmbed.setTitle(
						duration
							? `[ENDED] Poll: ${title}`
							: `Poll: ${title}`
					);
					statsEmbed.setColor("#ff0000");
					statsEmbed.setDescription(
						`Poll ended! Results:\n\`\`\`\n${barChart}\n\`\`\``
					);

					await interaction.editReply({
						embeds: [statsEmbed],
						ephemeral: false,
					});
					await finalPollMessage.reactions
						.removeAll()
						.catch((error) =>
							console.error(
								"Failed to clear reactions:",
								error
							)
						);
					// await message.delete().catch(console.error);
				}, duration * 1000);
			}
			return interaction;
		} catch (e) {
			console.log(e);
			return interaction.reply({
				content: "somthing went wrong, please try again",
				ephemeral: true,
			});
		}
	});

module.exports = command;
