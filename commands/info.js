const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information'),

    async execute(interaction) {

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('# Server Information\nHere is some information about this server.')
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `**Server:** ${interaction.guild.name}\n` +
                        `**Members:** ${interaction.guild.memberCount}\n` +
                        `**Owner:** <@${interaction.guild.ownerId}>`
                    )
            );

        await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    }
};