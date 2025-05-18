import jsonwebtoken from 'jsonwebtoken';
import { AuthUser } from '~/interfaces/mysql.types'

/**
 * Generates an access token for the provided user.
 *
 * @param {object} user - The user object containing user data. Must include a `UUID` property.
 * @return {string} The generated JWT access token.
 * @throws {Error} If the user object is invalid or missing the `UUID` property.
 */
export function generateAccessToken(user: any) {
    if (!user || !user.UUID) {
        throw new Error('Invalid user object (Must contain UUID at least)');
    }
    const { jwtSecret } = useRuntimeConfig()
    return jsonwebtoken.sign({
        UUID: user.UUID,
        UUID_WR: user.UUID_WR,
        NICKNAME: user.NICKNAME,
        LOWERCASENICKNAME: user.LOWERCASENICKNAME,
        REGDATE: user.REGDATE,
        ISSUEDTIME: user.ISSUEDTIME,
        serverID: user.serverID,
        hwidId: user.hwidId
    }, jwtSecret, { expiresIn: '1h' });
}

/**
 * Generates a refresh token for the provided user.
 *
 * @param {Object} user - The user object for which the refresh token needs to be generated.
 *                        Must include a UUID property.
 * @return {string} A signed JSON Web Token (JWT) representing the refresh token.
 * @throws {Error} If the user object is invalid or does not contain a UUID property.
 */
export function generateRefreshToken(user: any) {
    if (!user || !user.UUID) {
        throw new Error('Invalid user object (Must contain UUID at least)');
    }
    const { jwtSecret } = useRuntimeConfig()
    return jsonwebtoken.sign({
        UUID: user.UUID,
        UUID_WR: user.UUID_WR,
        NICKNAME: user.NICKNAME,
        LOWERCASENICKNAME: user.LOWERCASENICKNAME,
        REGDATE: user.REGDATE,
        ISSUEDTIME: user.ISSUEDTIME,
        serverID: user.serverID,
        hwidId: user.hwidId
    }, jwtSecret, { expiresIn: '7d' });
}

/**
 * Verifies the provided JWT token using the secret key.
 *
 * @param {string} token - The JSON Web Token (JWT) to be verified.
 * @return {object|string} Returns the decoded token payload if verification is successful,
 * or throws an error if the token is invalid or expired.
 */
export function verifyToken(token: string) {
    const { jwtSecret } = useRuntimeConfig()
    return jsonwebtoken.verify(token, jwtSecret);
}

/**
 * Verifies a given token against a user's credentials.
 *
 * @param {string} token - The JWT token to be verified.
 * @param {any} user - The user object containing credentials to match the token.
 * @return {boolean} Returns true if the token is valid and matches the user's UUID, otherwise false.
 */
export async function verifyTokenWithCredentials(token: string, user: any) {
    try {
        const { jwtSecret } = useRuntimeConfig()
        const decoded = await jsonwebtoken.verify(token, jwtSecret);
        // @ts-ignore
        return decoded && decoded.UUID === user.UUID;
    } catch (error) {
        return false;
    }
}

/**
 * Generates access and refresh tokens for the given user.
 *
 * @param {any} user - The user object for which the tokens should be generated.
 * @return {{ accessToken: string, refreshToken: string }} An object containing the access and refresh tokens.
 */
export function generateTokens(user: any) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
}