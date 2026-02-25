const SlashCommand = require("../../lib/SlashCommand");
const { MessageFlags } = require("discord.js");
const { getE621ImageAndReply } = require("../../util/utils.js");

const command = new SlashCommand()
    .setName('e926')
    .setDescription('Search for images on e926')
    .addStringOption(option => 
        option.setName('query')
            .setDescription('Tags to search for (e.g. wolf, dragon, solo)')
            .setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('File type')
        .addChoices(
            { name: 'GIF', value: 'type:gif' },
            { name: 'Video', value: 'type:webm' },
            { name: 'Static Image', value: '-type:gif -type:webm' }
        ))
    .addStringOption(opt => opt.setName('order').setDescription('Sort by')
        .addChoices(
            { name: 'Random', value: 'order:random' },
            { name: 'Latest', value: 'order:id' },
            { name: 'Most Liked', value: 'order:favcount' },
            { name: 'Highest Score', value: 'order:score' }
        ))
    .setRun(async (client, interaction) => {
        try {
            // Simply pass the variables in order
            await getE621ImageAndReply(
                interaction,   // interaction object
                "e926",        // searchSite
                "#66ff33",     // replyColour
                100            // limitFavCount
            );
        } catch (error) {
            console.error("Command Error:", error);
            
            // Safety check: if interaction was already deferred, use editReply
            const replyMethod = interaction.deferred ? "editReply" : "reply";
            
            await interaction[replyMethod]({
                content: "An error occurred while processing your command.",
                flags: MessageFlags.Ephemeral,
            });
        }
    });

module.exports = command;