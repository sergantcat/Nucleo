const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catgif')
        .setDescription('Sends a Cat GIF'),

    async execute(interaction) {
        await interaction.deferReply();

        const gifUrls = [
            'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
            'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
            'https://media.giphy.com/media/13P3nU4LtMu2CQ/giphy.gif'
        ];

        const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];

        const embed = new EmbedBuilder()
            .setTitle('CatGIF 😎')
            .setColor(0xff66b3)
            .setImage(randomGif);

        await interaction.editReply({
            content: 'CATS : D',
            embeds: [embed]
        });
    }
};