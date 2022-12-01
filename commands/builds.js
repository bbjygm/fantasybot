const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    	.setName('build')
    	.setDescription('Build group channels with given config input.'),
    async execute(interaction) {
        await interaction.reply(`Testing: ${interaction.user.username}`);
    },
};
