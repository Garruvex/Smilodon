const { getClient } = require("../bot");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { escapeMarkdown } = require("discord.js");

const guildSpecificIDs = [
	"427106982109904899",
	// "237020689465475073,"
];

/**
 * @typedef {object} AddQueueEmbedParams
 * @property {import("cosmicord.js").CosmiTrack} track
 * @property {import("../lib/clients/MusicClient").CosmicordPlayerExtended} player
 * @property {string} requesterId
 *
 * @param {AddQueueEmbedParams}
 */
const addQueuePositionEmbed = ({ track, player, requesterId }, position = undefined) => {
	const client = getClient();

	const title = escapeMarkdown(track.title).replace(/\]|\[/g, "");

	const embed = new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setAuthor({ name: "Added to queue", iconURL: client.config.iconURL })
		.setDescription(`[${title}](${track.uri})` || "No Title")
		.setURL(track.uri)
		.addFields([
			{
				name: "Added by",
				value: `<@${requesterId}>`,
				inline: true,
			},
			{
				name: "Duration",
				value: track.isStream
					? `\`LIVE 🔴 \``
					: `\`${client.ms(track.duration, {
							colonNotation: true,
							secondsDecimalDigits: 0,
					  })}\``,
				inline: true,
			},
		]);

	try {
		embed.setThumbnail(track.displayThumbnail("maxresdefault"));
	} catch (err) {
		embed.setThumbnail(track.thumbnail);
	}

	if (player.queue.totalSize > 1) {
		embed.addFields([
			{
				name: "Position in queue",
				value: `${position ?? player.queue.size}`,
				inline: true,
			},
		]);
	}

	return embed;
};

function showPlayerPositionBar(currentPosition, totalDuration, isPause = false, barLength = 10) {
	// console.log(currentPosition, totalDuration);
	// console.log(isPause);
	const playedProportion = currentPosition / totalDuration;
	const playedLength = Math.round(playedProportion * barLength);
	const remainingLength = Math.max(0, barLength - playedLength - 1);

	const progressDoneEmoji = "<:progressed:1172214967446024262>"; // Replace with the actual emoji ID for "played" part
	const progressLeftEmoji = "<:progress:1172214989763915846>"; // Replace with the actual emoji ID for "remaining" part
	const progressRunEmoji = "<a:yhota_run2:1172216976207261776>";
	const progressStopEmoji = "<:yohta_stop:1172239599586770975>";

	return (
		progressDoneEmoji.repeat(playedLength) +
		(isPause ? progressStopEmoji : progressRunEmoji) +
		progressLeftEmoji.repeat(remainingLength)
	);
}

async function fetchData(url) {
	try {
		const response = await fetch(url);
		const data = await response.json();

		// Use 'data' here outside of the fetch block but still inside the async function
		console.log(data);
		return data;
	} catch (error) {
		console.error("Error fetching data:", error);
	}
}

