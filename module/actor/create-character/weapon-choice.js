export async function showWeaponChoiceDialog(callback) {
    const template = 'systems/mausritter/templates/dialogs/weapon-choice.html';
    const html = await renderTemplate(template)
    const d = new Dialog({
        title: "What weapon do you want?",
        content: html,
        buttons: {
            ok: {
                icon: '<i class="fas fa-check"></i>',
                label: 'ok',
                callback: (html) => {
                    const selector = html[0].querySelector('select');
                    callback(selector.value)
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('Maus.Cancel'),
                callback: () => {
                }
            }
        },
        default: "ok",
        close: () => {
        }
    });
    d.render(true);
}