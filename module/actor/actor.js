/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MausritterActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this;
    const data = actorData.system;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    else if (actorData.type === 'hireling') this._prepareCharacterData(actorData);
    else if (actorData.type === 'creature') this._prepareCharacterData(actorData);

  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.system;

    // let armorBonus = 0;
    // const armors = this.getEmbeddedCollection("Item").filter(e => "armor" === e.type);

    // for (let armor of armors) {
    //   if (armor.data.equipped) {
    //     armorBonus += armor.data.bonus;
    //   }
    // }
    // data.stats.armor.mod = armorBonus;
  }


  rollStatSelect(statList) {

    let selectList = "";

    statList.forEach(stat => selectList += "<option value='" + stat[0] + "'>" + game.i18n.localize('Maus.'+stat[1].label) + "</option>")

    let d = new Dialog({
      title: game.i18n.localize('Maus.RollSelectType'),
      content: "<h2>" + game.i18n.localize('Maus.RollSelectStat') + "</h2> <select style='margin-bottom:10px;'name='stat' id='stat'> " + selectList + "</select> <br/>",
      buttons: {
        roll: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('Maus.Roll'),
          callback: (html) => this.rollStat(this.system.stats[html.find('[id=\"stat\"]')[0].value])
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('Maus.Cancel'),
          callback: () => { }
        }
      },
      default: "roll",
      close: () => { }
    });
    d.render(true);
  }

  rollStat(attribute) {

    let attLabel = attribute.label?.charAt(0).toUpperCase() + attribute.label?.toLowerCase().slice(1);
    if (!attribute.label && isNaN(attLabel))
      attLabel = attribute.charAt(0)?.toUpperCase() + attribute.toLowerCase().slice(1);

    //this.rollAttribute(attribute, "none");

    let d = new Dialog({
      title: game.i18n.localize('Maus.RollSelectType'),
      content: "<h2> "+game.i18n.localize('Maus.RollAdvantageDisadvantage')+ "</h2> <select style='margin-bottom:10px;'name='advantage' id='advantage'> <option value='none'>"+game.i18n.localize('Maus.RollNone')+"</option> <option value='advantage'>"+game.i18n.localize('Maus.RollAdvantageDisadvantage')+"</option></select> <br/>",
      buttons: {
        roll: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('Maus.Roll'),
          callback: (html) => this.rollAttribute(attribute, html.find('[id=\"advantage\"]')[0].value)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('Maus.Cancel'),
          callback: () => { }
        }
      },
      default: "roll",
      close: () => { }
    });
    d.render(true);
  }

  rollItem(itemId, options = { event: null }) {
    let item = duplicate(this.getEmbeddedDocument("Item", itemId));

    if(item.type == "weapon"){
            //Select the stat of the roll.
      let t = new Dialog({
        title: game.i18n.localize('Maus.RollSelectStat'),
        content: "<h2> "+game.i18n.localize('Maus.RollEnhanced')+"/"+game.i18n.localize('Maus.RollImpaired')+" </h2> <select style='margin-bottom:10px;'name='enhanced' id='enhanced'>\
        <option value='normal'>"+game.i18n.localize('Maus.RollNormal')+"</option>\
        <option value='enhanced'>"+game.i18n.localize('Maus.RollEnhanced')+"</option>\
        <option value='impaired'>"+game.i18n.localize('Maus.RollImpaired')+"</option></select> <br/>",
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('Maus.Roll'),
            callback: (html) => this.rollWeapon(item, html.find('[id=\"enhanced\"]')[0].value)
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('Maus.Cancel'),
            callback: () => { }
          }
        },
        default: "roll",
        close: () => { }
      });
      t.render(true);
      
      // if(item.system.weapon.selected == 0)
      //   this.rollWeapon(item, item.system.weapon.dmg1);
      // else
      // this.rollWeapon(item, item.system.weapon.dmg2);
    } else if(item.type=="spell"){
      //Select the stat of the roll.
      let t = new Dialog({
        title: "Select Stat",
        content: "<h2> "+game.i18n.localize('Maus.RollPowerDesc')+" </h2> <input style='margin-bottom:10px;' name='power' id='power' value='1'></input><br/>",
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('Maus.Roll'),
            callback: (html) => this.rollSpell(item, html.find('[id=\"power\"]')[0].value)
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('Maus.Cancel'),
            callback: () => { }
          }
        },
        default: "roll",
        close: () => { }
      });
      t.render(true);
    }
    else {
      this.chatDesc(item);
    }
  }

  rollWeapon(item = "", state = ""){
    let die = (item.system.weapon.selected == 0 ? item.system.weapon.dmg1 : item.system.weapon.dmg2)
    
    if(state == "impaired")
      die = 'd4';
    if(state == "enhanced")
      die = 'd12';
      
  //   this.rollWeapon(item, item.system.weapon.dmg1);
  // else
  // this.rollWeapon(item, item.system.weapon.dmg2);

    let damageRoll = new Roll(die);
    damageRoll.evaluate({async: false});
    //damageRoll.roll();

    const diceData = this.formatDice(damageRoll);

    //Create the pip HTML.
    let pipHtml = "<div style='margin-top: 5px;'>";
    for (let i = 0; i < item.system.pips.max; i++) {
      if (i < item.system.pips.value)
        pipHtml += '<i class="fas fa-circle">&nbsp;</i>'
      else
        pipHtml += '<i class="far fa-circle">&nbsp;</i>';
    }
    pipHtml += "</div>";

    var templateData = {
      actor: this,
      data: {
        diceTotal: {
          damageValue: damageRoll._total,
          damageRoll: damageRoll
        },
      },
      item: item,
      pip: pipHtml,
      rollTitle: game.i18n.localize('Maus.RollDamage'), //The title of the roll.
      rollText: damageRoll._total, //What is printed within the roll amount.
      damageDice: die,
      weaponState: game.i18n.localize('Maus.Roll' + state.charAt(0).toUpperCase() + state.slice(1)), 
      isWeapon: true,
      diceData
    };

    let chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name
      }
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

    let template = 'systems/mausritter/templates/chat/statroll.html';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      if (game.dice3d) {
        game.dice3d.showForRoll(damageRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));

      } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
      }
    });

  }

  rollSpell(item = "", power = ""){
    let die = power+"d6";

    let damageRoll = new Roll(die);
    damageRoll.evaluate({async: false});

    const diceData = this.formatDice(damageRoll);

    let rollDiv = '';

    let usage = 0;
    let miscast = 0;

    for(let i=0; i < parseInt(power); i++){
      if(i > 0)
      rollDiv += ', ' + diceData.dice[i].result;
      else
      rollDiv += '' + diceData.dice[i].result;

      if(diceData.dice[i].result >= 4){
        usage++;
        if(diceData.dice[i].result == 6){
          miscast++;
        }
      }
    }

    if(item.system.description == null){
      item.system.description = "";
    }
  
    item.system.description = item.system.description.split(game.i18n.localize('Maus.RollDiceKeyword')).join("<strong style='text-decoration:underline' class='red'>"+power+"</strong>");
    item.system.description = item.system.description.split(game.i18n.localize('Maus.RollSumKeyword')).join("<strong style='text-decoration:underline' class='red'>"+damageRoll._total+"</strong>");
    item.system.description += "<h2>"+game.i18n.localize('Maus.RollUsage')+": <strong>"+usage+"</strong></h2>";
    if(miscast){
      let miscastDesc = game.i18n.localize('Maus.RollMiscastDesc');
      miscastDesc = miscastDesc.replace("!miscast!", ""+miscast);
      item.system.description += "<h2>"+game.i18n.localize('Maus.RollMiscast')+": <strong>"+miscast+"</strong> </h2>" + miscastDesc;
    }

    //Create the pip HTML.
    let pipHtml = "<div style='margin-top: 5px;'>";
    for (let i = 0; i < item.system.pips.max; i++) {
      if (i < item.system.pips.value)
        pipHtml += '<i class="fas fa-circle">&nbsp;</i>'
      else
        pipHtml += '<i class="far fa-circle">&nbsp;</i>';
    }
    pipHtml += "</div>";

    var templateData = {
      actor: this,
      data: {
        diceTotal: {
          damageValue: damageRoll._total,
          damageRoll: damageRoll
        },
        rollDiv:rollDiv
      },
      item: item,
      pip: pipHtml,
      isSpell: true,
      isWeapon:true,
      rollTitle: game.i18n.localize('Maus.RollSum')+"|"+game.i18n.localize('Maus.RollDice'), //The title of the roll.
      rollText: damageRoll._total+'|'+power, //What is printed within the roll amount.
      sum: damageRoll._total,
      dice: power,
      diceData
    };

    let chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name
      }
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

    let template = 'systems/mausritter/templates/chat/statroll.html';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      if (game.dice3d) {
        game.dice3d.showForRoll(damageRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));

      } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
      }
    });

  }

  rollAttribute(attribute, advantage, item = "", rollOver = false) {
    let attributeName = attribute.label?.charAt(0).toUpperCase() + attribute.label?.toLowerCase().slice(1);
    if (!attribute.label && isNaN(attributeName))
      attributeName = attribute.charAt(0)?.toUpperCase() + attribute.toLowerCase().slice(1);

    // Roll
    let diceformular = "1d20";


    let r = new Roll(diceformular, {});
    r.evaluate({async: false});

    let rSplit = ("" + r._total).split("");

    //Advantage roll
    let a = new Roll(diceformular, {});
    a.evaluate({async: false});

    let damageRoll = 0;
    if (item.type == "weapon") {
      damageRoll = new Roll(item.system.damage);
      damageRoll.evaluate({async: false});

    }

    // Format Dice
    const diceData = this.formatDice(r);

    let mod = 0;
    if (attribute.mod > 0) mod = attribute.mod;

    let targetValue = attribute.value + mod + (item == "" ? 0 : item.system.bonus);

    //Here's where we handle the result text.
    let resultText = "";

    if (rollOver == true) {
        resultText = (r._total >= targetValue ? game.i18n.localize('Maus.RollSuccess') : game.i18n.localize('Maus.RollFailure'));
    } else {
        resultText = (r._total <= targetValue ? game.i18n.localize('Maus.RollSuccess') : game.i18n.localize('Maus.RollFailure'));
    }

    var templateData = {
      actor: this,
      stat: {
        name: game.i18n.localize('Maus.'+attributeName).toUpperCase()
      },
      data: {
        diceTotal: {
          value: r._total,
          advantageValue: a._total,
          damageValue: damageRoll._total,
          damageRoll: damageRoll
        },
        resultText: {
          value: resultText
        },
        isCreature: {
          value: this.data.type == "hireling" ? true : false
        }
      },
      target: attribute.value,
      mod: mod,
      item: item,
      targetValue: targetValue,
      useSkill: item.type == "skill" ? true : false,
      isWeapon: item.type == "weapon" ? true : false,
      advantage: advantage == "advantage" ? true : false,
      diceData
    };

    let chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name
      }
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

    /*
            if (this.data.type == "hireling") {
                chatData.whisper = game.user._id;
            }
    */
    let template = 'systems/mausritter/templates/chat/statroll.html';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      if (game.dice3d) {
        game.dice3d.showForRoll(r, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));

      } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
      }
    });
  }

  formatDice(diceRoll) {
    let diceData = { dice: [] };

    if (diceRoll != null) {
      let pushDice = (diceData, total, faces, color) => {
        let img = null;
        if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
          img = `../icons/svg/d${faces}-grey.svg`;
        }
        diceData.dice.push({
          img: img,
          result: total,
          dice: true,
          color: color
        });
      };

      for (let i = 0; i < diceRoll.terms.length; i++) {
        if (diceRoll.terms[i] instanceof Die) {
          let pool = diceRoll.terms[i].results;
          let faces = diceRoll.terms[i].faces;

          pool.forEach((pooldie) => {
            if (pooldie.discarded) {
              pushDice(diceData, pooldie.result, faces, "#777");
            } else {
              pushDice(diceData, pooldie.result, faces, "white");
            }

          });
        } else if (typeof diceRoll.terms[i] == 'string') {
          const parsed = parseInt(diceRoll.terms[i]);
          if (!isNaN(parsed)) {
            diceData.dice.push({
              img: null,
              result: parsed,
              dice: false,
              color: 'white'
            });
          } else {
            diceData.dice.push({
              img: null,
              result: diceRoll.terms[i],
              dice: false
            });
          }
        }
        else if (typeof diceRoll.terms[i] == 'number') {
          const parsed = parseInt(diceRoll.terms[i]);
          if (!isNaN(parsed)) {
            diceData.dice.push({
              img: null,
              result: parsed,
              dice: false,
              color: 'white'
            });
          } else {
            diceData.dice.push({
              img: null,
              result: diceRoll.terms[i],
              dice: false
            });
          }
        }
      }
    }

    return diceData;
  }

  // Print the item description into the chat.
  chatDesc(item) {
    let itemName = item.name?.charAt(0).toUpperCase() + item.name?.toLowerCase().slice(1);
    if (!item.name && isNaN(itemName))
      itemName = item.charAt(0)?.toUpperCase() + item.toLowerCase().slice(1);

    //Create the pip HTML.
    let pipHtml = "<div style='margin-top: 5px;'>";
    for (let i = 0; i < item.system.pips.max; i++) {
      if (i < item.system.pips.value)
        pipHtml += '<i class="fas fa-circle">&nbsp;</i>'
      else
        pipHtml += '<i class="far fa-circle">&nbsp;</i>';
    }
    pipHtml += "</div>";

    if(item.system.description == null){
      item.system.description = "";
    } else if(item.system.description.length > 0){
      item.system.description += "<br/>";
    }
    if(item.type == "condition"){
      item.system.description += item.system.desc+"<br/><strong>Clear: </strong>"+item.system.clear;
    }

    var templateData = {
      actor: this,
      stat: {
        name: itemName.toUpperCase()
      },
      item: item,
      pip: pipHtml,
      onlyDesc: true
    };

    let chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name
      }
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

    /*
            if (this.data.type == "hireling") {
                chatData.whisper = game.user._id;
            }
    */
    let template = 'systems/mausritter/templates/chat/statroll.html';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;

      ChatMessage.create(chatData);
    });
  }

}