const { Telegraf } = require('telegraf')
const moment = require('moment');

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const MASTER_USERID = process.env.MASTER_USERID;

//bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

bot.start((ctx) => ctx.reply('Welcome! Use /shush {duration} to trigger the shush mode.'));

const shushMap = new Map();

bot.command('shush', (ctx) => {
    if (ctx.message.chat.type !== 'group' && ctx.message.chat.type !== 'supergroup') {
        ctx.reply('This command can only be used in a group or supergroup.');
        return;
    }

    const duration = ctx.message.text.split(' ')[1];

    if (!duration) {
        ctx.reply('Please specify the duration for shush mode. Example: /shush 3m');
        return;
    }

    //const userId = getUserId(ctx);
    //const userId = ctx.message.reply_to_message.from.id
    //console.log("userid: ", userId);

    if (ctx.message.reply_to_message) {
        const userId = ctx.message.reply_to_message.from.id;


        if (userId == MASTER_USERID) {
            ctx.reply('I can\'t shush my master ;)');
            return;
        }

        const durationRegex = /^(\d+)([smhd])$/;
        const match = duration.match(durationRegex);

        if (!match) {
            ctx.reply('Invalid duration format. Example: /shush 3m');
            return;
        }

        const timeValue = parseInt(match[1]);
        const timeUnit = match[2];

        let durationMs;

        switch (timeUnit) {
            case 's':
                durationMs = timeValue * 1000;
                break;
            case 'm':
                durationMs = timeValue * 60 * 1000;
                break;
            case 'h':
                durationMs = timeValue * 60 * 60 * 1000;
                break;
            case 'd':
                durationMs = timeValue * 24 * 60 * 60 * 1000;
                break;
            default:
                ctx.reply('Invalid duration unit. Example: /shush 3m');
                return;
        }

        const endTime = moment().add(durationMs, 'ms');
        shushMap.set(userId, endTime);

        ctx.reply(
            `Shush mode activated for ${duration} for the [User](tg://user?id=${userId})`,
            {
                parse_mode: "MarkdownV2",
            }
        );
    } else {
        const messageId = ctx.message.message_id;
        ctx.reply('get educated first! you need to reply to a message from the user you want to shush.', { reply_to_message_id: messageId });
    }
});

bot.hears(/grug/i, (ctx) => {
    const messageId = ctx.message.message_id;

    ctx.reply('grug is out! hunting... :(', { reply_to_message_id: messageId });
});

bot.on('message', (ctx) => {
    const userId = ctx.message.from.id;
    const messageId = ctx.message.message_id;

    if (shushMap.has(userId)) {
        const endTime = shushMap.get(userId);

        if (moment() < endTime) {
            ctx.reply('shhhhhhhhh', { reply_to_message_id: messageId });
        } else {
            shushMap.delete(userId);
        }
    }
});


const getUserId = (message) => {
    if (message.reply_to_message) {
        return message.reply_to_message.from.id;
    }
    return message.from.id;
};

bot.launch();