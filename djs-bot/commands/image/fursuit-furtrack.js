const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const puppeteer = require("puppeteer");
const { getRandomInt } = require("../../util/utils.js");

function parseTextDetails(textArray) {
	const details = {};

	// Loop through each string in the text array
	textArray.forEach((text) => {
		// Split the string by newline characters
		const parts = text.split("\n");

		// Check for specific prefixes and extract the data accordingly
		if (parts[0] === "calendar_today") {
			details.date = parts[1]; // Get the date string
		} else if (parts[0] === "person") {
			details.username = parts[2]; // Get the username string, assuming it's always in the third position
		}
	});
	return details;
}

const command = new SlashCommand()
	.setName("fursuit-furtrack")
	.setDescription("Get a random image of a fursuit from furtrack.com")
	.setRun(async (client, interaction) => {
		await interaction.deferReply({ ephemeral: false });

		const browser = await puppeteer.launch();
		// Open a new page
		const page = await browser.newPage();

		setTimeout(() => {
			console.log("Timeout reached, closing the browser...");
			browser.close();
		}, 30000);

		try {
			let retry = 0;
			const maxRetry = 5;
			let elementsData;
			while (retry < maxRetry) {
				const postNumber = getRandomInt((min = 101000), (max = 418118));
				url = `https://www.furtrack.com/p/${postNumber}`;

				// Navigate to the desired URL
				await page.goto(url, { waitUntil: "networkidle0", timeout: 10000 });

				elementsData = await page.evaluate(() => {
					const imageUrl = Array.from(
						document.querySelectorAll(".plz-linkFull"),
						(element) => element.href
					);
					const text = Array.from(
						document.querySelectorAll(".plz-linkUser"),
						(element) => element.innerText
					);
					// console.log(text);

					return {
						imageUrl: imageUrl,
						text: text,
					};
				});

				if (elementsData.imageUrl.length > 0) break;
			}

			if (elementsData.imageUrl.length === 0) {
				throw new Error("No fursuit found");
			}

			await browser.close();

			const parsedDetails = parseTextDetails(elementsData.text);

			const statsEmbed = new EmbedBuilder()
				.setTitle("Random Fursuit UwU")
				.setImage(elementsData.imageUrl[0])
				.setAuthor({
					name: "furtrack.com",
					iconURL: "https://orca.furtrack.com/assets/img/logomark-small.png",
				})
				.setDescription(
					`Photo By: ${parsedDetails.username} | ${parsedDetails.date}`
				)
				.setFooter({ text: `visit -> ${url}` });
			return interaction.editReply({
				embeds: [statsEmbed],
				ephemeral: false,
			});
		} catch (err) {
			console.log(err);
			return interaction.editReply({
				content: "fail to get a fursuit photo, sowwy Q.Q",
				ephemeral: true,
			});
		}
	});

module.exports = command;
