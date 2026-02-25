const { getClient } = require("../bot");
const {
	EmbedBuilder,
	AttachmentBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	escapeMarkdown,
} = require("discord.js");
const prettyMsModule = require("pretty-ms");
const prettyMilliseconds = typeof prettyMsModule === "function" ? prettyMsModule : (prettyMsModule?.default ?? prettyMsModule);

/** Normalize track for display (Lavalink-Client track.info shape) */
function getTrackDisplay(track) {
	if (!track) return null;
	const info = track.info ?? track;
	const title = info.title ?? track.title ?? "Unknown";
	const uri = info.uri ?? track.uri ?? "";
	const duration = Number(info.duration ?? track.duration ?? 0);
	const isStream = Boolean(info.isStream ?? track.isStream);
	const thumbnail = info.artworkUrl ?? track.thumbnail ?? (typeof track.displayThumbnail === "function" ? track.displayThumbnail("maxresdefault") : null);
	const requester = track.requester ?? track.userData?.requester;
	const requesterStr = typeof requester === "object" ? (requester?.username || requester?.name || "Unknown") : String(requester ?? "Unknown");
	const requesterId = typeof requester === "object" ? (requester?.id ?? null) : null;
	const identifier = info.identifier ?? track.identifier ?? "";
	return { title, uri, duration, isStream, thumbnail, requester: requesterStr, requesterId, identifier };
}

const guildSpecificIDs = [
	"427106982109904899",
	// "237020689465475073,"
];

/**
 * @typedef {object} AddQueueEmbedParams
 * @property {import("../lib/MusicEvents").ILavalinkTrack} track
 * @property {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @property {string} requesterId
 *
 * @param {AddQueueEmbedParams}
 */
const addQueuePositionEmbed = ({ track, player, requesterId }, position = undefined) => {
	const client = getClient();
	const t = getTrackDisplay(track) || {};
	const title = escapeMarkdown(t.title).replace(/\]|\[/g, "");

	const embed = new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setAuthor({ name: "Added to queue", iconURL: client.config.iconURL })
		.setDescription(`[${title}](${t.uri})` || "No Title")
		.setURL(t.uri)
		.addFields([
			{
				name: "Added by",
				value: `<@${requesterId}>`,
				inline: true,
			},
			{
				name: "Duration",
				value: t.isStream
					? `\`LIVE 🔴 \``
					: `\`${client.ms(t.duration, {
							colonNotation: true,
							secondsDecimalDigits: 0,
					  })}\``,
				inline: true,
			},
		]);

	if (t.thumbnail) embed.setThumbnail(t.thumbnail);

	const tracksLen = player.queue?.tracks?.length ?? player.queue?.size ?? 0;
	const totalSize = (player.queue?.current ? 1 : 0) + tracksLen;
	if (totalSize > 1) {
		embed.addFields([
			{
				name: "Position in queue",
				value: `${position ?? tracksLen}`,
				inline: true,
			},
		]);
	}

	return embed;
};

/**
 * @typedef {object} TrackStartedEmbedParams
 * @property {import("../lib/MusicEvents").ILavalinkTrack=} track
 *
 * @param {TrackStartedEmbedParams}
 */
const trackUpdateEmbed = ({ track, player, isPause = false } = {}) => {
	const client = getClient();
	const t = getTrackDisplay(track);
	const embed = new EmbedBuilder().setColor(client.config.embedColor);

	if (track && t) {
		let playerPosition;
		try {
			playerPosition = player?.position ?? 0;
			if (playerPosition === undefined) playerPosition = 0;
		} catch (err) {
			playerPosition = 0;
		}
		const queueSize =
			player?.queue?.tracks?.length ?? player?.queue?.length ?? player?.queue?.size ?? 0;
		embed.setAuthor({
			name: "Now playing",
			iconURL: client.config.iconURL,
		})
			.setDescription(
				`<a:now_playing:1227326152067252417>[${t.title}](${t.uri})`
			)
			.addFields([
				{
					name: "Requested by",
					value: `${t.requester}`,
					inline: true,
				},
				{
					name: "Queue",
					value: `${queueSize}`,
					inline: true,
				},
				{
					name: "Progress",
					value: t.isStream
						? `\`LIVE 🔴\``
						: `\`${prettyMilliseconds(playerPosition, {
								secondsDecimalDigits: 0,
						  })}\` ${showPlayerPositionBar(
								playerPosition,
								t.duration,
								isPause
						  )} \`${prettyMilliseconds(t.duration, {
								secondsDecimalDigits: 0,
						  })}\``,
					inline: false,
				},
			]);

		if (t.thumbnail) embed.setThumbnail(t.thumbnail);

		if (player) addPlayerStateFooter(player, embed);
	} else {
		// !TODO: finish this
		embed.setTitle("No song currently playing").setImage(
			// "https://cdn.discordapp.com/avatars/788006279837909032/e4cf889f9fe19f9b4dd5301d51bddcb2.webp?size=4096"
			"https://cdn.discordapp.com/attachments/1041061256267829399/1041062075608334436/yohta_scream.png?ex=6559071c&is=6546921c&hm=2dc436f3bfac4bfa43433b66bb36b353e90ca2f5d29245ede3bf2381d01df7fa&"
		);
	}

	return embed;
};

