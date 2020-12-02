// Import Modules
import { MausritterActor } from "./actor/actor.js";
import { MausritterActorSheet } from "./actor/actor-sheet.js";
import { MausritterHirelingSheet } from "./actor/hireling-sheet.js";
import { MausritterCreatureSheet } from "./actor/creature-sheet.js";

import { MausritterItem } from "./item/item.js";
import { MausritterItemSheet } from "./item/item-sheet.js";

import {
  registerSettings
} from "./settings.js";

Hooks.once('init', async function () {

  game.mausritter = {
    MausritterActor,
    MausritterItem,
    rollItemMacro,
    rollStatMacro
  };

  registerSettings();


  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d100",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = MausritterActor;
  CONFIG.Item.entityClass = MausritterItem;


  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("mausritter", MausritterActorSheet, {
    types: ['character'],
    makeDefault: true
  });
  Actors.registerSheet("mausritter", MausritterHirelingSheet, {
    types: ['hireling'],
    makeDefault: false
  });
  Actors.registerSheet("mausritter", MausritterCreatureSheet, {
    types: ['creature'],
    makeDefault: false
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mausritter", MausritterItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });


  /**
   * Set default values for new actors' tokens
   */
  Hooks.on("preCreateActor", (createData) => {
    if (createData.type == "character") {
      createData.token.vision = true;
      createData.token.actorLink = true;
    }
  })

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  // preloadHandlebarsTemplates();
});

// async function preloadHandlebarsTemplates() {
//   const templatePaths = [
//       "systems/mausritter/templates/item/item-card.html"
//   ];
//   return loadTemplates(templatePaths);
// }


Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createMausritterMacro(data, slot));
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMausritterMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  console.log(data);

  // Create the macro command
  let command = `game.mausritter.rollItemMacro("${item.name}");`;


  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: {
        "mausritter.itemMacro": true
      }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}


/**
 * Roll Macro from a Weapon.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  console.log();

  return actor.rollItem(item.id);
}


/**
 * Roll Stat.
 * @param {string} statName
 * @return {Promise}
 */
function rollStatMacro() {
  var selected = canvas.tokens.controlled;
  const speaker = ChatMessage.getSpeaker();

  if (selected.length == 0) {
    selected = game.actors.tokens[speaker.token];
  }

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
    const stat = actor ? Object.entries(actor.data.data.stats) : null;
  

  // if (stat == null) {
  //   ui.notifications.info("Stat not found on token");
  //   return;
  // }

  console.log(stat);

  return actor.rollStatSelect(stat);
}