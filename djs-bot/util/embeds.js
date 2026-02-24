const { getClient } = require("../bot");
const prettyMsModule = require("pretty-ms");
const prettyMilliseconds =
	typeof prettyMsModule === "function"
		? prettyMsModule
		: (prettyMsModule?.default ?? prettyMsModule);
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { escapeMarkdown } = require("discord.js");
const { getTrackDisplay, showPlayerPositionBar } = require("./utils.js");

/**
 * @typedef {object} ColorEmbedParams
 * @property {import("discord.js").ColorResolvable} color
 * @property {string} desc
 *
 * @param {ColorEmbedParams}
 */
const colorEmbed = ({ color, desc }) => {
	if (!desc?.length) throw new Error("[colorEmbed] No description provided");

	return new EmbedBuilder()
		.setColor(color || getClient().config.embedColor)
		.setDescription(desc);
};

/**
 * @param {ColorEmbedParams}
 */
const successEmbed = ({ color, desc = "Success" } = {}) =>
	colorEmbed({ color: color, desc: `✅ | **${desc}**` });

/**
 * @param {ColorEmbedParams}
 */
const errorEmbed = ({ color, desc = "Error" } = {}) =>
	colorEmbed({ color: color, desc: `❌ | **${desc}**` });

/**
 * @param {ColorEmbedParams} options
 */
const redEmbed = (options = {}) => colorEmbed({ color: "Red", ...options });

const embedNoLLNode = () =>
	redEmbed({
		desc: "Lavalink node is not connected",
	});

const embedNotEnoughSong = () =>
	redEmbed({
		desc: "There are not enough songs in the queue.",
	});

const embedNoTrackPlaying = () =>
	redEmbed({
		desc: "Nothing is playing right now.",
	});

const embedNotEnoughTrackToClear = () =>
	errorEmbed({
		desc: "Invalid, Not enough track to be cleared.",
	});

const embedClearedQueue = () =>
	successEmbed({
		desc: "Cleared the queue!",
	});

/**
 * @typedef {object} TrackStartedEmbedParams
 * @property {import("../lib/MusicEvents").ILavalinkTrack=} track
 * @property {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @property {string=} title
 * @property {boolean} [isPause]
 * @property {boolean} [largeArtwork] - If true, use embed image (large) instead of thumbnail (small). Use for control channel.
 *
 * @param {TrackStartedEmbedParams}
 */
const trackStartedEmbed = ({
	track,
	player,
	title = `Now playing <a:now_playing:1227326152067252417>`,
	isPause = false,
	largeArtwork = false,
} = {}) => {
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
		const queueLen =
			player?.queue?.tracks?.length ??
			player?.queue?.size ??
			player?.queue?.length ??
			0;
		embed.setAuthor({ name: title, iconURL: client.config.iconURL })
			.setDescription(`<a:now_playing:1227326152067252417> [${t.title}](${t.uri})`)
			.addFields([
				{
					name: "Requested by",
					value: t.requesterId ? `<@${t.requesterId}>` : t.requester,
					inline: true,
				},
				{
					name: "Queue",
					value: `${queueLen}`,
					inline: true,
				},
				{
					name: "Duration",
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

		if (t.thumbnail) {
			if (largeArtwork) embed.setImage(t.thumbnail);
			else embed.setThumbnail(t.thumbnail);
		}

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

/**
 * Builds the control channel message payload (embeds + components).
 * All control channel content lives here; callers only pass this to message.edit().
 * @typedef {object} ControlChannelMessageParams
 * @property {string} guildId
 * @property {TrackStartedEmbedParams["track"]} track
 * @property {boolean} [isPause]
 * @param {ControlChannelMessageParams}
 * @returns {import("discord.js").MessageCreateOptions}
 */
const controlChannelMessage = ({ guildId, track, isPause = false } = {}) => {
	const client = getClient();
	const engine = client?.manager?.Engine;
	// Lavalink-Client may expose getPlayer(guildId) and/or .players Map; support both
	const player =
		(typeof engine?.getPlayer === "function" ? engine.getPlayer(guildId) : null) ??
		engine?.players?.get?.(guildId) ??
		undefined;

	const prev = new ButtonBuilder()
		.setCustomId("cc/prev")
		.setStyle(ButtonStyle.Primary)
		.setEmoji("⏮️");

	const playpause = new ButtonBuilder()
		.setCustomId("cc/playpause")
		.setStyle(ButtonStyle.Primary)
		.setEmoji("⏯️");

	const stop = new ButtonBuilder()
		.setCustomId("cc/stop")
		.setStyle(ButtonStyle.Danger)
		.setEmoji("⏹️");

	const next = new ButtonBuilder()
		.setCustomId("cc/next")
		.setStyle(ButtonStyle.Primary)
		.setEmoji("⏭️");

	const firstRow = new ActionRowBuilder().addComponents(prev, playpause, stop, next);

	const lowerVolume = new ButtonBuilder()
		.setCustomId("cc/vlower")
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("🔉");

	const louderVolume = new ButtonBuilder()
		.setCustomId("cc/vlouder")
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("🔊");

	const autoqueue = new ButtonBuilder()
		.setCustomId("cc/autoqueue")
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("♾️");

	const twentyFourSeven = new ButtonBuilder()
		.setCustomId("cc/247")
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("🕐")
		.setLabel("24/7");

	const shuffle = new ButtonBuilder()
		.setCustomId("cc/shuffle")
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("🔀");

	const secondRow = new ActionRowBuilder().addComponents(
		lowerVolume,
		louderVolume,
		autoqueue,
		twentyFourSeven,
		shuffle
	);

	const components = [firstRow, secondRow];

	// Use trackStartedEmbed for control channel with large artwork (embed image instead of thumbnail)
	const embed = trackStartedEmbed({
		track,
		player,
		title: "Now playing <:now_playing:1172239599586770975>",
		isPause,
		largeArtwork: true,
	});
	// Serialize to plain objects so message.edit() always gets valid API payload
	const embedData = embed
		? embed.toJSON()
		: new EmbedBuilder().setColor(client?.config?.embedColor ?? 0).setTitle("No song currently playing").toJSON();
	return {
		content: "Join a voice channel and queue songs by name or url in here.",
		embeds: [embedData],
		components,
	};
};

/**
 * @typedef {object} AddQueueEmbedParams
 * @property {import("../lib/MusicEvents").ILavalinkTrack} track
 * @property {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @property {string} requesterId
 *
 * @param {AddQueueEmbedParams}
 */
const addQueueEmbed = ({ track, player, requesterId }) => {
	const client = getClient();
	const t = getTrackDisplay(track) || {};
	const title = escapeMarkdown(t.title || "Unknown").replace(/\]|\[/g, "");

	const embed = new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setAuthor({ name: "Added to queue", iconURL: client.config.iconURL })
		.setDescription(title ? `[${title}](${t.uri})` : "No Title")
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
				value: `${tracksLen}`,
				inline: true,
			},
		]);
	}

	return embed;
};

