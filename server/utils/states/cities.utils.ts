import { ICity } from "~/interfaces/state/city.types";
import { v4 as uuidv4 } from 'uuid'
import { getStateByUuid } from "~/utils/states/state.utils"

export async function createCity(name: string, coordinates: string, stateUuid: string, isCapital: boolean): Promise<void>;
export async function createCity(name: string, coordinates: string): Promise<void>;
export async function createCity(name: string, coordinates: string, stateUuid?: string, isCapital: boolean = false): Promise<void> {
    const db = useDatabase('states');
    const insert = db.prepare(`
        INSERT INTO cities (uuid, created, updated, name, coordinates, state_uuid, is_capital)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now()
    const res = await insert.run(uuidv4(), now, now, name, coordinates, stateUuid || null, isCapital ? 1 : 0);

    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create city',
            data: { statusMessageRu: 'Не удалось создать город' }
        });
    }
}

export async function getCityByUuid(uuid: string): Promise<ICity | null> {
    const db = useDatabase('states');
    const query = db.prepare('SELECT * FROM cities WHERE uuid = ?');
    const city = await query.get(uuid) as ICity | undefined;

    if (!city) {
        return null;
    }

    return {
        uuid: city.uuid,
        created: city.created,
        updated: city.updated,
        name: city.name,
        coordinates: city.coordinates,
        state_uuid: city.state_uuid,
        is_capital: Boolean(city.is_capital)
    };
}

export async function getCitiesByStateUuid(stateUuid: string): Promise<ICity[]> {
    const db = useDatabase('states');
    const query = db.prepare('SELECT * FROM cities WHERE state_uuid = ?');
    const cities = await query.all(stateUuid) as ICity[];

    return cities.map(city => ({
        uuid: city.uuid,
        created: city.created,
        updated: city.updated,
        name: city.name,
        coordinates: city.coordinates,
        state_uuid: city.state_uuid,
        is_capital: Boolean(city.is_capital)
    }));
}

export async function updateCity(uuid: string, name?: string, coordinates?: string, stateUuid?: string, isCapital?: boolean): Promise<void> {
    const db = useDatabase('states');
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name) {
        updates.push('name = ?');
        params.push(name);
    }
    if (coordinates) {
        updates.push('coordinates = ?');
        params.push(coordinates);
    }
    if (stateUuid) {
        updates.push('state_uuid = ?');
        params.push(stateUuid);
    }
    if (isCapital !== undefined) {
        updates.push('is_capital = ?');
        params.push(isCapital ? 1 : 0);
    }

    if (updates.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No fields to update',
            data: { statusMessageRu: 'Нет полей для обновления' }
        });
    }

    params.push(uuid); // Add UUID at the end for the WHERE clause
    const updateQuery = `UPDATE cities SET ${updates.join(', ')} WHERE uuid = ?`;
    const updateStmt = db.prepare(updateQuery);
    
    const res = await updateStmt.run(...params);

    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update city',
            data: { statusMessageRu: 'Не удалось обновить город' }
        });
    }
}

export async function deleteCity(uuid: string): Promise<void> {
    const db = useDatabase('states');
    const del = db.prepare('DELETE FROM cities WHERE uuid = ?');
    const res = await del.run(uuid);

    if (!res.success) {
        throw createError({
            statusCode: 404,
            statusMessage: 'City not found',
            data: { statusMessageRu: 'Город не найден' }
        });
    }
}

export async function attachCityToState(cityUuid: string, stateUuid: string): Promise<void> {
    await getStateByUuid(stateUuid)

    const db = useDatabase('states')
    const update = db.prepare('UPDATE cities SET state_uuid = ? WHERE uuid = ?')
    const res = await update.run(stateUuid, cityUuid)

    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to attach city to state',
            data: { statusMessageRu: 'Не удалось прикрепить город к государству' }
        })
    }
}

export async function detachCityFromState(cityUuid: string): Promise<void> {
    const db = useDatabase('states');
    // проверяем что город не столица
    const isCapital = await isCityCapital(cityUuid);
    if (isCapital) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot detach capital city from state',
            data: { statusMessageRu: 'Невозможно открепить столицу от государства' }
        });
    }
    const update = db.prepare('UPDATE cities SET state_uuid = NULL WHERE uuid = ?');
    const res = await update.run(cityUuid);

    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to detach city from state',
            data: { statusMessageRu: 'Не удалось открепить город от государства' }
        });
    }
}

export async function isCityCapital(cityUuid: string): Promise<boolean> {
    const db = useDatabase('states');
    const query = db.prepare('SELECT is_capital FROM cities WHERE uuid = ?');
    const result = await query.get(cityUuid) as { is_capital: number } | undefined;

    if (!result) {
        throw createError({
            statusCode: 404,
            statusMessage: 'City not found',
            data: { statusMessageRu: 'Город не найден' }
        });
    }

    return !!result.is_capital;
}

export async function setCityAsCapital(cityUuid: string): Promise<void> {
    const db = useDatabase('states')
    const city = await getCityByUuid(cityUuid)

    if (!city || city.state_uuid === null) {
        throw createError({
            statusCode: 400,
            statusMessage: 'City has no state',
            data: { statusMessageRu: 'Город не принадлежит государству' }
        })
    }

    // Удаляем статус столицы у всех городов в этом государстве
    const reset = db.prepare('UPDATE cities SET is_capital = 0 WHERE state_uuid = (SELECT state_uuid FROM cities WHERE uuid = ?)')
    const resetRes = await reset.run(cityUuid)
    if (!resetRes.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to reset previous capital',
            data: { statusMessageRu: 'Не удалось сбросить предыдущую столицу' }
        });
    }
    // Устанавливаем новый статус столицы
    const update = db.prepare('UPDATE cities SET is_capital = 1 WHERE uuid = ?');
    const res = await update.run(cityUuid);
    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to set city as capital',
            data: { statusMessageRu: 'Не удалось установить город столицей' }
        });
    }
}

export async function attachPlayerToCity(playerUuid: string, cityUuid: string): Promise<void> {
    const db = useDatabase('states');
    //check if player is in the same state as the city
    const city = await getCityByUuid(cityUuid);
    if (!city) {
        throw createError({
            statusCode: 404,
            statusMessage: 'City not found',
            data: { statusMessageRu: 'Город не найден' }
        });
    }

    if (city.state_uuid === null) {
        throw createError({
            statusCode: 400,
            statusMessage: 'City has no state',
            data: { statusMessageRu: 'Город не принадлежит государству' }
        });
    } else {
        const query = db.prepare('SELECT state_uuid FROM state_members WHERE player_uuid = ?');
        const playerState = await query.get(playerUuid) as { state_uuid: string } | undefined;
        if (!playerState || playerState.state_uuid !== city.state_uuid) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Player is not in the same state as the city',
                data: { statusMessageRu: 'Игрок не находится в том же государстве, что и город' }
            });
        }
    }
    // Attach player to city
    const attach = db.prepare('UPDATE state_members SET city_uuid = ? WHERE player_uuid = ?');
    const res = await attach.run(cityUuid, playerUuid);
    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to attach player to city',
            data: { statusMessageRu: 'Не удалось прикрепить игрока к городу' }
        });
    }
}

export async function detachPlayerFromCity(playerUuid: string): Promise<void> {
    const db = useDatabase('states');
    // Detach player from city
    const detach = db.prepare('UPDATE state_members SET city_uuid = NULL WHERE player_uuid = ?');
    const res = await detach.run(playerUuid);
    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to detach player from city',
            data: { statusMessageRu: 'Не удалось открепить игрока от города' }
        });
    }
}

export async function listCities(startAt = 0, limit = 100): Promise<ICity[]> {
    const db = useDatabase('states');
    const stmt = db.prepare('SELECT * FROM cities ORDER BY created DESC LIMIT ? OFFSET ?');
    const rows = await stmt.all(limit, startAt) as ICity[];
    return rows.map(city => ({
        ...city,
        is_capital: Boolean(city.is_capital)
    }));
}

