import { Map } from 'immutable';
import types, {
    settingsInitFalse,
    toggleNotificationGroups,
} from 'app/components/elements/notification/type';

let YO = '/yo';
//let YO = 'https://yo.steemitdev.com';
//let YO = 'https://api.steemitdev.com';
let testMode = true;
const y = {
    local: () => {
        YO = '/yo';
    },
    yo: () => {
        YO = 'https://yo.steemitdev.com';
    },
    jussi: () => {
        YO = 'https://api.steemitdev.com\'';
    },
    testMode: (on) => {
        const enabled = (typeof on === 'undefined')? !testMode : !!on;
        console.log("setting notifications test mode to ", enabled)
        testMode = on;
    }
}

// Todo: for dev only! Do not merge if present!
if(typeof window !== 'undefined') {
    window.y = y;
}
/**
 * Re-formats API notifications response a little bit.
 *
 * @param {Array} res
 *
 * @return {Array}
 */
function normalize(res) {
    return res.map(n => {
        const resp = {
            ...n,
            id: n.notify_id.toString(),
            shown: n.shown,
            notificationType: n.notify_type,
        }
        if(resp.data.item && resp.data.item.parent_summary) {
            resp.data.item.parentSummary = resp.data.item.parent_summary;
            resp.data.item.parent_summary = undefined;
        }
        return resp;
    });
}

/**
 * Cleans up settings from Yo.
 *
 * If notification_types is null, assume we need to set defaults.
 *
 * @param {Object} transportsFromApi transports part of the payload from api
 * @return {Object}
 */
export function normalizeSettingsFromApi(transportsFromApi) {
    // For each of the transports coming through from the API,
    // If the API's notification_types is truthy,
    // Transform array of enabled types into a Map based on our type->group mapping config,
    // And assign it to our output Map.
    // If incoming settings is null, assign default types.
    return Object.keys(transportsFromApi).reduce((transports, transport) => {
        const typesFromApi = (transportsFromApi[transport].notification_types !== null)
            ? transportsFromApi[transport].notification_types
            : types.filter(t => { return settingsInitFalse.indexOf(t) === -1 });

        const groups = toggleNotificationGroups;

        return transports
            .setIn([transport, 'notification_types'], Object.keys(groups).reduce((acc, k) => {
                return acc.set(k, (typesFromApi.indexOf(groups[k][0]) > -1));
            }, Map()))
            .setIn([transport, 'sub_data'], transportsFromApi[transport].sub_data);
    }, Map());
}

export function denormalizeSettingsToApi(settings) {
    return settings.entrySeq().toJS().reduce((transports, transport) => {
        return {
            ...transports,
            [transport[0]]: {
                notification_types: transport[1].get('notification_types').reduce((transportTypes, enabled, type) => {
                    return enabled ? [...transportTypes, ...toggleNotificationGroups[type]] : transportTypes;
                }, []),
                sub_data: transport[1].get('sub_data'),
            },
        };
    }, {});
}

export function fetchAllNotifications(username) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.get_notifications',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                //username, // Todo: for dev only! Do not merge if present!
                username: 'test_user', // Todo: for dev only! Do not merge if present!
            },
        }),
    })
    .then(r => r.json()).then(res => {
        if (res.result && res.result.length > 0) {
            return normalize(res.result);
        }
        return []; // empty...?
    })
    .catch(error => {
        return { error };
    });
}

/**
 *
 * @param {String} username
 * @param {String} [before] created prior to timestamp, formatted like 2017-10-12T21:25:06.964364
 * @param {String} [after] modified after timestamp, formatted like 2017-10-12T21:25:06.964364
 * @param {String[]} types only these notification types
 *
 */
export function fetchSomeNotifications({ username, before, after, filterTypes }) { // Todo: filter by types once api allows for it
    const beforeOrAfterParams = {};
    if (after) beforeOrAfterParams.updated_after = after;
    if (before) beforeOrAfterParams.created_before = before;

    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.get_notifications',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                notify_types: filterTypes,
                //username, // Todo: for dev only! Do not merge if present!
                username: 'test_user', // Todo: for dev only! Do not merge if present!
                ...beforeOrAfterParams,
            },
        }),
    }).then(r => r.json()).then(res => {
        if (res.result && res.result.length > 0) {
            return normalize(res.result);
        }
        return [];
    })
    .catch(error => {
        return { error };
    });
}

export function markAsRead(ids) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.mark_read',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                ids: ids.map(id => parseInt(id, 10)),
            },
        }),
    }).then(r => r.json()).then(res => {
        if (res.result && res.result.length > 0) {
            return normalize(res.result);
        }
        return [];
    })
    .catch(error => {
        return { error };
    });
}

export function markAsUnread(ids) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.mark_unread',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                ids: ids.map(id => parseInt(id, 10)),
            },
        }),
    }).then(r => r.json()).then(res => {
        if (res.result && res.result.length > 0) {
            return normalize(res.result);
        }
        return [];
    })
    .catch(error => {
        return { error };
    });
}

export function markAsShown(ids) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.mark_shown',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                ids: ids.map(id => parseInt(id, 10)),
            },
        }),
    }).then(r => r.json()).then(res => {
        if (res.result && res.result.length > 0) {
            return normalize(res.result);
        }
        return [];
    })
    .catch(error => {
        return { error };
    });
}

/**
 *
 * @param {String} username
 * @return {Map|Object} if error, object w/ error prop
 */
export function getNotificationSettings(username) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.get_transports',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                username,
            },
        }),
    }).then(r => r.json()).then(res => {
        return normalizeSettingsFromApi(res.result);
    })
    .catch(error => {
        return { error };
    });
}

/**
 *
 * @param username
 * @returns {Promise.<TResult>}
 */
export function resetStatuses(username) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.reset_statuses',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                username
            },
        }),
    }).then(r => r.json()).then(res => {
        if (res) {
            console.log(res);
        }
    })
        .catch(error => {
            return { error };
        });
}

/**
 *
 * @param {String} username
 * @param {Object} settings
 * @return {Map|Object} if error, object w/ error prop
 */
export function saveNotificationSettings(username, settings) {
    return fetch(YO, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'yo.set_transports',
            params: {
                test: testMode, // Todo: for dev only! Do not merge if present!
                username,
                transports: denormalizeSettingsToApi(settings),
            },
        }),
    }).then(r => r.json()).then(res => {
        return normalizeSettingsFromApi(res.result);
    })
    .catch(error => {
        return { error };
    });
}
