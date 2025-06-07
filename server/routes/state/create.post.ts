import {declareNewState} from "~/utils/states/state.utils";
import {H3Error, MultiPartData} from "h3";
import {fileTypeFromBuffer} from "file-type";
import sharp from "sharp";

defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Create a state'
  }
})

export default defineEventHandler(async (event) => {
    const { uuid } = event.context.auth || {}

    if (!uuid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
    }

    const {
        name,
        description,
        color,
        govForm,
        hasElections,
        telegramLink,
        allowDualCitezenship,
        freeEntry,
        freeEntryDesc,
    } = await readBody(event)

    const parts = await readMultipartFormData(event)
    let _part: MultiPartData;
    if (parts.length == 1) _part = parts[0]

    if (_part.data.length > 1_048_576) {
        throw createError({ statusCode: 413, statusMessage: 'File too big' })
    }
    const ft = await fileTypeFromBuffer(_part.data)
    if (!ft || ft.mime !== 'image/png') {
        throw createError({ statusCode: 415, statusMessage: 'PNG only' })
    }
    try{
        const stateUuid = await declareNewState(
            name,
            description,
            color,
            govForm,
            hasElections,
            telegramLink,
            uuid,
            uuid,
            allowDualCitezenship,
            freeEntry,
            freeEntryDesc,
            await sharp(_part.data).toBuffer()
        )
        return { uuid: stateUuid }
    } catch (e) {
        if (e instanceof H3Error || e instanceof Error) {
            throw e;
        }  else {
            console.warn(e)
            throw createError({
                statusCode: 500,
                statusMessage: 'Unexpected server error'
            })
        }
    }
})