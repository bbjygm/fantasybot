const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('perms')
    .setDescription('Programmatically set group permissions.')
	.setDefaultMemberPermissions(0); // admin only by default

const execute = async (interaction) => {
    await interaction.deferReply();
    // get guild channels and roles for groups
    const guild = interaction.guild;
    const channels = guild.channels.cache.filter(c => c.name.startsWith('group-'));
    const roles = guild.roles.cache.filter(r => r.name.startsWith('Group '));
    
    // associate group channels and roles
    const table = roles.map(role => {
        let nameStart = role.name.toLowerCase().replaceAll(' ', '-') + '-';
        return [
            channels.find(channel => (channel.name + '-').startsWith(nameStart)),
            role
        ];
    });
    
    // set up message array to be used for creating the feedback message
    let message = table.map(([channel, role]) => {
        if (!channel) return 'No channel found for role: ' + role.name;
        return channel.name + ': Working...';
    });
    const updateMessage = () => interaction.editReply(message.join('\n'));
    updateMessage();
    
    table.forEach(([channel, role], i) => {
        if (!channel || !role) return;
        // set perms for group channel
        channel.permissionOverwrites.set([
            // set permissions for this group's role
            {
                id: role.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.AddReactions,
                    PermissionsBitField.Flags.UseExternalEmojis,
                    PermissionsBitField.Flags.UseExternalStickers,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ]
            },
            // set permissions for @everyone
            {
                id: guild.roles.everyone,
                allow: [
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
                deny: [
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ManageWebhooks,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.SendMessagesInThreads,
                    PermissionsBitField.Flags.CreatePublicThreads,
                    PermissionsBitField.Flags.CreatePrivateThreads,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.AddReactions,
                    PermissionsBitField.Flags.UseExternalEmojis,
                    PermissionsBitField.Flags.UseExternalStickers,
                    PermissionsBitField.Flags.MentionEveryone,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ManageThreads,
                    PermissionsBitField.Flags.SendTTSMessages,
                    PermissionsBitField.Flags.UseApplicationCommands,
                ]
            }
        ])
        .then(() => {
            message[i] = channel.name + ': Permissions set successfully';
        })
        .catch(error => {
            message[i] = channel.name + ': Failed to set permissions.';
            console.error(error);
        })
        .finally(() => {
            updateMessage();
        });
    });
};

module.exports = { data, execute };

/*text channel permission flags: [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ManageWebhooks,
    PermissionsBitField.Flags.CreateInstantInvite,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.SendMessagesInThreads,
    PermissionsBitField.Flags.CreatePublicThreads,
    PermissionsBitField.Flags.CreatePrivateThreads,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.UseExternalStickers,
    PermissionsBitField.Flags.MentionEveryone,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageThreads,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.SendTTSMessages,
    PermissionsBitField.Flags.UseApplicationCommands,
]*/
