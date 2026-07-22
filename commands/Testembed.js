const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('A cat embed with a button'),

    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle('MMM Button Press it!')
            .setDescription('Press the button and I will send you a cat gif!')
            .setColor('#001aff');

        const button = new ButtonBuilder()
            .setCustomId('sends_cat_gif')
            .setLabel('Press me!')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🐱');

        const row = new ActionRowBuilder().addComponents(button);

        await new Promise(resolve => setTimeout(resolve, 5000));

        const message = await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000
        });

        collector.on('collect', async buttonInteraction => {
            if (buttonInteraction.customId !== 'sends_cat_gif') return;

            try {
                const catEmbed = new EmbedBuilder()
                    .setTitle('YOU PRESSED IT :D Now here is a Gif')
                    .setImage('https://tenor.com/view/cat-gif-15677826050545973054')
                    .setColor('#48ff00')
                    .setAuthor({
                        name: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                await buttonInteraction.user.send({ embeds: [catEmbed] });
                await buttonInteraction.reply({ content: 'Check your DMs :D', ephemeral: true });
            } catch (error) {
                await buttonInteraction.reply({
                    content: 'I could not send you a DM. Please open your DMs and try again.',
                    ephemeral: true
                });
            }
        });
    }
};