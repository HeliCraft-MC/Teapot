import bcrypt from 'bcrypt'
import { AuthUser } from '~/interfaces/mysql.types'
import {useMySQL} from "~/plugins/mySql";
import {ResultSetHeader, RowDataPacket} from "mysql2";
import { v4 as uuidv4 } from 'uuid';


/**
 * Logs in a user by validating the provided nickname and password.
 * Throws an error if the user is not found or the password is incorrect.
 *
 * @param {string} nickname - The nickname of the user attempting to log in.
 * @param {string} password - The plain-text password provided by the user.
 * @return {Promise<{ tokens: object, uuid: string, nickname: string }>} A promise that resolves to an object containing the user's tokens, UUID, and nickname.
 * @throws {Error} Throws an error if the user is not found or the password is incorrect.
 */
export async function loginUser(nickname: string, password: string) {
    const pool = useMySQL('default');

    // DEPRECATED, keeping this for info
    // const db = useDatabase()
    // const req = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
    // const user = await req.get(nickname.toLowerCase()) as AuthUser

    const sql = 'SELECT * FROM `AUTH` WHERE `LOWERCASENICKNAME` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [nickname.toLowerCase()]);
    const user = rows[0] as AuthUser | undefined;

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        });
    }

    if (!(await bcrypt.compare(password, user.HASH))) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid password',
            data: {
                statusMessageRu: 'Неверный пароль',
            }
        });
    }

    const tokens = generateTokens(user);

    return { tokens, uuid: user.UUID, nickname: user.NICKNAME };
}


/**
 * Registers a new user by creating an account with the provided nickname and password.
 * Throws an error if the nickname is already taken or validation fails.
 *
 * @param {string} nickname - The desired nickname for the new user.
 * @param {string} password - The plain-text password for the new user.
 * @return {Promise<{ tokens: object, uuid: string, nickname: string }>} A promise that resolves to an object containing the user's tokens, UUID, and nickname.
 * @throws {Error} Throws an error if the nickname is already taken or validation fails.
 */
export async function registerUser(nickname: string, password: string) {
    const pool = useMySQL('default');
    
    // Validate nickname length
    if (!nickname || nickname.trim().length < 3) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Nickname is too short (minimum 3 characters)',
            data: {
                statusMessageRu: 'Ник слишком короткий (минимум 3 символа)',
            }
        });
    }
    
    // Validate password length
    if (!password || password.length < 6) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Password is too short (minimum 6 characters)',
            data: {
                statusMessageRu: 'Пароль слишком короткий (минимум 6 символов)',
            }
        });
    }
    
    const lowerCaseNickname = nickname.toLowerCase();
    
    // Check if nickname already exists
    const checkSql = 'SELECT 1 FROM `AUTH` WHERE `LOWERCASENICKNAME` = ?';
    const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [lowerCaseNickname]);
    
    if (checkRows.length > 0) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Nickname already taken',
            data: {
                statusMessageRu: 'Никнейм уже занят',
            }
        });
    }
    
    // Generate UUID and hash password
    const uuid = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    const regDate = Date.now();
    
    // Insert new user into database
    const insertSql = `
        INSERT INTO \`AUTH\` 
        (\`NICKNAME\`, \`LOWERCASENICKNAME\`, \`HASH\`, \`UUID\`, \`REGDATE\`)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    await pool.execute<ResultSetHeader>(insertSql, [
        nickname,
        lowerCaseNickname,
        hash,
        uuid,
        regDate
    ]);
    
    // Retrieve the newly created user to generate tokens
    const selectSql = 'SELECT * FROM `AUTH` WHERE `UUID` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(selectSql, [uuid]);
    const user = rows[0] as AuthUser;
    
    const tokens = generateTokens(user);
    
    return { tokens, uuid: user.UUID, nickname: user.NICKNAME };
}


/**
 * Refreshes the user data by validating the provided refresh token and regenerating tokens if valid.
 *
 * @param {string} uuid - The unique identifier of the user.
 * @param {string} refreshToken - The refresh token to be validated for the user.
 * @return {Promise<{tokens: object, uuid: string, nickname: string}>} A promise that resolves with the regenerated tokens, user's UUID, and nickname if the refresh token is valid.
 * @throws {Error} Throws an error if the user is not found or if the refresh token is invalid.
 */
export async function refreshUser(uuid: string, refreshToken: string) {
    const pool = useMySQL('default');

    // DEPRECATED, keeping this for info
    // const db = useDatabase()
    // const req = db.prepare('SELECT * FROM AUTH WHERE UUID = ? OR UUID_WR = ?')
    // const user = await req.get(uuid, uuid) as AuthUser

    const sql = 'SELECT * FROM `AUTH` WHERE `UUID` = ? OR `UUID_WR` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid, uuid]);
    const user = rows[0] as AuthUser | undefined;

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        });
    }

    if (verifyTokenWithCredentials(refreshToken, user)) {
        const tokens = generateTokens(user);
        return { tokens, uuid: user.UUID, nickname: user.NICKNAME };
    } else {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid refresh token',
            data: {
                statusMessageRu: 'Неверный токен обновления',
            }
        });
    }
}

export async function checkAuth(uuid: string, accessToken: string) {
    const pool = useMySQL('default');

    // DEPRECATED, keeping this for info
    // const db = useDatabase()
    // const req = db.prepare('SELECT * FROM AUTH WHERE UUID = ? OR UUID_WR = ?')
    // const user = await req.get(uuid, uuid) as AuthUser

    const sql = 'SELECT * FROM `AUTH` WHERE `UUID` = ? OR `UUID_WR` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid, uuid]);
    const user = rows[0] as AuthUser | undefined;

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not authorized',
            data: {
                statusMessageRu: 'Не авторизован',
            }
        });
    }

    if (verifyTokenWithCredentials(accessToken, user)) {
        return true;
    } else {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not authorized',
            data: {
                statusMessageRu: 'Не авторизован',
            }
        });
    }
}