function emptyStrHandler(interaction, text) {
	if (text.trim().length === 0) {
		return interaction.reply({
			content: "You need to provide a sentence to translate.",
			ephemeral: true,
		});
	}
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getValue(obj, key) {
	const value = obj?.[key];
	if (!value || value === undefined || value === null) return "N/A";
	if (Array.isArray(value) && value.length === 0) return ["N/A"];
	return value;
}

async function getE621ImageAndReply(
	interaction,
	searchSite = "e621",
	replyColour = "blue",
	limitFavCount = 100
) {
	const search = interaction.options.getString("query") || "";

	const baseURL = `https://${searchSite}.net/posts.json?tags=${search}+order:random+favcount:>${limitFavCount}&limit=1`;

	const e621ICON =
		"https://cdn.discordapp.com/attachments/1125098716886474802/1165536799666475008/E621Logo_1_10.png?ex=654735bb&is=6534c0bb&hm=acb5ceb6cfa4878103029119378e7c4019a22051d5f4be31ddbbbfd297cf444d&";

	const Image404 = "https://img.lovepik.com/element/40021/7866.png_1200.png";

	const maxLength = 1000;

	const data = (await fetchData(baseURL)).posts[0];
	if (data === undefined) {
		return await interaction.reply({
			embeds: [
				new EmbedBuilder().setDescription(
					"no result, please try a different tag"
				),
			],
			ephemeral: true,
		});
	}

	await interaction.deferReply({ ephemeral: false });

	try {
		var descriptionStr = `Description: \n${getValue(data, "description")}`;
		if (descriptionStr.length > maxLength) {
			descriptionStr = descriptionStr.slice(0, maxLength - 3) + "...";
		}

		var tags_string = getValue(data.tags, "general").join(", ");
		if (tags_string.length > maxLength) {
			tags_string = tags_string.slice(0, maxLength - 3) + "...";
		}

		const e621EmbedIntro = new EmbedBuilder()
			.setTitle(
				`[${
					interaction.member.nickname || interaction.user.username
				}] wants to find a <${
					search || "RANDOM"
				}> image on e621 *notices your bulge* UwU What's This?`
			)
			.setAuthor({
				name: "e621",
				iconURL: e621ICON,
				proxyIconURL: e621ICON,
			})
			// .setImage(getValue(data.file, "url"))
			.setDescription(`\`\`\`yml\n${descriptionStr}\`\`\``)
			.setColor(replyColour)
			.setThumbnail(
				interaction.user.displayAvatarURL({
					format: "png",
					dynamic: true,
				})
			);

		const e621EmbedMeta = new EmbedBuilder()
			.setThumbnail(
				getValue(data.preview, "url") != "N/A"
					? getValue(data.preview, "url")
					: Image404
			)
			.setColor(replyColour)
			.setFields([
				{
					name: "Meta",
					value: `\`\`\`yml\nID: ${getValue(
						data,
						"id"
					)}\nCreated At: ${getValue(
						data,
						"created_at"
					)}\nUpdated At: ${getValue(
						data,
						"updated_at"
					)}\nScore:  🔼${getValue(data, "score").up} | 🔽 ${
						getValue(data, "score").down
					} | 📈 ${getValue(data, "score").total} | ❤️: ${getValue(
						data,
						"fav_count"
					)} \nRating: ${getValue(data, "rating")}\`\`\``,
					inline: false,
				},
				{
					name: `Artists & Characters`,
					value: `\`\`\`yml\nArtist: ${getValue(
						data.tags,
						"artist"
					).join(" |")}\nCopyright: ${getValue(
						data.tags,
						"copyright"
					).join(", ")} \nCharacter: ${getValue(
						data.tags,
						"character"
					).join(", ")} \nSpecies: ${getValue(
						data.tags,
						"species"
					).join(", ")} \`\`\``,
					inline: true,
				},
				{
					name: `File`,
					value: `\`\`\`yml\nWidth: ${getValue(
						data.file,
						"width"
					)}\nHeight: ${getValue(
						data.file,
						"height"
					)} \nExtension: ${getValue(
						data.file,
						"ext"
					)} \nSize: ${getValue(data.file, "size")} \`\`\``,
					inline: true,
				},
			]);
		const e621EmbedTags = new EmbedBuilder().setColor(replyColour).setFields([
			{
				name: "Tags",
				value: `\`\`\`yml\n${tags_string}\`\`\``,
				inline: false,
			},
		]);

		const e621EmbedSource = new EmbedBuilder().setColor(replyColour).setFields([
			{
				name: `Sources`,
				value: `\n${getValue(data, "sources").join("\n")}`,
				inline: false,
			},
		]);

		const imgURL =
			getValue(data.file, "url") === "N/A"
				? Image404
				: getValue(data.file, "url");

		const e621Attach = new AttachmentBuilder()
			.setFile(imgURL)
			.setName(
				`SPOILER_IMG_${imgURL.split("/").pop()}.${
					getValue(data.file, "ext") != "N/A"
						? getValue(data.file, "ext")
						: "jpg"
				}`
			);

		return await interaction.editReply({
			embeds: [e621EmbedIntro, e621EmbedMeta, e621EmbedTags, e621EmbedSource],
			files: [e621Attach],
		});
	} catch (e) {
		console.log(e);
		interaction.editReply({ content: "\u200b" });
		return await interaction.followUp({
			embeds: [
				new EmbedBuilder().setDescription(
					"something went wrong, please try again later"
				),
			],
			ephemeral: false,
		});
	}
}

module.exports = {
	fetchData,
	getE621ImageAndReply,
	getRandomInt,
	emptyStrHandler,
	addQueuePositionEmbed,
	guildSpecificIDs,
	showPlayerPositionBar,
};
