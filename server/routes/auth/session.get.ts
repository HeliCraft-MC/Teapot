// server/auth/session.get.ts
export default defineEventHandler(async (event) => {
    /* JWT уже проверен middleware ⇒ event.context.auth.uuid есть */
    const { uuid } = event.context.auth || {}

    if (!uuid) {
        /* если Bearer вовсе не был передан, nuxt-auth получит 401 и поймёт,
           что пользователь «гость» */
        throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
    }

    /* найдём пользователя в БД и вернём public-данные */
    const user = await getUserByUUID(uuid)          // утилита из ваших utils
    return {
        uuid: user.UUID,
        nickname: user.NICKNAME
    }
})
