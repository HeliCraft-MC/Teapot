import jsonwebtoken from 'jsonwebtoken';

export function generateAccessToken(user: any) {
    return jsonwebtoken.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(user: any) {
    return jsonwebtoken.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
}

export function generateTokens(user: any) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
}