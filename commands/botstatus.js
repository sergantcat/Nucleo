const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Allows to view bot status along with other bots'),

    async execute(interaction) {
        const component = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent("# Nucleo status ")
            )
            .addSeparatorComponents((separator) => separator
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Large)
            )
            .addSectionComponents((section) => section
                .addTextDisplayComponents(
                    (textDisplay) => textDisplay
                        .setContent("Bro are you for real checking bot status when its working <:melvin:1528466168065560667>.\nAnnyways you can view other bots status on the website of our cool game : D \n"),
                )
                .setButtonAccessory((button) => button
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://fsri.pages.dev/")
                    .setLabel("Webpage ")
                )
            );

        await interaction.reply({
            components: [component],
            flags: MessageFlags.IsComponentsV2
        });
    }
};