const addPlayerStateFooter = (player, embed) => {
	const states = [
		["autoqueue", !!player.get("autoQueue")],
		["24/7", !!player.get("twentyFourSeven")],
	];

	const shownStates = states.filter((state) => state[1]);

	if (shownStates.length)
		embed.setFooter({
			text: shownStates.map((state) => state[0]).join(" • "),
		});
};

function showPlayerPositionBar(currentPosition, totalDuration, isPause = false, barLength = 14) {
	// console.log(currentPosition, totalDuration);
	// console.log(isPause);
	if (barLength <= 2) {
		throw new Error("barLength must be greater than 2");
	}
	const playedProportion = currentPosition / totalDuration;
	const playedLength = Math.min(barLength - 2, Math.round(playedProportion * barLength));
	const remainingLength = Math.max(0, barLength - playedLength - 2);

	const progressDoneEmoji = "<:progressed:1172214967446024262>"; // Replace with the actual emoji ID for "played" part
	const progressLeftEmoji = "<:progress:1172214989763915846>"; // Replace with the actual emoji ID for "remaining" part
	const progressRunEmoji = "<a:yhota_run3:1172598823793721435>";
	const progressStopEmoji = "<:yohta_stop:1172239599586770975>";
	const progressEndEmoji = "<a:canned_fish:1172601450350776431> ";

	return (
		progressDoneEmoji.repeat(playedLength) +
		(isPause ? progressStopEmoji : progressRunEmoji) +
		progressLeftEmoji.repeat(remainingLength) +
		progressEndEmoji
	);
}

/**
 * Returns true if the URL returns a successful response with an image Content-Type.
 * Uses GET but cancels the body so the image is not fully downloaded.
 */
async function isImageUrl(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) return false;
		const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
		if (!contentType.startsWith("image/")) return false;
		// Avoid downloading the full image; discard the body
		await response.body?.cancel?.();
		return true;
	} catch {
		return false;
	}
}

