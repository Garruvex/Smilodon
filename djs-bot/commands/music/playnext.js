const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const { joinStageChannelRoutine, addTrack } = require("../../util/player");
const { loadedPlaylistEmbed, redEmbed } = require("../../util/embeds");
const { addQueuePositionEmbed } = require("../../util/utils");
const yt = require("youtube-sr").default;

async function testUrlRegex(string) {
	return [
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
		/^(?:spotify:|https:\/\/[a-z]+\.spotify\.com\/(track\/|user\/(.*)\/playlist\/|playlist\/))(.*)$/,
		/^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/,
		/^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/,
		/(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/,
	].some((regex) => {
		return regex.test(string);
	});
}

const command = new SlashCommand()
	.setName("playnext")
	.setDescription(
		"Searches and plays the requested song next \nSupports: \nYoutube, Spotify, Deezer, Apple Music"
	)
	.addStringOption((option) =>
		option
			.setName("query")
			.setDescription("What am I looking for?")
			.setAutocomplete(true)
			.setRequired(true)
	)
	.setAutocompleteOptions(async (input) => {
		if (input.length <= 3) return [];
		if (await testUrlRegex(input)) return [{ name: "URL", value: input }];

		const random = "ytsearch"[Math.floor(Math.random() * "ytsearch".length)];
		const results = await yt.search(input || random, { safeSearch: false, limit: 25 });

		const choices = [];
		for (const video of results) {
			choices.push({ name: video.title, value: video.url });
		}
		return choices;
	})
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) return;

		let node = await client.getLavalink(client);
		if (!node) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setTitle("Node error!")
						.setDescription("No available nodes to play music on!")
						.setFooter({ text: "Oops! something went wrong but it's not your fault!" }),
				],
			});
		}

		let player = client.manager.Engine.createPlayer({
			guildId: interaction.guild.id,
			voiceChannelId: channel.id,
			textChannelId: interaction.channel.id,
		});

		await player.connect();

		if (channel.type === "GUILD_STAGE_VOICE") {
			joinStageChannelRoutine(interaction.guild.members.me);
		}

		const ret = await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(":mag_right: **Searching...**"),
			],
			fetchReply: true,
		});

		let query = options.getString("query", true);
		const res = await player.search({ query }, interaction.user).catch((err) => {
			client.error(err);
			return { loadType: "error" };
		});

		const editReplyEmbed = async (embed) => {
			return interaction.editReply({ embeds: [embed] }).catch(client.warn);
		};

		if (res.loadType === "error") {
			if (!player.queue.current) player.destroy();
			await editReplyEmbed(redEmbed({ desc: "There was an error while searching" }));
			if (ret) setTimeout(() => ret.delete().catch(client.warn), 20000);
			return ret;
		}

		if (res.loadType === "empty") {
			if (!player.queue.current) player.destroy();
			await editReplyEmbed(redEmbed({ desc: "No results were found" }));
			if (ret) setTimeout(() => ret.delete().catch(client.warn), 20000);
			return ret;
		}

		player.set("requester", interaction.user);

		if (res.loadType === "track" || res.loadType === "search") {
			const track = res.tracks?.[0];
			if (!track) {
				await editReplyEmbed(redEmbed({ desc: "No results were found" }));
				if (ret) setTimeout(() => ret.delete().catch(client.warn), 20000);
				return ret;
			}
			track.requester = interaction.user;
			if (track.userData == null) track.userData = {};
			track.userData.requester = interaction.user;

			await player.queue.add(track, 0);

			const queueLen = player.queue.tracks?.length ?? 0;
			if (!player.playing && !player.paused && queueLen <= 1) {
				await player.play();
			}

			await editReplyEmbed(
				addQueuePositionEmbed(
					{ track, player, requesterId: interaction.user.id },
					0
				)
			);
		}

		if (res.loadType === "playlist") {
			const tracks = res.tracks ?? [];
			if (tracks.length) {
				for (const t of tracks) {
					t.requester = interaction.user;
					if (t.userData == null) t.userData = {};
					t.userData.requester = interaction.user;
				}
				await player.queue.add(tracks, 0);

				const queueLen = player.queue.tracks?.length ?? 0;
				if (!player.playing && !player.paused && queueLen === tracks.length) {
					await player.play();
				}
			}
			await editReplyEmbed(
				loadedPlaylistEmbed({ searchResult: { tracks, playlist: res.playlist ?? {}, loadType: "playlist" }, query })
			);
		}

		if (ret) setTimeout(() => ret.delete().catch(client.warn), 20000);
		return ret;
	});

module.exports = command;
