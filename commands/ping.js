const { SlashCommandBuilder, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botping')
        .setDescription('Replies with bot latency and API latency'),

    async execute(interaction) {
        const apiLatency = Math.round(interaction.client.ws.ping);
        const botLatency = Math.round(Date.now() - interaction.createdTimestamp);

        const component = new ContainerBuilder()
            .setAccentColor(65313)
            .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent("Pong 🏓")
            )
            .addSeparatorComponents((separator) => separator
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Large)
            )
            .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent(`Discord API Latency : ${apiLatency}ms\nBot Latency : ${botLatency}ms`)
            );

        await interaction.reply({
            components: [component],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};