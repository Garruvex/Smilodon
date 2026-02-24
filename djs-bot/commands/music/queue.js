const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, Message, escapeMarkdown, AttachmentBuilder, MessageFlags } = require("discord.js");
const load = require("lodash");
const pmsModule = require("pretty-ms");
const pms = typeof pmsModule === "function" ? pmsModule : (pmsModule?.default ?? pmsModule);
const { classicCard } = require("songcard");
const path = require("path");
const { getButtons } = require("../../util/embeds");
const { getTrackDisplay } = require("../../util/utils");

const command = new SlashCommand()
	.setName("queue")
	.setDescription("Shows the current queue")

	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}

		let player;
		if (client.manager.Engine) {
			player = client.manager.Engine.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Lavalink node is not connected"),
				],
			});
		}

		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("The bot isn't in a channel."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!player.playing) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("There's nothing playing."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply().catch(() => {});

		const queue = player.queue;
		const tracks = queue.tracks ?? queue;
		const queueArr = Array.isArray(tracks) ? tracks : [];
		if (!queueArr.length) {
			const song = player.queue.current;
			const st = getTrackDisplay(song) || {};
			const noBgURL = path.join(__dirname, "..", "..", "assets", "no_bg.png");

			const cardImage = await classicCard({
				imageBg: st.thumbnail || noBgURL,
				imageText: st.title,
				trackStream: st.isStream,
				trackDuration: player.position,
				trackTotalDuration: st.duration,
			});

			const attachment = new AttachmentBuilder(cardImage, { name: "card.png" });

			var title = escapeMarkdown(st.title).replace(/\]/g, "").replace(/\[/g, "");
			const embed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setAuthor({ name: "Now Playing", iconURL: client.config.iconURL })
				.setFields([
					{ name: "Requested by", value: `${st.requester}`, inline: true },
				])
				.setDescription(`[${title}](${st.uri})`)
				.setImage("attachment://card.png");
			return interaction.editReply({ embeds: [embed], files: [attachment] });
		}

		const queueGroups = load.chunk(queueArr, 10);
		const maxPage = queueGroups.length;
		let currentPage = 0;
		let currentGroup = queueGroups[currentPage];

		const song = player.queue.current;
		const st = getTrackDisplay(song) || {};
		const noBgURL = path.join(__dirname, "..", "..", "assets", "no_bg.png");

		const cardImage = await classicCard({
			imageBg: st.thumbnail || noBgURL,
			imageText: st.title,
			trackStream: st.isStream,
			trackDuration: player.position,
			trackTotalDuration: st.duration,
		});

		const attachment = new AttachmentBuilder(cardImage, { name: "card.png" });

		var title = escapeMarkdown(st.title).replace(/\]/g, "").replace(/\[/g, "");

		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({ name: "Now Playing", iconURL: client.config.iconURL })
			.setFields([
				{ name: "Requested by", value: `${st.requester}`, inline: true },
			])
			.setDescription(`[${title}](${st.uri})`)
			.setImage("attachment://card.png");

		const queueEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({ name: "Queue", iconURL: client.config.iconURL })
			.setDescription(
				currentGroup
					.map((s, index) => {
						const t = getTrackDisplay(s) || {};
						return `**${currentPage * 10 + index + 1}**. [${escapeMarkdown(t.title)}](${t.uri}) \`[${pms(t.duration)}]\` | ${t.requester}`;
					})
					.join("\n")
			)
			.setFooter({ text: `Page ${currentPage + 1} of ${maxPage}` });

		/**
		 * @type {Message}
		 */
		const queueMessage = await interaction.editReply({
			embeds: [embed, queueEmbed],
			files: [attachment],
			components: [getButtons(currentPage, maxPage)],
		});

		const filter = (i) => i.user.id === interaction.user.id;
		const collector = queueMessage.createMessageComponentCollector({
			filter,
			time: 30000,
		});

		collector.on("collect", async (button) => {
			if (button.customId === "previous_page") {
				currentPage--;
			} else if (button.customId === "next_page") {
				currentPage++;
			}

			currentGroup = queueGroups[currentPage];
			let queueEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setTitle("Song Queue")
				.setDescription(
					currentGroup
						.map((s, index) => {
							const t = getTrackDisplay(s) || {};
							return `**${currentPage * 10 + index + 1}**. [${escapeMarkdown(t.title)}](${t.uri}) \`[${pms(t.duration)}]\` | ${t.requester}`;
						})
						.join("\n")
				)
				.setFooter({ text: `Page ${currentPage + 1} of ${maxPage}` });

			await button.update({
				embeds: [embed, queueEmbed],
				components: [getButtons(currentPage, maxPage)],
			});
		});
	});

module.exports = command;
