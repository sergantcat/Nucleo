const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("randomembed")
        .setDescription("Send a random embed."),

    async execute(interaction) {

        const titles = [
            "System Update",
            "Information",
            "Notice",
            "Status Report",
            "Announcement"
        ];

        const descriptions = [
            "Everything is running normally.",
            "This is a test embed.",
            "Welcome to the server!",
            "Have a great day!",
            "Random message generated."
        ];

        const title = titles[Math.floor(Math.random() * titles.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        await interaction.reply({
            content: "Embed sent!",
            ephemeral: true
        });

        await interaction.channel.send({
            embeds: [embed]
        });
    }
};