/**
 * @typedef {object} LoadedPlaylistEmbedParams
 * @property {{ loadType?: string; tracks?: unknown[]; playlist?: { name?: string; duration?: number } }} searchResult
 * @property {string} query
 *
 * @param {LoadedPlaylistEmbedParams}
 */
const loadedPlaylistEmbed = ({ searchResult, query }) => {
	const client = getClient();
	const { getTrackDisplay } = require("./utils.js");
	const first = searchResult.tracks?.[0];
	const thumb = first
		? (getTrackDisplay(first)?.thumbnail ?? first.info?.artworkUrl ?? first.thumbnail)
		: null;
	const pl = searchResult.playlist ?? {};
	const duration =
		pl.duration ??
		(searchResult.tracks || []).reduce(
			(acc, t) => acc + (t.info?.duration ?? t.duration ?? 0),
			0
		);

	const embed = new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setAuthor({
			name: "Playlist added to queue",
			iconURL: client.config.iconURL,
		})
		.setDescription(`[${pl.name ?? "Playlist"}](${query})`);
	if (thumb) embed.setThumbnail(thumb);
	embed.addFields([
		{
			name: "Enqueued",
			value: `\`${(searchResult.tracks || []).length}\` songs`,
			inline: true,
		},
		{
			name: "Playlist duration",
			value: `\`${client.ms(duration, {
				colonNotation: true,
				secondsDecimalDigits: 0,
			})}\``,
			inline: true,
		},
	]);

	return embed;
};

const autoQueueEmbed = ({ autoQueue }) => {
	const client = getClient();
	return new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setDescription(`**Auto Queue is** \`${!autoQueue ? "ON" : "OFF"}\``)
		.setFooter({
			text: `Related music will ${
				!autoQueue ? "now be automatically" : "no longer be"
			} added to the queue.`,
		});
};

const historyEmbed = ({ history }) => {
	const client = getClient();
	return new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setDescription(`**History is** \`${!history ? "ON" : "OFF"}\``)
		.setFooter({
			text: `Music history will ${
				!history ? "no longer be" : "now be automatically"
			} removed.`,
		});
};

/**
 * @param {import("../lib/clients/MusicClient").LavalinkPlayer} player
 * @param {EmbedBuilder} embed
 */
const addPlayerStateFooter = (player, embed) => {
	const states = [
		["autoqueue", !!player.get("autoQueue")],
		["24/7", !!player.get("twentyFourSeven")],
	];
	const shownStates = states.filter((state) => state[1]);
	if (shownStates.length)
		embed.setFooter({ text: shownStates.map((s) => s[0]).join(" • ") });
};

function getButtons(pageNo, maxPages) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("previous_page")
			.setEmoji("◀️")
			.setStyle("Primary")
			.setDisabled(pageNo == 0),
		new ButtonBuilder()
			.setCustomId("next_page")
			.setEmoji("▶️")
			.setStyle("Primary")
			.setDisabled(pageNo == maxPages - 1)
	);
}

module.exports = {
	successEmbed,
	errorEmbed,
	colorEmbed,
	redEmbed,
	embedNoLLNode,
	embedNoTrackPlaying,
	embedNotEnoughTrackToClear,
	embedClearedQueue,
	controlChannelMessage,
	trackStartedEmbed,
	addQueueEmbed,
	loadedPlaylistEmbed,
	autoQueueEmbed,
	historyEmbed,
	addPlayerStateFooter,
	getButtons,
	embedNotEnoughSong,
};
