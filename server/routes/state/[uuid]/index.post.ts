import { H3Error, MultiPartData } from "h3";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { GovernmentForm, IState } from "~/interfaces/state/state.types";
import { editState } from "~/utils/states/state.utils";

defineRouteMeta({
    openAPI: {
        tags: ["state"],
        description: "Edit a state",
    },
});

// 👇 Локально расширяем входной тип патча так, чтобы flag_link мог быть string | Buffer | null
type StatePatchInput = Omit<Partial<IState>, "flag_link"> & {
    flag_link?: string | Buffer | null;
};

export default defineEventHandler(async (event) => {
    const { uuid } = event.context.auth || {};

    if (!uuid) {
        throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
    }

    const stateUuid = getRouterParam(event, "uuid");

    const parts = await readMultipartFormData(event);

    const bodyData: Record<string, any> = {};
    let filePart: MultiPartData | undefined;

    if (parts) {
        for (const part of parts) {
            if (part.name) {
                if (part.filename) {
                    if (part.name === "flag") {
                        filePart = part;
                    }
                } else {
                    bodyData[part.name] = part.data.toString();
                }
            }
        }
    }

    const {
        name,
        description,
        color,
        govForm, // string -> GovernmentForm
        hasElections, // 'true' | 'false'
        telegramLink,
        allowDualCitezenship, // typo в поле формы -> allow_dual_citizenship
        freeEntry, // 'true' | 'false'
        freeEntryDesc,
        // опционально могут прилететь и другие ключи (mapLink, capitalUuid и т. п.)
        mapLink,
        capitalUuid,
        rulerUuid,
    } = bodyData;

    if (filePart) {
        if (filePart.data.length > 1_048_576) {
            // 1MB
            throw createError({ statusCode: 413, statusMessage: "File too big" });
        }
        const ft = await fileTypeFromBuffer(filePart.data);
        if (!ft || ft.mime !== "image/png") {
            throw createError({ statusCode: 415, statusMessage: "PNG only" });
        }
    }

    // Приведение типов из строк формы
    let parsedGovForm: GovernmentForm | undefined;
    let parsedHasElections: boolean | undefined;
    let parsedAllowDualCitizenship: boolean | undefined;
    let parsedFreeEntry: boolean | undefined;

    if (govForm) {
        // Здесь предполагается, что на вход пришло валидное строковое значение из enum GovernmentForm
        parsedGovForm = govForm as GovernmentForm;
    }
    if (hasElections !== undefined) parsedHasElections = hasElections === "true";
    if (allowDualCitezenship !== undefined)
        parsedAllowDualCitizenship = allowDualCitezenship === "true";
    // ✅ фикс: парсим из freeEntry, а не проверяем неинициализированную переменную
    if (freeEntry !== undefined) parsedFreeEntry = freeEntry === "true";

    // Хелпер: если строка есть, но пустая — пишем null (для nullable полей)
    const strOrNull = (v: unknown): string | null | undefined => {
        if (v === undefined) return undefined; // ключ не трогаем
        if (typeof v !== "string") return null;
        const s = v.trim();
        return s.length ? s : null;
    };

    // Собираем патч аккуратно, только заданные ключи
    const preparedStructure: StatePatchInput = {};

    // Указываем, что редактируем конкретную запись
    if (stateUuid) preparedStructure.uuid = stateUuid;

    if (name !== undefined) preparedStructure.name = name;
    if (description !== undefined) preparedStructure.description = description;

    // color (из формы) -> color_hex в модели
    if (color !== undefined) preparedStructure.color_hex = color;

    if (parsedGovForm !== undefined) preparedStructure.gov_form = parsedGovForm;
    if (parsedHasElections !== undefined)
        preparedStructure.has_elections = parsedHasElections;

    if (mapLink !== undefined)
        preparedStructure.map_link = strOrNull(mapLink) ?? null;

    if (telegramLink !== undefined)
        preparedStructure.telegram_link = strOrNull(telegramLink) ?? null;

    if (capitalUuid !== undefined)
        preparedStructure.capital_uuid = strOrNull(capitalUuid) ?? null;

    if (rulerUuid !== undefined) preparedStructure.ruler_uuid = rulerUuid;

    if (parsedAllowDualCitizenship !== undefined)
        preparedStructure.allow_dual_citizenship = parsedAllowDualCitizenship;

    if (parsedFreeEntry !== undefined)
        preparedStructure.free_entry = parsedFreeEntry;

    if (freeEntryDesc !== undefined)
        preparedStructure.free_entry_description = strOrNull(freeEntryDesc) ?? null;

    // Флаг: кладём Buffer — editState умеет его преобразовывать через flagToUploads
    if (filePart) {
        // sharp не обязателен, но если ты хочешь нормализовать — оставь:
        const normalizedPng = await sharp(filePart.data).png().toBuffer();
        preparedStructure.flag_link = normalizedPng; // <- Buffer, тип теперь валиден
    }

    try {
        // При вызове приводим тип к Partial<IState>, чтобы сигнатура совпала.
        // Это безопасно, т.к. editState сам обрабатывает Buffer в flag_link.
        const updatedUuid = await editState(preparedStructure as Partial<IState>);
        return { uuid: updatedUuid };
    } catch (e) {
        if (e instanceof H3Error || e instanceof Error) {
            throw e;
        } else {
            console.warn(e);
            throw createError({
                statusCode: 500,
                statusMessage: "Unexpected server error",
            });
        }
    }
});
