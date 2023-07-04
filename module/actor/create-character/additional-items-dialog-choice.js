export async function showAdditionalItemsChoiceDialog(items, callback) {
    const template = 'systems/mausritter/templates/dialogs/additional-item-choice.html';
    const html = await renderTemplate(template, {items: items})
    const d = new Dialog({
        title: "Additional starting items",
        content: html,
        buttons: {
            ok: {
                icon: '<i class="fas fa-check"></i>',
                label: 'ok',
                callback: (html) => {
                    const selector = html[0].querySelector('select');
                    callback(selector.selectedIndex)
                }
            }
        },
        default: "ok",
        close: () => {
        }
    });
    d.render(true);
}