async function fetchData(url) {
	try {
		const response = await fetch(url);
		const contentType = response.headers.get("content-type") ?? "";

		if (!response.ok) {
			const text = await response.text();
			console.error(
				`fetchData: ${url} returned ${response.status} ${response.statusText}`,
				text.slice(0, 200)
			);
			return null;
		}

		if (!contentType.includes("application/json")) {
			const text = await response.text();
			console.error(
				`fetchData: ${url} returned non-JSON (${contentType}). Body starts with:`,
				text.slice(0, 100)
			);
			return null;
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching data:", error);
		return null;
	}
}

function emptyStrHandler(interaction, text) {
	if (text.trim().length === 0) {
		return interaction.reply({
			content: "You need to provide a sentence to translate.",
			flags: MessageFlags.Ephemeral,
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
	replyColour = "#09cde2",
	limitFavCount = 100
) {
	// 1. Extract Options
	// 1. Extract Options
	const userQuery = interaction.options.getString("query") || "";
	const typeFilter = interaction.options.getString("type"); // No fallback here yet
	const orderFilter = interaction.options.getString("order") || "order:random";

	// 2. Resolve the "any_type" to an empty string
	const resolvedType = (typeFilter === "any_type" || !typeFilter) ? "" : typeFilter;

	// 3. Build Search String (The actual API query)
	const finalTags = [
		userQuery,
		resolvedType, // This will now correctly include "-type:gif -type:webm"
		orderFilter,
		`favcount:>${limitFavCount}`
	].filter(Boolean).join(" ");

	// 4. Build the filter info for the Embed (The display text)
	const activeFilters = [resolvedType, orderFilter].filter(Boolean);
	const filterInfo = activeFilters.length > 0 ? ` with \`${activeFilters.join(" ")}\`` : "";
	const baseURL = `https://${searchSite}.net/posts.json?tags=${encodeURIComponent(finalTags)}&limit=1`;

	await interaction.deferReply();

	try {
		const response = await fetch(baseURL, {
			headers: { "User-Agent": "MyDiscordBot/1.0 (YourE621Username)" },
		});
		const raw = await response.json();
		const data = raw?.posts?.[0];

		if (!data) {
			return await interaction.editReply(
				`No results found for: \`${userQuery}\``
			);
		}

		const userMention = `<@${interaction.user.id}>`;
		const postLink = `https://${searchSite}.net/posts/${data.id}`;
		const description = data.description
			? data.description.slice(0, 1000)
			: "No description provided.";
		const tagsString = (data.tags?.general?.join(", ") || "None").slice(0, 1000);

		// 2. Build the Embed
		const embedMeta = new EmbedBuilder()
			.setColor(replyColour)
			.setDescription(
				`${userMention} found [Post #${data.id}](${postLink})${filterInfo}`
			)
			.addFields(
				{
					name: "Description",
					value: `\`\`\`yml\n${description}\`\`\``,
				},
				{
					name: "Artist/Species",
					value: `\`\`\`yml\nArtist: ${data.tags.artist.join(", ") || "unknown"}\nSpecies: ${data.tags.species.join(", ") || "unknown"}\`\`\``,
					inline: true,
				},
				{
					name: "Post Info",
					value: `\`\`\`yml\nScore: 🔼${data.score.up} | ❤️: ${data.fav_count}\nRating: ${data.rating.toUpperCase()}\nExt: ${data.file.ext.toUpperCase()}\`\`\``,
					inline: true,
				},
				{
					name: "Tags",
					value: `\`\`\`yml\n${tagsString}\`\`\``,
				}
			);
		// 4. Handle Media (The Top Message)
		const mediaURL = data?.file?.url || null;
		const extension = data.file.ext;
		const fileSize = data.file.size;
		const isVideo = ["webm", "mp4"].includes(extension.toLowerCase());
		const posterURL = data?.sample?.url || data?.preview?.url || null;
		const logger = getClient().logger;
		logger.log(`userMention: ${userMention}`);
		logger.log(`File size: ${fileSize} bytes`);
		logger.log(`Media URL: ${mediaURL}`);
		logger.log(`postLink: ${postLink}`);

		const buttons = [
			new ButtonBuilder()
				.setLabel('View Post')
				.setEmoji('🌐')
				.setStyle(ButtonStyle.Link)
				.setURL(postLink)
		];

		if (mediaURL) {
			const extension = data.file.ext;
			const fileSize = data.file.size;
			const MAX_SIZE = 24 * 1024 * 1024;

			if (fileSize < MAX_SIZE) {
				const attachment = new AttachmentBuilder(mediaURL, {
					name: `SPOILER_${isVideo ? "VIDEO" : "IMAGE"}_${data.id}.${extension}`,
				});
				await interaction.editReply({
					content: `🔍 **Search Result for:** \`${userQuery || "RANDOM"}\``,
					files: [attachment],
				});
			} else {
				await interaction.editReply({
					content: `🔍 **Search Result for:** \`${userQuery || "RANDOM"}\`\n📽️ **File too large for upload. Click to reveal:**\n|| ${mediaURL} ||`,
				});
			}
			buttons.push(
				new ButtonBuilder()
					.setLabel(isVideo ? 'Direct Video' : 'Direct Image')
					.setEmoji(isVideo ? '🎬' : '🖼️')
					.setStyle(ButtonStyle.Link)
					.setURL(mediaURL)
			);
			const row = new ActionRowBuilder().addComponents(buttons);

			// 4. Send Metadata + Buttons (Bottom Message)
			return await interaction.followUp({
				embeds: [embedMeta],
				components: [row], // Buttons added here
			});
		} else {
			if (posterURL) embedMeta.setImage(posterURL);
			return await interaction.editReply({
				content: `⚠️ **Post Found, but the file is unavailable.**\nIt may have been removed or is in an unsupported format.`,
				embeds: [embedMeta],
				// We only show the "View Post" button since the "Direct Link" would be empty
				components: [new ActionRowBuilder().addComponents(buttons)],
			});
		}
	} catch (e) {
		console.error("e621 Error:", e);

		// 1. Delete the "Bot is thinking..." message that everyone can see
		await interaction.deleteReply().catch(() => null); 

		// 2. Send a brand new private message
		return await interaction.followUp({
			content: "Something went wrong while searching on e621.",
			flags: MessageFlags.Ephemeral
		});
	}
}

module.exports = {
	getTrackDisplay,
	fetchData,
	isImageUrl,
	getE621ImageAndReply,
	getRandomInt,
	emptyStrHandler,
	addQueuePositionEmbed,
	guildSpecificIDs,
	showPlayerPositionBar,
	trackUpdateEmbed,
};
