import bcrypt from 'bcrypt'
import { AuthUser } from '~/interfaces/mysql.types'

/* ──────────────────────────────── helpers ──────────────────────────────── */

/** Минимальная длина nick / пароля – при необходимости скорректируйте */
const MIN_NICK_LEN = 3
const MIN_PASS_LEN = 6

/** Приводит ник к «каноническому» нижнему регистру */
function normalizeNickname(nick: string) {
  return nick.trim().toLowerCase()
}

/** Проверка никнейма на простейшие ограничения */
function assertNicknameValid(nick: string) {
  if (nick.length < MIN_NICK_LEN) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Nickname is too short',
      data: { statusMessageRu: 'Ник слишком короткий' }
    })
  }
  // Добавьте другие ограничения (regex, blacklist и т.д.) при необходимости
}

/** Проверка пароля на простейшие ограничения */
function assertPasswordValid(pass: string) {
  if (pass.length < MIN_PASS_LEN) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Password is too short',
      data: { statusMessageRu: 'Пароль слишком короткий' }
    })
  }
}


const strictUuidRe =
  /^(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i

/**
 * Преобразует UUID к каноническому виду: 32 hex-символа, нижний регистр, без дефисов.
 */
function normalizeUuid(raw: string): string {
  return raw.replace(/-/g, '').toLowerCase()
}

/**
 * Принимает строку, содержащую UUID или никнейм, и возвращает
 * UUID в каноническом формате (32 символа, lower-case, без дефисов).
 *
 * @throws 404 – если пользователь с указанным ником не найден
 * @throws 400 – если входная строка пуста или содержит недопустимые символы
 */
export async function resolveUuid(id: string): Promise<string> {
  const candidate = id.trim()

  if (!candidate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty id',
      data: { statusMessageRu: 'Пустой параметр id' }
    })
  }

  if (strictUuidRe.test(candidate)) {
    return normalizeUuid(candidate)
  }

  const user = await getUserByNickname(candidate)
  return normalizeUuid(user.UUID)
}

/** Возвращает только «безопасные» поля пользователя */
export function toPublicUser(user: AuthUser) {
  return {
    uuid: user.UUID,
    nickname: user.NICKNAME,
    regDate: user.REGDATE,
    loginDate: user.LOGINDATE
  }
}

/* ────────────────────────────── main utils ─────────────────────────────── */

/**
 * Получить пользователя по UUID
 */
export async function getUserByUUID(uuid: string): Promise<AuthUser> {
  const db = useDatabase()
  const stmt = db.prepare('SELECT * FROM AUTH WHERE UUID_WR = ? OR UUID = ?')
  const user = await stmt.get(uuid, uuid) as AuthUser | undefined

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    })
  }
  return user
}

/**
 * Получить пользователя по nickname (регистр не учитывается)
 */
export async function getUserByNickname(nickname: string): Promise<AuthUser> {
  const db = useDatabase()
  const stmt = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
  const user = await stmt.get(normalizeNickname(nickname)) as AuthUser | undefined

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    })
  }
  return user
}

/**
 * Смена никнейма
 *
 * 1. Проверяем валидность нового ника
 * 2. Проверяем, что ник свободен
 * 3. Обновляем NICKNAME и LOWERCASENICKNAME
 */
export async function changeUserNickname(uuid: string, newNickname: string) {
  assertNicknameValid(newNickname)

  const db = useDatabase()
  const lcNick = normalizeNickname(newNickname)

  // Ник уже занят?
  const existsStmt = db.prepare(
    'SELECT 1 FROM AUTH WHERE LOWERCASENICKNAME = ? AND UUID <> ?'
  )
  const exists = await existsStmt.get(lcNick, uuid)
  if (exists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Nickname already taken',
      data: { statusMessageRu: 'Ник уже занят' }
    })
  }

  // Обновляем
  const upd = db.prepare(
    'UPDATE AUTH SET NICKNAME = ?, LOWERCASENICKNAME = ? WHERE UUID = ?'
  )
  await upd.run(newNickname, lcNick, uuid)

  return { uuid, newNickname }
}

/**
 * Смена пароля
 *
 * 1. Проверяем старый пароль
 * 2. Хешируем и сохраняем новый
 */
export async function changeUserPassword(
  uuid: string,
  oldPassword: string,
  newPassword: string
) {
  assertPasswordValid(newPassword)

  const user = await getUserByUUID(uuid)

  // Сверяем старый пароль
  if (!(await bcrypt.compare(oldPassword, user.HASH))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
      data: { statusMessageRu: 'Неверный пароль' }
    })
  }

  // Генерируем хеш нового пароля
  const newHash = await bcrypt.hash(newPassword, 10)

  const db = useDatabase()
  const upd = db.prepare('UPDATE AUTH SET HASH = ? WHERE UUID = ?')
  await upd.run(newHash, uuid)

  // по желанию обновляем ISSUEDTIME, LOGINDATE и т.д.
}

/* ─────────────────────── дополнительная утилита ────────────────────────── */

/**
 * Удаление аккаунта
 * (может потребоваться для GDPR или по запросу пользователя)
 */
export async function deleteUser(uuid: string) {
  const db = useDatabase()
  const del = db.prepare('DELETE FROM AUTH WHERE UUID = ?')
  const res = await del.run(uuid)

  if (!res.success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    })
  }
}


export async function isUserAdmin(uuid: string): Promise<boolean> {
  const db = useDatabase()
  const stmt = db.prepare('SELECT isAdmin FROM AUTH WHERE UUID_WR = ? OR UUID = ?')
  const user = await stmt.get(uuid, uuid) as { isAdmin: number } | undefined

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    })
  }

  return user.isAdmin === 1
}