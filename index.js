require('dotenv').config();

const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

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
    console.log(`${client.user.tag} Startup Successful!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

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
