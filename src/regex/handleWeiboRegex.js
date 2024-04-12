import { EmbedBuilder } from 'discord.js';
import axios from 'axios';
import cheerio from 'cheerio';
import { messageSender } from '../events/messageSender.js';
import { embedSuppresser } from '../events/embedSuppresser.js';
import { typingSender } from '../events/typingSender.js';

export async function handleWeiboRegex(result, message) {
  typingSender(message);
  try {
    const weiboResp = await axios.request({
      method: 'get',
      url: 'https://m.weibo.cn/statuses/show',
      params: {
        id: result[1],
      },
      timeout: 2000,
    });

    if (weiboResp.status === 200) {
      const weiboEmbed = new EmbedBuilder();
      weiboEmbed.setColor(0xff0000);
      try {
        if (weiboResp.data.data.user?.screen_name) {
          weiboEmbed.setTitle(weiboResp.data.data.user.screen_name);
          weiboEmbed.setURL('https://m.weibo.cn/detail/' + result[1]);
        }
      } catch {}
      try {
        if (weiboResp.data.data.text) {
          const $ = cheerio.load(weiboResp.data.data.text);
          const cleanedText = $.text();
          weiboEmbed.setDescription(cleanedText);
        }
      } catch {}
      try {
        if (weiboResp.data.data.pics) {
          const match = weiboResp.data.data.pics[0].large.url.match(/https:\/\/(\w+)\.sinaimg\.cn\/(.+)/);
          if (match) {
            weiboEmbed.setImage(`https://weibo-pic.canaria.cc/${match[1]}/${match[2]}`);
          }
        }
      } catch {}

      const weiboinfo ='💬' + weiboResp.data.data.comments_count.toString() + ' 🔁' + weiboResp.data.data.reposts_count.toString() + ' ❤️' + weiboResp.data.data.attitudes_count.toString();

      messageSender(message, weiboEmbed, weiboinfo);
      embedSuppresser(message);

      try {
        if (weiboResp.data.data.pics?.length > 1) {
          weiboResp.data.data.pics
              .filter((_pic, index) => index > 0 && index < 4)
              .forEach((pic) => {
                const match = pic.large.url.match(/https:\/\/(\w+)\.sinaimg\.cn\/(.+)/);
                if (match) {
                  const picEmbed = new EmbedBuilder();
                  picEmbed.setColor(0xff0000);
                  picEmbed.setImage(`https://weibo-pic.canaria.cc/${match[1]}/${match[2]}`);
                  messageSender(message, picEmbed, 'ermiana');
                }
              });
        }
      } catch {}
    }
  } catch {
    console.log('weibo error: '+ message.guild.name);
  }
};
