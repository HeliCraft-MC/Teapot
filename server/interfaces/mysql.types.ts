export interface AuthUser {
    NICKNAME: string
    LOWERCASENICKNAME: string
    HASH: string
    IP: string | null
    isAdmin: number | null
    TOTPTOKEN: string | null
    REGDATE: number | null
    UUID: string
    UUID_WR: string
    PREMIUMUUID: string | null
    LOGINIP: string | null
    LOGINDATE: number | null
    ISSUEDTIME: number | null
    accessToken: string | null
    serverID: string | null
    hwidId: number | null
}
