// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import { Buffer } from 'node:buffer';

/**
 * Для корректной работы process.env требуется @types/node и соответствующая настройка tsconfig.json
 */
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}
if (!TELEGRAM_CHAT_ID) {
  throw new Error('TELEGRAM_CHAT_ID is not set in environment variables');
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Универсальная функция отправки сообщения в Telegram
 * @param message Текст сообщения
 * @param chatId ID чата (по умолчанию из env)
 */
export async function sendMessage(message: string, chatId: string = TELEGRAM_CHAT_ID): Promise<void> {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Telegram API error: ${error}`);
  }
}

/**
 * Универсальная функция отправки фото в Telegram
 * @param photoUrlOrBuffer Ссылка на фото или Buffer
 * @param caption Подпись (опционально)
 * @param chatId ID чата (по умолчанию из env)
 */
export async function sendPhoto(photoUrlOrBuffer: string | Buffer, caption?: string, chatId: string = TELEGRAM_CHAT_ID): Promise<void> {
  const url = `${TELEGRAM_API_URL}/sendPhoto`;
  let body: any;
  let headers: any = {};

  if (typeof photoUrlOrBuffer === 'string') {
    // Ссылка на фото
    body = {
      chat_id: chatId,
      photo: photoUrlOrBuffer,
      caption,
      parse_mode: 'HTML',
      disable_notification: false,
    };
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  } else {
    // Buffer (файл)
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', photoUrlOrBuffer, 'skin.png');
    if (caption) form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    body = form;
    headers = form.getHeaders();
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Telegram API error: ${error}`);
  }
}

/**
 * Уведомление о смене скина: отправляет ссылку и сжатое фото
 * @param playerName Имя игрока
 * @param skinPath Путь к скину (относительный)
 */
export async function notifySkinChange(playerName: string, skinPath: string): Promise<void> {
  // Ссылка на скин через API
  const skinUrl = `${process.env.PUBLIC_API_URL || ''}/user/${encodeURIComponent(playerName)}/skin`;
  const caption = `🧑‍🎨 <b>Игрок</b> <code>${playerName}</code> сменил скин\n<a href=\"${skinUrl}\">Скачать скин</a>`;
  // Отправляем фото по ссылке (Telegram сам сожмёт превью)
  await sendPhoto(skinUrl, caption);
}

// В будущем можно добавить notifyAllianceChange, notifyStateChange и т.д. 