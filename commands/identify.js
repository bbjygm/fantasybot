const fuzzysort = require('fuzzysort');
const fs = require('node:fs');
const { SlashCommandBuilder } = require('discord.js');

// todo: autocomplete usernames

const data = new SlashCommandBuilder()
    .setName('identify')
	.setDescription('Associate your discord with a given forum username.')
	.addStringOption((option) => option
        .setName('username') // must be underscore format
        .setDescription('Your forum username.')
        .setRequired(true));

const execute = async (interaction) => {
    // send "thinking" reply
    await interaction.deferReply();
    // get desired username
    const username = interaction.options.getString('username');
    // interaction.guild.members.fetch({ query: username, limit: 1 })
    // read config string from file, then parse and get group role
    let groupRole;
    try {
    	const config = fs.readFileSync('fantasyConfig.txt', { encoding: 'utf8' });
        config.split('|').forEach(group => {
            let [number, manager, members] = group.split(';');
            members = members.split(',');
            if (members.includes(username)) {
                groupRole = interaction.guild.roles.cache.find(role => role.name === `Group ${number}`);
            }
        });
    } catch (error) {
        console.error('User ' + username + '\'s group not found in config.');
    }
    
    // get 'Identified' role
    const identifiedRole = interaction.guild.roles.cache.filter(role => role.name === 'Identified');
    if (!identifiedRole) {
        interaction.editReply('Cannot find "Identified" role.');
    } else {
        // get SHL usernames
        fetch('https://cards.simulationhockey.com/api/v2/users')
            .then(resp => resp.json())
            .then(users => {
                let names = users.map(user => user.username);
                // check if desired name is on forum
                if (names.includes(username)) {
                    // set guild member's nickname
                    interaction.editReply('Identity found. Setting nickname: ' + username);
                    interaction.member.setNickname(username, 'Requested through bot');
                    interaction.member.roles.add(identifiedRole)
                    	.then(roles => {
                            // set member's role if group role was found
                            if (groupRole) interaction.member.roles.add(groupRole, 'Identified group member');
                        });
                } else {
                    // look for similar names (https://stackoverflow.com/questions/23305000/javascript-fuzzy-search-that-makes-sense)
                    // https://github.com/farzher/fuzzysort
                    let possible = fuzzysort.go(username, names, { threshold: 0, limit: 3 }).map(r => r.target);
                    if (possible.length) {
                        interaction.editReply(`${username} not found. Did you mean: ${possible.join(', ')}?`);
                    } else {
                        interaction.editReply('Unsuccessful. Try again.');
                    }
                }
            })
            .catch(error => {
                console.error(error);
                interaction.editReply('Error executing command.');
            });
    }
}

module.exports = { data, execute };