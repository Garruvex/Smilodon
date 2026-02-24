"use strict";

const { MessageFlags } = require("discord.js");
const { colorEmbed } = require("./embeds");

const reply = async (interaction, desc) =>
	interaction[interaction.deferred || interaction.replied ? "editReply" : "reply"]({
		embeds: [
			colorEmbed({
				desc,
			}),
		],
		flags: MessageFlags.Ephemeral,
	});

module.exports = {
	reply,
};
