import {ICity} from "~/interfaces/state/city.types";


export async function createCity(name: string, coordinates: string, stateUuid: string, isCapital: boolean): Promise<void>;
export async function createCity(name: string, coordinates: string): Promise<void>;
export async function createCity(name: string, coordinates: string, stateUuid?: string, isCapital: boolean = false): Promise<void> {
    const db = useDatabase('states');
    const insert = db.prepare(`
        INSERT INTO cities (uuid, created, updated, name, coordinates, state_uuid, is_capital)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const res = await insert.run(name, coordinates, stateUuid || null, isCapital ? 1 : 0);

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

