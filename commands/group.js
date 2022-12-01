const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('group')
    .setDescription('Request group number to be assigned the corresponding role .')
    .addIntegerOption((option) => option
        .setName('group_number') // must be underscore format
        .setDescription('The group you request to be assigned to.')
        .setMinValue(1)
        .setMaxValue(23)
        .setRequired(true));

const execute = async (interaction) => {
    await interaction.deferReply();
    const roleName = 'Group ' + interaction.options.getInteger('group_number');
    // get group role
    interaction.guild.roles.fetch()
        .then(roles => {
            let role = roles.find(role => role.name === roleName);
            // if desired group role exists, shed other group roles at the same time
            if (role) {
                let newRoles = interaction.member.roles.cache.filter(role => !role.name.startsWith('Group'));
                newRoles.set(role.snowflake, role);
                interaction.member.roles.set(newRoles, 'Changing to new group')
                    .then(member => interaction.editReply(`${member.displayName} is now in ${role.name}.`))
                    .catch(error => {
                        interaction.editReply('Error setting new group role.')
                        console.error(error);
                    });
            } else {
                interaction.editReply('Cannot find requested group role.');
            }
        })
        .catch(error => {
            interaction.editReply('Error fetching guild roles.');
            console.error(error);
        });
};

module.exports = { data, execute };
