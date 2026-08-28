

require('dotenv').config();

const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');
const { reportStatus } = require('./statusReporter.js');
const path = require('path');
const { handleDmReplyButton, handleDmReplyModal } = require('./handlers/dmReplyHandler');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('error', (err) => console.error('Client error:', err));
client.on('shardError', (err) => console.error('Shard error:', err));
client.on('shardDisconnect', () => console.log('Shard disconnected'));
client.on('shardReconnecting', () => console.log('Shard reconnecting...'));

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (!command?.data?.name) continue;
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('Missing TOKEN or CLIENT_ID in your environment variables. Update the .env file and try again.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log('Successfully refreshed application (/) commands.');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
})();
client.once('ready', () => {
    console.log('Nucleo is online!');
    reportStatus('nucleo', 'online');
    setInterval(() => reportStatus('nucleo', 'online'), 60000);
});
process.on('SIGINT', async () => {
    await reportStatus('nucleo', 'offline');
    process.exit();
});

client.on('interactionCreate', async interaction => {
    console.log('Interaction received:', interaction.type, interaction.commandName ?? interaction.customId ?? '(unknown)');

    // DM reply flow (button in a user's DMs, and the modal it opens)
    if (interaction.isButton() && interaction.customId.startsWith('dmreply_')) {
        return handleDmReplyButton(interaction);
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith('dmreplymodal_')) {
        return handleDmReplyModal(interaction);
    }

    if (interaction.isButton() || interaction.isModalSubmit()) {
        const partnershipCommand = client.commands.get('post-partnership');
        if (partnershipCommand?.handleApplicationInteractions) {
            await partnershipCommand.handleApplicationInteractions(interaction);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const requiredPermissions = command.requiredPermissions ?? command.data?.defaultMemberPermissions ?? command.data?.toJSON?.().default_member_permissions;

    if (requiredPermissions && interaction.inGuild() && !interaction.memberPermissions?.has(requiredPermissions)) {
        await interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution failed:', error);

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'ERROR: Command execution failed!' });
            } else {
                await interaction.reply({ content: 'ERROR: Command execution failed!' });
            }
        } catch (replyError) {
            console.error('Failed to send error response:', replyError);
        }
    }
});

client.login(token).catch(error => {
    console.error('Failed to login to Discord:', error);
});