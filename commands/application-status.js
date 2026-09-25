const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('application-status')
        .setDescription('Open or close a team application status')
        .addStringOption(option =>
            option
                .setName('application')
                .setDescription('Which application')
                .setRequired(true)
                .addChoices(
                    { name: 'Developer', value: 'developer' },
                    { name: 'Safety Team', value: 'safety' }
                )
        )
        .addStringOption(option =>
            option
                .setName('status')
                .setDescription('Open or close the application')
                .setRequired(true)
                .addChoices(
                    { name: 'Open', value: 'open' },
                    { name: 'Closed', value: 'close' }
                )
        ),

    async execute(interaction) {
        const allowedRoleIds = (process.env.ALLOWED_ROLE_IDS || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

        if (!allowedRoleIds.length) {
            return interaction.reply({
                content: 'This command is not configured yet. Missing ALLOWED_ROLE_IDS.',
                ephemeral: true
            });
        }

        const member = interaction.member;
        const hasAllowedRole = member?.roles?.cache?.some(role => allowedRoleIds.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const application = interaction.options.getString('application');
        const status = interaction.options.getString('status');

        try {
            const response = await fetch(`${process.env.APP_URL}/api/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: 'application-status',
                    action: status,
                    applicationKey: application
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update application status.');
            }

            const label = application === 'developer' ? 'Developer' : 'Safety Team';

            await interaction.reply({
                content: `✅ ${label} application is now ${status === 'open' ? 'open' : 'closed'}.`,
                ephemeral: false
            });
        } catch (error) {
            console.error('Application status command failed:', error);
            await interaction.reply({
                content: `❌ Failed to update status: ${error.message}`,
                ephemeral: true
            });
        }
    }
};