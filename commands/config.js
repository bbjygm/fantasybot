const fs = require('node:fs');
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
.setName('config')
.setDescription('Config group channels with given input.')
// Format: GROUP#;MANAGER;MEMBER#1[,MEMBER#2...][|GROUP#;MANAGER;MEMBER#1[,MEMBER#2...]]
.addStringOption((option) => option
	.setName('config_string') // must be underscore format
	.setDescription('Config string detailing group managers and members.')
		.setRequired(true))
	.setDefaultMemberPermissions(0); // admin only by default

const execute = async (interaction) => {
	// send "thinking" reply
	await interaction.deferReply();
	// split config string into groups
	const config = interaction.options.getString('config_string');
	// if (!config) interaction.editReply('Error parsing config string.');
    // save string to file
    fs.writeFileSync('./fantasyConfig.txt', config);
	
	// record members to be grouped
	let participatingMembers = [];
    let totalGroups = 0;
	// parse config string
	const groups = config.split('|').map(group => {
		let [number, manager, members] = group.split(';');
		members = members.split(',');
		participatingMembers.push(...members.filter(Boolean));
        if (manager) totalGroups++;
		return { number, manager, members };
	});
	
    // fetch stuff
    const members = await interaction.guild.members.fetch();
    const roles = await interaction.guild.roles.fetch();
    const channels = await interaction.guild.channels.fetch();
    // get 'Identified' role
    const identifiedRole = roles.find(role => role.name === 'Identified');
    
    // message creation stuff
    const messageData = { managers: 0, members: 0, done: 0 };
    const updateMessage = async (key) => {
        messageData[key]++;
        await interaction.editReply([
            `managers: ${messageData.managers} / ${totalGroups}`,
            `members: ${messageData.members} / ${members.size}`,
            (messageData.done > 0 ? 'Config set successfully' : undefined)
        ].join('\n'));
    };
    
    // loop through groups, setting manager and giving members proper group roles
    await groups.forEach(async group => {
        // get group channel
        const channel = channels.find(c => new RegExp(`^group-${group.number}(?:-|$)`).test(c.name));
        // if channel not found, skip
        if (!channel) return;
        // rename group to include manager
        await channel.setName(['group', group.number, group.manager].join('-'), 'Config change group manager')
            // .then(async () => {
            // 	if (group.manager) await updateMessage('managers')
        	// });
        
        // get group role
        const role = roles.find(role => role.name === `Group ${group.number}`);
        // if desired group role does not exist, skip to next
        if (!role) return;
        
        // loop through members
        await group.members.forEach(async name => {
            // get member with display name and 'Identified' role
            const member = members.find(member => member.displayName === name && member.roles.cache.has(identifiedRole.id));
            // if desired member not available, skip
            if (!member) return;
            // set new group role and remove other group roles
            let newRoles = member.roles.cache.filter(role => !role.name.startsWith('Group'));
            newRoles.set(role.id, role);
            await member.roles.set(newRoles, 'Config change group member')
                // .then(async () => await updateMessage('members'));
        });
    });
    
    // loop through members, removing group roles if not participating
    await members.forEach(async member => {
        // skip if participating
        if (participatingMembers.includes(member.displayName)) return;
        // remove group roles
        let newRoles = member.roles.cache.filter(role => !role.name.startsWith('Group'));
        await member.roles.set(newRoles, 'Config remove group member')
            // .then(async () => await updateMessage('members'))
            .catch(async error => {
				console.error(error);
            	// await updateMessage('members');
            });
    });
    
    // success message
    await interaction.editReply('Config set successfully.');
    // await updateMessage('done');
};

module.exports = { data, execute };