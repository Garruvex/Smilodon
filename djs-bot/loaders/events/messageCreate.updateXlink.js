const { EmbedBuilder, Message } = require("discord.js");
const Bot = require("../../lib/Bot");

// node_modules\discord.js\typings\index.d.ts:3940
// @messageCreate: [message: Message];
/**
 *
 * @param {Bot} client
 * @param {Message} message
 * @returns {Promise<Message<boolean>>}
 */

const listOfStrings = ["x.com", "twitter.com", "furaffinity.net"];
const listOfXDomain = ["x.com", "twitter.com"];

const emojis = ["❤️", "🫶", "😘", "😍", "😋", "🍌", "😎", "🍆", "🥒", "🍩", "🥯", "🌭"];

module.exports = async (client, message) => {
	// Check if the message includes any of the strings in the list
	const containsLink = listOfStrings.some((str) => message.content.includes(str));
	if (containsLink & message.content.startsWith("https://")) {
		if (message.author.bot) return;

		// Regular expression to match URLs starting with https://x.com/
		const urlRegex =
			/https?:\/\/(?:www\.)?(x\.com|twitter\.com|furaffinity\.net)\/(\S+)/gi;

		// and captures the path after x.com to use in the replacement
		const modifiedContent = message.content.replace(urlRegex, (match, domain, path) => {
			// Replace 'x.com' with 'fxtwitter.com' but keep the captured path
			// console.log(domain, path);
			if (listOfXDomain.includes(domain)) {
				// console.log("x.com");
				// Assuming you want to replace 'x.com' with 'fxtwitter.com' and 'twitter.com' with 'fxtwitter.com'
				return `https://fxtwitter.com/${path}`;
			} else if (domain === "furaffinity.net") {
				// console.log("furaffinity.net");
				// Handle the 'furaffinity.net' case
				return `https://fxfuraffinity.net/${path}`;
			} else {
				// If the domain isn't in the listOfXDomain or 'furaffinity.net', return the match unmodified
				// console.log("no change");
				return match;
			}
		});

		// console.log(urlRegex, modifiedContent);

		if (modifiedContent !== message.content) {
			try {
				// const referenceEmbed = new EmbedBuilder()
				// 	.setAuthor({
				// 		name: message.author.tag,
				// 		iconURL: message.author.displayAvatarURL(),
				// 	})
				// 	// .setDescription(`modifiedContent`)
				// 	.setFooter({ text: "reformatted" })
				// 	.setTimestamp();

				// const botMessageAvatar = await message.channel.send({
				// 	// embeds: [referenceEmbed],
				// 	content: message.author.displayAvatarURL(),
				// 	allowedMentions: { repliedUser: false },
				// });
				const botMessage = await message.channel.send({
					// embeds: [referenceEmbed],
					content: `${message.author} -> ${modifiedContent}`,
					allowedMentions: { repliedUser: false },
				});

				// const botReply = await botMessage.reply({
				// 	content: modifiedContent,
				// 	allowedMentions: { repliedUser: false },
				// });
				const randomEmoji =
					emojis[Math.floor(Math.random() * emojis.length)];
				await botMessage.react(randomEmoji);
				await message.delete().catch(console.error);
			} catch (error) {
				console.error("Error sending message: ", error);
			}
		}
	}
};
