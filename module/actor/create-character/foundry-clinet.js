export async function getItemFromFoundry(item_id) {
    return await Item.fromDropData({
        type: "Item",
        uuid: item_id
    });
}

export async function addItem(itemId, instant) {
    const item = await getItemFromFoundry(itemId);
    await instant.sheet._onDropItemCreate(item)
}

export function attrRoll() {
    return new Roll('3d6kh2').roll({async: false}).total;
}

export async function drawFromTable(tableName) {
    const listCompendium = await game.packs.filter(p => p.documentName === 'RollTable');
    const inside = await listCompendium.filter(p => p.metadata.label === 'Tables')[0].getDocuments();
    const table = await inside.filter(p => p.name === tableName)[0];

    if (!table) {
        ui.notifications.warn(`Table ${tableName} not found.`, {});
        return;
    }

    const buffer = await table.roll();

    return buffer.results[0].text;
}