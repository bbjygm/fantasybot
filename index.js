const fs = require('node:fs');
const path = require('node:path');
const cron = require('cron');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const config = require('./config.json');

const client = new Client({
    intents: [
        // GatewayIntentBits.AutoModerationConfiguration,
        // GatewayIntentBits.AutoModerationExecution,
        // GatewayIntentBits.DirectMessageReactions,
        // GatewayIntentBits.DirectMessageTyping,
        // GatewayIntentBits.DirectMessages,
        // GatewayIntentBits.GuildBans,
        // GatewayIntentBits.GuildEmojisAndStickers,
        // GatewayIntentBits.GuildIntegrations,
        // GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.GuildPresences,
        // GatewayIntentBits.GuildScheduledEvents,
        // GatewayIntentBits.GuildVoiceStates,
        // GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.once(Events.ClientReady, client => {
    console.log(`Fantasy Bot started on server(s):\n`);
    client.guilds.cache.forEach(guild => guild.members.fetch(guild.ownerId)
                           .then(member => console.log(`${guild.id}: ${guild.name} (owner: ${member.displayName})`))
                           .catch(() => console.log(`${guild.id}: ${guild.name}`))
                          );
    require('./deploy-commands.js');
});

client.on('error', e => {
    console.error(e);
    fs.appendFile('./error.log', e, err => {
        // if (err) throw err;
    });
});

const sendMessage = (channel, message, color = Math.floor(Math.random() * 0xFFFFFF)) => channel.send({
    embeds: [
        { color: color, description: message }
    ]
});
const sendAlertMessage = (channel, message) => sendMessage(channel, message, 0xCF000E);

client.login(config.token);
