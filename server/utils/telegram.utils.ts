import { $fetch } from 'ofetch';
import { Buffer } from 'node:buffer';
import { useRuntimeConfig } from '#imports';

type ChatId = string | number;

interface SendOptions {
  chatId?: ChatId;
  threadId?: number; // message_thread_id
}

interface TelegramConfig {
  botToken: string;
  defaultChatId: ChatId;
  defaultThreadId?: number;     // General topic (fallback)
  skinsThreadId?: number;       // Specific topic for skins
  publicApiUrl?: string;
}

/**
 * Helper to parse optional integer from config.
 */
function parseTopicId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Retrieves Telegram configuration from runtime config.
 */
function getTelegramConfig(): TelegramConfig {
  const config = useRuntimeConfig();

  const botToken = (config.telegramBotToken || config.TELEGRAM_BOT_TOKEN) as string;
  const defaultChatId = (config.telegramChatId || config.TELEGRAM_CHAT_ID) as ChatId;
  const publicApiUrl = (config.publicApiUrl || config.PUBLIC_API_URL) as string;

  // 1. Default Topic (general)
  const defaultThreadId = parseTopicId((config as any).telegramThreadId ?? (config as any).TELEGRAM_THREAD_ID);

  // 2. Skins Topic
  const skinsThreadId = parseTopicId((config as any).telegramTopicSkins ?? (config as any).TELEGRAM_TOPIC_SKINS);

  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is missing in runtimeConfig');
  if (!defaultChatId) throw new Error('TELEGRAM_CHAT_ID is missing in runtimeConfig');

  return { botToken, defaultChatId, defaultThreadId, skinsThreadId, publicApiUrl };
}

/**
 * Helper to resolve final Chat ID and Thread ID.
 */
function getTarget(opts?: SendOptions) {
  const { defaultChatId, defaultThreadId } = getTelegramConfig();
  return {
    chat_id: opts?.chatId ?? defaultChatId,
    message_thread_id: opts?.threadId ?? defaultThreadId,
  };
}

/**
 * Helper to construct the API URL.
 */
function getApiUrl(method: string): string {
  const { botToken } = getTelegramConfig();
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

/**
 * Sends a text message to Telegram.
 * @param message - Text to send.
 * @param opts - Target options (chatId, threadId).
 */
export async function sendMessage(message: string, opts?: SendOptions): Promise<void>;
export async function sendMessage(message: string, chatId: ChatId, threadId?: number): Promise<void>;
export async function sendMessage(message: string, chatIdOrOpts?: ChatId | SendOptions, threadId?: number): Promise<void> {
  const url = getApiUrl('sendMessage');

  const options = typeof chatIdOrOpts === 'object' ? chatIdOrOpts : { chatId: chatIdOrOpts, threadId };
  const target = getTarget(options);

  const body = {
    ...target,
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
  } catch (error: any) {
    throw new Error(`Telegram API sendMessage error: ${JSON.stringify(error?.data || error?.message)}`);
  }
}

/**
 * Sends a photo to Telegram (URL or Buffer).
 * @param photoUrlOrBuffer - Image URL string or Buffer.
 * @param caption - Optional caption.
 * @param opts - Target options (chatId, threadId).
 */
export async function sendPhoto(photoUrlOrBuffer: string | Buffer, caption?: string, opts?: SendOptions): Promise<void>;
export async function sendPhoto(photoUrlOrBuffer: string | Buffer, caption?: string, chatIdOrOpts?: ChatId | SendOptions, threadId?: number): Promise<void> {
  const url = getApiUrl('sendPhoto');

  const options = typeof chatIdOrOpts === 'object' ? chatIdOrOpts : { chatId: chatIdOrOpts, threadId };
  const target = getTarget(options);

  try {
    // Case 1: Send by URL
    if (typeof photoUrlOrBuffer === 'string') {
      await $fetch(url, {
        method: 'POST',
        body: {
          ...target,
          photo: photoUrlOrBuffer,
          caption,
          parse_mode: 'HTML',
        },
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }

    // Case 2: Send by Buffer (Multipart)
    const form = new FormData();
    form.append('chat_id', String(target.chat_id));
    if (target.message_thread_id) form.append('message_thread_id', String(target.message_thread_id));

    form.append('photo', new Blob([photoUrlOrBuffer as unknown as BlobPart]), 'image.png');

    if (caption) form.append('caption', caption);
    form.append('parse_mode', 'HTML');

    await $fetch(url, {
      method: 'POST',
      body: form,
    });

  } catch (error: any) {
    throw new Error(`Telegram API sendPhoto error: ${JSON.stringify(error?.data || error?.message)}`);
  }
}

/**
 * Notifies about a skin change event (Sends to Skins Topic).
 * Automatically uses `skinsThreadId` from config unless overridden.
 */
export async function notifySkinChange(playerName: string, skinBuffer: Buffer, opts?: SendOptions): Promise<void> {
  const config = getTelegramConfig();

  // 1. Manual `threadId` in opts (highest priority)
  // 2. Configured `skinsThreadId`
  // 3. Default `defaultThreadId` (fallback)
  const targetThreadId = opts?.threadId ?? config.skinsThreadId ?? config.defaultThreadId;

  const caption = `🧑‍🎨 <b>Player</b> <code>${playerName}</code> changed skin`;

  await sendPhoto(skinBuffer, caption, { ...opts, threadId: targetThreadId });
}