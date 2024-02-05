// Import Modules
import { MausritterActor } from "./actor/actor.js";
import { MausritterActorSheet } from "./actor/actor-sheet.js";
import { MausritterHirelingSheet } from "./actor/hireling-sheet.js";
import { MausritterCreatureSheet } from "./actor/creature-sheet.js";
import { MausritterStorageSheet } from "./actor/storage-sheet.js";

import { MausritterItem } from "./item/item.js";
import { MausritterItemSheet } from "./item/item-sheet.js";

import {
  registerSettings
} from "./settings.js";
import {autoCreateCharacter} from "./actor/create-character/create-character.js";

Hooks.once('init', async function () {

  game.mausritter = {
    MausritterActor,
    MausritterItem,
    rollItemMacro,
    rollStatMacro,
    autoCreateCharacter
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
  CONFIG.Actor.documentClass = MausritterActor;
  CONFIG.Item.documentClass = MausritterItem;
 
  // Define table data for character generator
  CONFIG.MAUSRITTER = {}

  CONFIG.MAUSRITTER.tables = {
    tables: "Tables",
    birthsign: "Birthsign",
    physicalDetail: "Physical detail",
    coatPattern: "Mousy Coat Pattern",
    coatColor: "Mousy Coat Color",
    firstName: "Mousy Names - Birthname",
    lastName: "Mousy Names - Matriname"
  }
  
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
  Actors.registerSheet("mausritter", MausritterStorageSheet, {
    types: ['storage'],
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

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  CONFIG.Combat.initiative = {
    formula: "-1d20+@stats.dexterity.value",
    decimals: 2
  };

  // preloadHandlebarsTemplates();
});

/**
 * Set default values for new actors' tokens
 */
 Hooks.on("preCreateActor", (document, createData, options, userId) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;

  if (createData.type == "creature") {
    disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE
  }

  // Set wounds, advantage, and display name visibility
  mergeObject(createData,
    {
      "token.bar1": { "attribute": "health" },        // Default Bar 1 to Health 
      "token.bar2": { "stat": "strength" },      // Default Bar 2 to Insanity
      "token.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,     // Default display name to be on owner hover
      "token.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,     // Default display bars to be on owner hover
      "token.disposition": disposition,                               // Default disposition to neutral
      "token.name": createData.name                                   // Set token name to actor name
    })


  if (createData.type == "character") {
    createData.token.vision = true;
    createData.token.actorLink = true;
  }
})

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
  const stat = actor ? Object.entries(actor.system.stats) : null;


  // if (stat == null) {
  //   ui.notifications.info("Stat not found on token");
  //   return;
  // }


  return actor.rollStatSelect(stat);
}