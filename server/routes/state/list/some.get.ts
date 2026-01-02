import {listSomeStates} from "~/utils/states/state.utils";

defineRouteMeta({
    openAPI: {
        tags: ['state'],
        description: 'Get some states.',
        parameters: [],
        responses: {
            200: {
                description: 'Array of states',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { $ref: '#/components/schemas/IState' } }
                    }
                }
            }
        }
    }
})

export default defineEventHandler(async (event) => {
    return await listSomeStates(3)
})