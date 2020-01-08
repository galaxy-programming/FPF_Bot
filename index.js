const Discord = require("discord.js");
const config = require("./config.json");
const bot = new Discord.Client();
const ytdl = require("ytdl-core");
const queue = new Map();
const ffmpeg = require("ffmpeg")
bot.on("ready", async () => {
    console.log(`${bot.user.username} online in FPF with a current ${bot.users.size} users.`);
	bot.user.setActivity(`Florida Police Force`, {type: "PLAYING"});
})
bot.on('guildMemberAdd', (guildMember) => {
	guildMember.addRole(guildMember.guild.roles.find(role => role.name === "Civilian"));
 })

bot.on("message", async message => {
    if(message.author.bot) return;
    let prefix = config.prefix;
    let messageArray = message.content.split(" ")
    let cmd = messageArray[0];
    let args = messageArray.slice(1)

    if(cmd === `${prefix}ping`){
        return message.channel.send(`Current Ping: ${bot.ping}ms.`).then(message.channel.bulkDelete(2)).then(message.channel.send("Pong!"))
    }

    if(cmd === `${prefix}checkperms`){
        return message.channel.send(message.author.permissions)
    }
    if(cmd === `${prefix}yes`){
        var options = ["yes", "indeed", "affirm", "no"];
var response = options[Math.floor(Math.random()*options.length)];
message.channel.send(response).then().catch(console.error);

    }

    if(cmd === `${prefix}cmds`){
        let commandembed = new Discord.RichEmbed()
        let serverLogo = message.guild.iconURL;
        commandembed.setTitle("My Commands")
        commandembed.setThumbnail(serverLogo)
        commandembed.setColor("#fa3f00")
        .addField("Music", "!play, !skip, !stop")
        .addField("Fun", "!ping", "")
    }

   
	//Optimization needed
	const serverQueue = queue.get(message.guild.id);
	if (cmd === `${prefix}play`) {
		const voiceChannel = message.member.voiceChannel;
		if (!voiceChannel) return;
		const permissions = voiceChannel.permissionsFor(message.client.user)
		if (!permissions.has("CONNECT")) return;
		if (!permissions.has("SPEAK")) return;

		const songInfo = await ytdl.getInfo(args[0]);

		const song = {
			title: songInfo.title,
			url: songInfo.video_url
		};

		if (!serverQueue) {
			const queueConstruct = {
				textChannel: message.channel,
				voiceChannel: voiceChannel,
				connection: null,
				songs: [],
				volume: 5,
				playing: true
			};
			queue.set(message.guild.id, queueConstruct);
			queueConstruct.songs.push(song);
			try {
				var connection = await voiceChannel.join();
				queueConstruct.connection = connection;
				play(message.guild, queueConstruct.songs[0]);
			} catch (error) {
				console.error(`I was unable to join the voice channel ${voiceChannel}, the error is : ${error}`);
				return;
			}
		} else {
			serverQueue.songs.push(song);
			return;
		}

		return;

		
	}
	if (cmd === `${prefix}stop`) {
		if (!message.member.voiceChannel) return;
		message.member.voiceChannel.leave();
		message.channel.send("Player stopped.");
		return;
	}

	if (cmd === `${prefix}skip`) {
		if (!serverQueue) return message.channel.send(`I could not skip anything.`);
		serverQueue.connection.dispatcher.end();
		return;
	}
});

//Always on music :
function play(guild,song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', () => {
			console.log(`song ended`);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
			return;
		})
		.on('error', error => console.error(error));

    dispatcher.setVolumeLogarithmic(5 / 5);
    


    
}
bot.login(config.token);
