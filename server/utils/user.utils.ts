import bcrypt from 'bcrypt'
import { AuthUser } from '~/interfaces/mysql.types'
import {useMySQL} from "~/plugins/mySql";
import {ResultSetHeader, RowDataPacket} from "mysql2";

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
export async function resolveUuid(id: string, normalize? :boolean): Promise<string> {
  const candidate = id.trim()
  if (normalize == undefined) {
    normalize = true
  }

  if (!candidate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty id',
      data: { statusMessageRu: 'Пустой параметр id' }
    })
  }

  if (strictUuidRe.test(candidate)) {
    if (normalize == true) {
      return normalizeUuid(candidate)
    } else {
        return candidate
    }
  }

  const user = await getUserByNickname(candidate)
  if (normalize){
    return normalizeUuid(user.UUID)
  } else {
    return user.UUID
  }
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
  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const stmt = db.prepare('SELECT * FROM AUTH WHERE UUID_WR = ? OR UUID = ?')
  // const user = await stmt.get(uuid, uuid) as AuthUser | undefined

  const sql = 'SELECT * FROM `AUTH` WHERE `UUID_WR` = ? OR `UUID` = ?';
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid, uuid]);
  const user = rows[0] as AuthUser | undefined;

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    });
  }

  return user;
}


/**
 * Получить пользователя по nickname (регистр не учитывается)
 */
export async function getUserByNickname(nickname: string): Promise<AuthUser> {
  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const stmt = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
  // const user = await stmt.get(normalizeNickname(nickname)) as AuthUser | undefined

  const sql = 'SELECT * FROM `AUTH` WHERE `LOWERCASENICKNAME` = ?';
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [normalizeNickname(nickname)]);
  const user = rows[0] as AuthUser | undefined;

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    });
  }

  return user;
}


export async function searchUsers(query: string, startAt?: number, limit?: number): Promise<AuthUser[]> {
  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const stmt = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME LIKE ? LIMIT ?, ?')
  // const users = await stmt.all(`%${normalizeNickname(query)}%`, startAt ?? 0, limit ?? 10) as AuthUser[]

  const sql = 'SELECT * FROM `AUTH` WHERE `LOWERCASENICKNAME` LIKE ? LIMIT ?, ?';
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [
    `%${normalizeNickname(query)}%`,
    startAt ?? 0,
    limit ?? 10
  ]);

  return rows as AuthUser[];
}


/**
 * Смена никнейма
 *
 * 1. Проверяем валидность нового ника
 * 2. Проверяем, что ник свободен
 * 3. Обновляем NICKNAME и LOWERCASENICKNAME
 */
export async function changeUserNickname(uuid: string, newNickname: string) {
  assertNicknameValid(newNickname);

  const pool = useMySQL('default');
  const lcNick = normalizeNickname(newNickname);

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const existsStmt = db.prepare('SELECT 1 FROM AUTH WHERE LOWERCASENICKNAME = ? AND UUID <> ?')
  // const exists = await existsStmt.get(lcNick, uuid)

  const checkSql = 'SELECT 1 FROM `AUTH` WHERE `LOWERCASENICKNAME` = ? AND `UUID` <> ?';
  const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [lcNick, uuid]);
  const exists = checkRows.length > 0;

  if (exists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Nickname already taken',
      data: { statusMessageRu: 'Ник уже занят' }
    });
  }

  // DEPRECATED, keeping this for info
  // const upd = db.prepare('UPDATE AUTH SET NICKNAME = ?, LOWERCASENICKNAME = ? WHERE UUID = ?')
  // await upd.run(newNickname, lcNick, uuid)

  const updateSql = 'UPDATE `AUTH` SET `NICKNAME` = ?, `LOWERCASENICKNAME` = ? WHERE `UUID` = ?';
  await pool.execute(updateSql, [newNickname, lcNick, uuid]);

  return { uuid, newNickname };
}


/**
 * Смена пароля
 *
 */
export async function changeUserPassword(
    uuid: string,
    oldPassword: string,
    newPassword: string
) {
  assertPasswordValid(newPassword);

  const user = await getUserByUUID(uuid);

  // Сверяем старый пароль
  if (!(await bcrypt.compare(oldPassword, user.HASH))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
      data: { statusMessageRu: 'Неверный пароль' }
    });
  }

  // Генерируем хеш нового пароля
  const newHash = await bcrypt.hash(newPassword, 10);

  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const upd = db.prepare('UPDATE AUTH SET HASH = ? WHERE UUID = ?')
  // await upd.run(newHash, uuid)

  const sql = 'UPDATE `AUTH` SET `HASH` = ? WHERE `UUID` = ?';
  await pool.execute(sql, [newHash, uuid]);

}


/**
 * Удаление аккаунта
 */
export async function deleteUser(uuid: string) {
  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const del = db.prepare('DELETE FROM AUTH WHERE UUID = ?')
  // const res = await del.run(uuid)

  const sql = 'DELETE FROM `AUTH` WHERE `UUID` = ? or `UUID_WR` = ?';
  const [result] = await pool.execute<ResultSetHeader>(sql, [uuid]);

  if (result.affectedRows === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    });
  }
}



export async function isUserAdmin(uuid: string): Promise<boolean> {
  const pool = useMySQL('default');

  // DEPRECATED, keeping this for info
  // const db = useDatabase()
  // const stmt = db.prepare('SELECT isAdmin FROM AUTH WHERE UUID_WR = ? OR UUID = ?')
  // const user = await stmt.get(uuid, uuid) as { isAdmin: number } | undefined

  const sql = 'SELECT `isAdmin` FROM `AUTH` WHERE `UUID_WR` = ? OR `UUID` = ?';
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid, uuid]);
  const user = rows[0] as { isAdmin: number } | undefined;

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      data: { statusMessageRu: 'Пользователь не найден' }
    });
  }

  return user.isAdmin === 1;
}
