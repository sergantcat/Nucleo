const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catgif')
        .setDescription('Sends a Cat GIF'),

    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle('Cat Superhacker 😎')
            .setColor(0xff66b3)
            .setImage('https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif');

        await interaction.editReply({
            content: 'This Cat learned how to Script and hacked the system! 😎',
            embeds: [embed]
        });
    }
};