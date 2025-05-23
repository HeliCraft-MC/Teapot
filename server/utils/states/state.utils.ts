import { useStatesSQLite } from "~/plugins/stateSqlite";

async function saveStateFlag(
    data: Buffer,
    mime = 'image/png',
    uuid?: string,
): Promise<string | boolean> {
    const { uploadDir = './uploads' } = useRuntimeConfig()
    const db = useStatesSQLite()
    if (uuid) {
        // TODO: удаляем старый флаг и устанавливаем новый, государству с uuid, устанавливаем в бд самостоятельно, возвращаем boolean
    }
    else {
        // TODO: грузим новый флаг и возвращаем строку локацию, не устанавливаем в бд самостоятельно, возвращаем строку с путем
    }
}

export async function saveState(
    name: string,
    description: string,
    govForm: string = 'Неустановленное государство',
    mapLink: string = '',
    creatorUuid: string,
    rulerUuid: string = creatorUuid,
    managerUuids: string[] = [],
    citizenUuids: string[] = [creatorUuid],
    applicantUuids: string[] = [],
    allowOtherCitizenships: boolean = true,
    uuid?: string,
    flag: Buffer | string = '',
    mime = 'image/png',
) {
    // TODO сохраняем государство, генерируем uuid если надо, загружаем флаг через savestateflag() и возвращаем объект государство
}

export async function deleteState(uuid: string, userUuid: string) {
    // TODO проверяем что удаляющий правитель и удаляем государство
}

export async function getState(uuid: string) {
    // TODO возвращаем государство
}

export async function getStates(from: number = 0, to: number = 10, nameSearch?: string) {
    // TODO возвращаем список государств
}

export async function getStatesCount() {
    // TODO возвращаем количество государств
}

export async function getUserStates(uuid: string) {
    // TODO возвращаем список государств в которых у пользователя есть гражданство
}

export async function requestToJoinState(uuid: string, userUuid: string) {
    // TODO проверяем что вступающий пользователь не состоит в этом государтве, не подавал заявку ранее и не состоит в государстве, которое запрещает вторые гражданства сейчас
}

export async function approveJoinState(uuid: string, userUuid: string, adminUuid: string) {
    // TODO одобрение заявки. проверяем adminUuid управляющий или правитель, проверяем что userUuid не состоит в других государствах запрещяющих вторые гражданства, удаляем заявку и устанавливаем гражданство, возвращаем boolean
}

export async function rejectJoinState(uuid: string, userUuid: string, adminUuid: string) {
    // TODO проверяем adminUuid управляющий или правитель, удаляем заявку, возвращаем boolean
}

export async function leaveState(uuid: string, userUuid: string) {
    // TODO проверяем, что userId не правитель, удаляем гражданство(и из менеджеров если он там есть) и возвращаем boolean
}

export async function kickUserFromState(uuid: string, userUuid: string, adminUuid: string) {
    // TODO проверяем adminUuid управляющий или правитель, удаляем гражданство, возвращаем boolean
}

export async function changeStateName(uuid: string, name: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем новое имя
}

export async function changeStateDescription(uuid: string, description: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем новое описание
}

export async function changeStateGovForm(uuid: string, govForm: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем новую форму государства
}

export async function changeStateMapLink(uuid: string, mapLink: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем новую ссылку на карту
}

export async function changeStateFlag(uuid: string, flag: Buffer | string, mime: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем новую флагу
}

export async function changeRuler(uuid: string, newRulerUuid: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем нового правителя
}

export async function addManager(uuid: string, newManagerUuid: string, userUuid: string) {
    // TODO проверяем userUuid правитель, устанавливаем нового менеджера
}

export async function removeManager(uuid: string, managerUuid: string, userUuid: string) {
    // TODO проверяем userUuid правитель, удаляем менеджера
}