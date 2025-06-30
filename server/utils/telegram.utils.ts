// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { $fetch } from 'ofetch';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import { Buffer } from 'node:buffer';
import { useRuntimeConfig } from '#imports';

function getTelegramConfig() {
  const config = useRuntimeConfig();
  const TELEGRAM_BOT_TOKEN = config.telegramBotToken || config.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = config.telegramChatId || config.TELEGRAM_CHAT_ID;
  const PUBLIC_API_URL = config.publicApiUrl || config.PUBLIC_API_URL;
  if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set in runtimeConfig');
  if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID is not set in runtimeConfig');
  return { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PUBLIC_API_URL };
}

/**
 * Универсальная функция отправки сообщения в Telegram
 * @param message Текст сообщения
 * @param chatId ID чата (по умолчанию из runtimeConfig)
 */
export async function sendMessage(message: string, chatId?: string): Promise<void> {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = getTelegramConfig();
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  const body = {
    chat_id: chatId || TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  try {
    await $fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    throw new Error(`Telegram API error: ${e?.data ? JSON.stringify(e.data) : e.message}`);
  }
}

/**
 * Универсальная функция отправки фото в Telegram
 * @param photoUrlOrBuffer Ссылка на фото или Buffer
 * @param caption Подпись (опционально)
 * @param chatId ID чата (по умолчанию из runtimeConfig)
 */
export async function sendPhoto(photoUrlOrBuffer: string | Buffer, caption?: string, chatId?: string): Promise<void> {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = getTelegramConfig();
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const url = `${TELEGRAM_API_URL}/sendPhoto`;
  let body: any;
  let headers: any = {};

  if (typeof photoUrlOrBuffer === 'string') {
    // Ссылка на фото
    body = {
      chat_id: chatId || TELEGRAM_CHAT_ID,
      photo: photoUrlOrBuffer,
      caption,
      parse_mode: 'HTML',
      disable_notification: false,
    };
    headers['Content-Type'] = 'application/json';
    try {
      await $fetch(url, {
        method: 'POST',
        body,
        headers,
      });
    } catch (e: any) {
      throw new Error(`Telegram API error: ${e?.data ? JSON.stringify(e.data) : e.message}`);
    }
  } else {
    // Buffer (файл)
    const form = new FormData();
    form.append('chat_id', chatId || TELEGRAM_CHAT_ID);
    form.append('photo', photoUrlOrBuffer, 'skin.png');
    if (caption) form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    body = form;
    headers = form.getHeaders();
    try {
      await $fetch(url, {
        method: 'POST',
        body,
        headers,
      });
    } catch (e: any) {
      throw new Error(`Telegram API error: ${e?.data ? JSON.stringify(e.data) : e.message}`);
    }
  }
}

/**
 * Уведомление о смене скина: отправляет ссылку и сжатое фото
 * @param playerName Имя игрока
 * @param skinPath Путь к скину (относительный)
 */
export async function notifySkinChange(playerName: string, skinPath: string): Promise<void> {
  const { PUBLIC_API_URL } = getTelegramConfig();
  const skinUrl = `${PUBLIC_API_URL || ''}/user/${encodeURIComponent(playerName)}/skin`;
  const caption = `🧑‍🎨 <b>Игрок</b> <code>${playerName}</code> сменил скин\n<a href=\"${skinUrl}\">Скачать скин</a>`;
  await sendPhoto(skinUrl, caption);
}

// В будущем можно добавить notifyAllianceChange, notifyStateChange и т.д. 