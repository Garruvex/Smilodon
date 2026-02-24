const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
	.setName("summon")
	.setDescription("Summons the bot to the channel.")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!interaction.member.voice.channel) {
			const joinEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					"❌ | **You must be in a voice channel to use this command.**",
				);
			return interaction.reply({ embeds: [joinEmbed], flags: MessageFlags.Ephemeral });
		}
		
		let player = client.manager.Engine.players.get(interaction.guild.id);
		if (!player) {
			player = client.manager.Engine.createPlayer({
				guildId: interaction.guild.id,
				voiceChannelId: channel.id,
				textChannelId: interaction.channel.id,
			});
			await player.connect();
		} else if (channel.id !== (player.voiceChannelId ?? player.voiceChannel)) {
			await player.changeVoiceState({ voiceChannelId: channel.id });
		}
		
		interaction.reply({
			embeds: [
				new EmbedBuilder().setDescription(`:thumbsup: | **Successfully joined <#${ channel.id }>!**`),
			],
		});
	});

module.exports = command;
