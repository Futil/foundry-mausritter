

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MausritterCreatureSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["mausritter", "sheet", "actor", "creature"],
      template: "systems/mausritter/templates/actor/creature-sheet.html",
      width: 680,
      height: 620,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "character" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    // Prepare items.
    if (this.actor.data.type == 'creature') {
      this._prepareCharacterItems(data);
    }


    if (data.data.settings == null) {
      data.data.settings = {};
    }
    // data.data.settings.useCalm = game.settings.get("mausritter", "useCalm");
    // data.data.settings.hideWeight = game.settings.get("mausritter", "hideWeight");

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {

    const actorData = sheetData.actor;

    // Initialize containers.
    const gear = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      // We'll handle the pip html here.
      if (item.pips == null) {
        item.pips = {
          "value": 0,
          "max": 0,
          "html": ""
        };
      }
      let pipHtml = "";
      for (let i = 0; i < item.pips.max; i++) {
        if (i < item.pips.value)
          pipHtml += '<i class="fas fa-circle"></i>'
        else
          pipHtml += '<i class="far fa-circle"></i>';
      }
      item.pips.html = pipHtml;
      // End of the pip handler

      // Now we'll set tags
      if (i.type == "item") { item.isWeapon = false; item.isCondition = false; }
      else if (i.type == "weapon") {
        item.isWeapon = true;
        item.isCondition = false;

        if (item.weapon.dmg2 != "") {
          item.weapon.canSwap = true;
        } else {
          item.weapon.canSwap = false;
        }
      }

      if(item.size == undefined){
        item.size = {
          "width" : 1,
          "height" : 1,
          "x" : "9em",
          "y" : "9em"
        }
      }
      item.size.x = (item.size.width * 8 + item.size.width) + "em";
      item.size.y = (item.size.height * 8 + item.size.height) + "em";

      this.actor.updateEmbeddedEntity('OwnedItem', i);

      gear.push(i);
    }
    // Assign and return
    actorData.gear = gear;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-equip').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.data("itemId")))

      item.data.equipped = !item.data.equipped;
      this.actor.updateEmbeddedEntity('OwnedItem', item);
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });


    // Rollable Attributes
    html.find('.stat-roll').click(ev => {
      const div = $(ev.currentTarget);
      const statName = div.data("key");
      const attribute = this.actor.data.data.stats[statName];
      this.actor.rollStat(attribute);
    });

    // Rollable Item/Anything with a description that we want to click on.
    html.find('.item-roll').click(ev => {
      const li = ev.currentTarget.closest(".item");
      this.actor.rollItem(li.dataset.itemId, {
        event: ev
      });
    });

    // If we have an item input being adjusted from the character sheet.
    html.on('change', '.item-input', ev => {
      const li = ev.currentTarget.closest(".item");
      const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))
      const input = $(ev.currentTarget);

      item[input[0].name] = input[0].value;
      
      this.actor.updateEmbeddedEntity('OwnedItem', item);
    });

    html.on('mousedown', '.pip-button', ev => {
      const li = ev.currentTarget.closest(".item");
      const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))

      let amount = item.data.pips.value;

      if (event.button == 0) {
        if (amount < item.data.pips.max) {
          item.data.pips.value = Number(amount) + 1;
        }
      } else if (event.button == 2) {
        if (amount > 0) {
          item.data.pips.value = Number(amount) - 1;
        }
      }

      this.actor.updateEmbeddedEntity('OwnedItem', item);
    });


    html.on('mousedown', '.damage-swap', ev => {
      const li = ev.currentTarget.closest(".item");
      const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))

      let d1 = item.data.weapon.dmg1;
      let d2 = item.data.weapon.dmg2;

      item.data.weapon.dmg1 = d2;
      item.data.weapon.dmg2 = d1;
      this.actor.updateEmbeddedEntity('OwnedItem', item);

      console.log(item);
    });


    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);

      html.find('li.dropitem').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });

      // Item Card handler

      html.find('div.dragItems').each((i, dragItem) => {

        const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", dragItem.dataset.itemId))
        // let dragItem = document.querySelector("#" + container.dataset.itemId);
        var curIndex = 1; //The current zIndex

        if(item.data.sheet == undefined){
          item.data.sheet = {
            "active": false,
            "currentX": 0,
            "currentY": 0,
            "initialX": 0,
            "initialY": 0,
            "xOffset": 0,
            "yOffset": 0
          };
        }

        setTranslate(item.data.sheet.currentX, item.data.sheet.currentY, dragItem, true);
        dragItem.style.zIndex = "1";

        this.actor.updateEmbeddedEntity('OwnedItem', item);

        dragItem.addEventListener("mousedown", (e) => {
          curIndex++;
          dragItem.style.zIndex = curIndex;

          if (e.type === "touchstart") {
            item.data.sheet.initialX = e.touches[0].clientX - item.data.sheet.xOffset;
            item.data.sheet.initialY = e.touches[0].clientY - item.data.sheet.yOffset;
          } else {
            item.data.sheet.initialX = e.clientX - item.data.sheet.xOffset;
            item.data.sheet.initialY = e.clientY - item.data.sheet.yOffset;
          }

          if (e.target === dragItem) {
            item.data.sheet.active = true;
          }
        }, false);

        dragItem.addEventListener("mouseup", (e) => {
          item.data.sheet.initialX = item.data.sheet.currentX;
          item.data.sheet.initialY = item.data.sheet.currentY;
          setTranslate(item.data.sheet.initialX, item.data.sheet.initialY, dragItem, true);

          item.data.sheet.active = false;


          this.actor.updateEmbeddedEntity('OwnedItem', item);
          curIndex++;
          dragItem.parentElement.style.zIndex = curIndex;
        }, false);


        dragItem.addEventListener("mousemove", (e) => {
          if (item.data.sheet.active) {

            e.preventDefault();

            if (e.type === "touchmove") {
              item.data.sheet.currentX = e.touches[0].clientX - item.data.sheet.initialX;
              item.data.sheet.currentY = e.touches[0].clientY - item.data.sheet.initialY;
            } else {
              item.data.sheet.currentX = e.clientX - item.data.sheet.initialX;
              item.data.sheet.currentY = e.clientY - item.data.sheet.initialY;
            }

            item.data.sheet.xOffset = item.data.sheet.currentX;
            item.data.sheet.yOffset = item.data.sheet.currentY;

            setTranslate(item.data.sheet.currentX, item.data.sheet.currentY, dragItem);
          }
        }, false);

        function setTranslate(xPos, yPos, el, round = false) {
          
          if (round) {
            let roundScale = 5;
            xPos = Math.round(xPos / roundScale) * roundScale;
            yPos = Math.round(yPos / roundScale) * roundScale;
          }
          el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }
      });
    }


  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle creating a new Owned skill for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onSkillCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New Skill`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log(super.getData());

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label} to score under ${dataset.target}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }

  async _updateObject(event, formData) {
    const actor = this.object;
    const updateData = expandObject(formData);

    await actor.update(updateData, {
      diff: false
    });
  }



}
