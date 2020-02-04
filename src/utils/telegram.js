import axios from 'axios';

import config from './config';
const telegramUrl = config.get('telegram.url');
const telegramChatId = config.get('telegram.chatId');

export const sendTelegram = (message, chat = telegramChatId) =>
  new Promise((resolve, reject) => {
    axios
      .post(`${telegramUrl}/sendMessage`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        chat_id: chat,
        text: message,
      })
      .then(response => {
        if (!response.data.ok) {
          reject(response.data.result);
        }

        resolve({
          id: response.data.result.message_id,
          status: response.data.ok,
        });
      })
      .catch(error => {
        reject(error);
      });
  });
