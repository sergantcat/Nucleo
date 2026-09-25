const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

const OWNER_ID = '1116046775359373343';

module.exports = {
    data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a Bug or Bot issue To Erycd14')
    .addStringOption(option =>
        option 
        .setName('issue')
        .setDescription('Describe Your Bug or Issue To me and i will try to fix it ASAP')
        .setRequired(true)
        .setMaxLength(1000)
    ),
    async execute(interaction) {
    const report = interaction.options.getString('issue', true);

    const embed = new EmbedBuilder()
    .setTitle('Nucleo error report by ' + interaction.user.tag)
    .setColor(0xED4245)
    .addFields(
        { name: 'Issue:', value: report, inline: false },
    )
    .setTimestamp();

    if (interaction.guild) {
        embed.setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });
    }

    try {
        const owner = await interaction.client.users.fetch(OWNER_ID);
        await owner.send({ embeds: [embed] });

        await interaction.reply({
            content: 'Your Report has been noted. Erycd14 has been notified.',
            ephemeral: true
        });
    } catch (err){
        console.error('Failed to notify Erycd',err);
        await interaction.reply({
            content: 'ERROR Something went wrong Your Report Failed To send, Try again Later ',
            ephemeral: true,
        });
     }
    },
};