const {
  EmbedBuilder,
  escapeMarkdown,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const { classicCard } = require("songcard");
const path = require("path");

const command = new SlashCommand()
  .setName("nowplaying")
  .setDescription("Shows the song currently playing in the voice channel.")
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

    const song = player.queue.current;
    const { getTrackDisplay } = require("../../util/utils");
    const t = getTrackDisplay(song) || {};

    const noBgURL = path.join(__dirname, "..", "..", "assets", "no_bg.png");
    const thumb = t.thumbnail || (typeof song?.displayThumbnail === "function" ? song.displayThumbnail("maxresdefault") : null);

    const cardImage = await classicCard({
      imageBg: thumb || noBgURL,
      imageText: t.title,
      trackStream: t.isStream,
      trackDuration: player.position,
      trackTotalDuration: t.duration,
    });

    const attachment = new AttachmentBuilder(cardImage, { name: "card.png" });

    const requesterId = song?.requester?.id ?? song?.userData?.requester?.id ?? "";
    var title = escapeMarkdown(t.title);
    title = title.replace(/\]/g, "").replace(/\[/g, "");
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setAuthor({ name: "Now Playing", iconURL: client.config.iconURL })
      .setFields([
        {
          name: "Requested by",
          value: requesterId ? `<@${requesterId}>` : t.requester,
          inline: true,
        },
      ])
      .setDescription(`[${title}](${t.uri})`)
      .setImage("attachment://card.png");
    return interaction.reply({ embeds: [embed], files: [attachment] });
  });
module.exports = command;
