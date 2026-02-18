document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const itemList = document.getElementById('itemList');
    const itemSearch = document.getElementById('itemSearch');
    const jsonOutput = document.getElementById('jsonOutput');

    // Grids
    const wearGrid = document.getElementById('wearGrid');
    const mainGrid = document.getElementById('mainGrid');
    const beltGrid = document.getElementById('beltGrid');

    // Kit Settings Inputs
    const kitNameInput = document.getElementById('kitName');
    const kitPermissionInput = document.getElementById('kitPermission');
    const kitImageInput = document.getElementById('kitImage');
    const kitCooldownInput = document.getElementById('kitCooldown');
    const kitMaxInput = document.getElementById('kitMax');

    // Buttons
    const btnCopy = document.getElementById('bCopy');
    const btnImport = document.getElementById('bImport');
    const btnClear = document.getElementById('bClear');

    // State
    let allItems = [];
    // Data structure to hold items in slots. Key: 'container-position', Value: Item Object
    let kitItems = {};

    // Initialize
    loadItems();
    initGrids();
    setupEventListeners();

    // -------------------------------------------------------------------------
    // Init Grids
    // -------------------------------------------------------------------------
    function initGrids() {
        createSlots(wearGrid, 7, 'wear');
        createSlots(mainGrid, 24, 'main');
        createSlots(beltGrid, 6, 'belt');
    }

    function createSlots(container, count, type) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.dataset.type = type;
            slot.dataset.position = i;

            // Drag Events
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
            slot.addEventListener('click', (e) => handleSlotClick(e, type, i));

            container.appendChild(slot);
        }
    }

    // -------------------------------------------------------------------------
    // Data Loading
    // -------------------------------------------------------------------------
    async function loadItems() {
        try {
            const response = await fetch('rust_items.json');
            allItems = await response.json();
            renderItems(allItems);
        } catch (error) {
            console.error('Veri yüklenemedi:', error);
            itemList.innerHTML = '<p style="color:red; text-align:center;">Eşya veritabanı yüklenemedi (rust_items.json).</p>';
        }
    }

    function renderItems(items) {
        itemList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        // Slice for performance if needed, but 500ish items is fine
        items.slice(0, 500).forEach(item => {
            const el = document.createElement('div');
            el.className = 'item-card';
            el.draggable = true;
            el.dataset.shortname = item.shortName;

            const iconPath = `icons/${item.shortName}.png`;
            el.innerHTML = `
                <img src="${iconPath}" alt="${item.displayName}" loading="lazy" onerror="this.src='https://rustlabs.com/img/items180/${item.shortName}.png'">
                <span>${item.displayName}</span>
            `;

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/shortname', item.shortName);
                e.dataTransfer.setData('text/origin', 'list');
            });
            fragment.appendChild(el);
        });
        itemList.appendChild(fragment);
    }

    // -------------------------------------------------------------------------
    // Drag & Drop
    // -------------------------------------------------------------------------
    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        const slot = e.currentTarget;
        slot.classList.remove('drag-over');

        const shortname = e.dataTransfer.getData('text/shortname');
        const origin = e.dataTransfer.getData('text/origin');

        // Find item data
        const itemDef = allItems.find(i => i.shortName === shortname);
        if (!itemDef) return;

        const type = slot.dataset.type;
        const pos = parseInt(slot.dataset.position);

        addItemToSlot(type, pos, itemDef);
    }

    function addItemToSlot(type, pos, itemDef, existingData = null) {
        // Default data structure matching the user's JSON requirement
        const newItem = existingData || {
            Shortname: itemDef.shortName,
            DisplayName: null,
            Skin: 0,
            Amount: 1,
            Condition: 0.0,
            MaxCondition: 0.0,
            Ammo: 0,
            Ammotype: null, // Should match ammo shortname if gun?
            Position: pos,
            Frequency: -1,
            BlueprintShortname: null,
            Text: null,
            Contents: null, // Attachments/contents?
            Container: null
        };

        // Special case for guns -> default ammo? 
        // For now keep simple, can be edited

        // Store
        kitItems[`${type}-${pos}`] = newItem;
        renderSlot(type, pos);
        updateJSON();
    }

    function renderSlot(type, pos) {
        // Find grid and slot element
        let grid;
        if (type === 'wear') grid = wearGrid;
        if (type === 'main') grid = mainGrid;
        if (type === 'belt') grid = beltGrid;

        const slot = grid.children[pos];
        const item = kitItems[`${type}-${pos}`];

        if (!item) {
            slot.innerHTML = '';
            slot.className = 'inv-slot';
            // potentially re-add placeholder number?
            return;
        }

        slot.className = 'inv-slot occupied';
        const iconPath = `icons/${item.Shortname}.png`;

        slot.innerHTML = `
            <img src="${iconPath}" class="slot-img" onerror="this.src='https://rustlabs.com/img/items180/${item.Shortname}.png'">
            <div class="slot-amount">${item.Amount > 1 ? 'x' + item.Amount : ''}</div>
        `;
    }

    // -------------------------------------------------------------------------
    // Interaction (Click to Edit/Remove)
    // -------------------------------------------------------------------------
    function handleSlotClick(e, type, pos) {
        const item = kitItems[`${type}-${pos}`];
        if (!item) return;

        // Simple prompt for now, could be a modal
        // Right click to remove? 
        // For now: Left click to edit amount/skin, Shift+Click to remove?

        if (e.shiftKey) {
            delete kitItems[`${type}-${pos}`];
            renderSlot(type, pos);
            updateJSON();
            return;
        }

        // Edit Amount
        const newAmt = prompt(`Miktar (${item.Shortname}):`, item.Amount);
        if (newAmt !== null) {
            item.Amount = parseInt(newAmt) || 1;
            renderSlot(type, pos);
            updateJSON();
        }

        // Edit Skin?
        // Maybe a context menu later.
    }

    // -------------------------------------------------------------------------
    // JSON Output
    // -------------------------------------------------------------------------
    function updateJSON() {
        // Format: { "KitName": { ... } }

        const mainItems = [];
        const wearItems = [];
        const beltItems = [];

        // Traverse our data
        Object.keys(kitItems).forEach(key => {
            const [type, posStr] = key.split('-');
            const pos = parseInt(posStr);
            const item = { ...kitItems[key] };
            item.Position = pos; // Ensure correct position

            if (type === 'main') mainItems.push(item);
            if (type === 'wear') wearItems.push(item);
            if (type === 'belt') beltItems.push(item);
        });

        // The user wants a specific wrapper structure? 
        // "Vip": { ... }

        const kitName = kitNameInput.value || "NewKit";

        const kitObj = {
            Name: kitName,
            Description: "", // User inputs?
            RequiredPermission: kitPermissionInput.value,
            MaximumUses: parseInt(kitMaxInput.value) || 0,
            RequiredAuth: 0,
            Cooldown: parseInt(kitCooldownInput.value) || 3600,
            Cost: 0,
            IsHidden: false,
            CopyPasteFile: "",
            KitImage: kitImageInput.value,
            MainItems: mainItems,
            WearItems: wearItems,
            BeltItems: beltItems
        };

        const wrapper = {};
        wrapper[kitName] = kitObj;

        jsonOutput.textContent = JSON.stringify(wrapper, null, 4);
    }

    // -------------------------------------------------------------------------
    // Utils
    // -------------------------------------------------------------------------
    function setupEventListeners() {
        itemSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allItems.filter(item =>
                item.displayName.toLowerCase().includes(term) ||
                item.shortName.toLowerCase().includes(term)
            );
            renderItems(filtered);
        });

        const inputs = [kitNameInput, kitPermissionInput, kitImageInput, kitCooldownInput, kitMaxInput];
        inputs.forEach(input => input.addEventListener('input', updateJSON));

        btnCopy.addEventListener('click', () => {
            const range = document.createRange();
            range.selectNode(jsonOutput);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            btnCopy.textContent = 'Kopyalandı!';
            setTimeout(() => btnCopy.textContent = 'JSON Kopyala', 2000);
        });

        btnClear.addEventListener('click', () => {
            if (confirm("Tüm envanter silinecek?")) {
                kitItems = {};
                initGrids();
                updateJSON();
            }
        });

        btnImport.addEventListener('click', importJSON);
    }

    function importJSON() {
        const input = prompt("JSON Yapıştırın:");
        if (!input) return;

        try {
            const parsed = JSON.parse(input);
            // Handle wrapper { "KitName": { ... } } or direct object
            const keys = Object.keys(parsed);
            const kitData = parsed[keys[0]].Name ? parsed[keys[0]] : parsed; // Simple heuristic

            kitNameInput.value = kitData.Name || keys[0];
            kitPermissionInput.value = kitData.RequiredPermission || "";
            kitImageInput.value = kitData.KitImage || "";
            kitCooldownInput.value = kitData.Cooldown || 0;
            kitMaxInput.value = kitData.MaximumUses || 0;

            kitItems = {};

            // Helper to populate
            const populate = (items, type) => {
                if (!items) return;
                items.forEach(item => {
                    const pos = item.Position !== undefined ? item.Position : 0; // fallback
                    // Ensure full object properties for output transparency
                    kitItems[`${type}-${pos}`] = item;
                });
            };

            populate(kitData.MainItems, 'main');
            populate(kitData.WearItems, 'wear');
            populate(kitData.BeltItems, 'belt');

            // Re-render grids
            initGrids(); // Clears DOM
            // Render occupied slots
            Object.keys(kitItems).forEach(key => {
                const [type, posStr] = key.split('-');
                renderSlot(type, parseInt(posStr));
            });

            updateJSON();

        } catch (e) {
            alert("JSON Hatası: " + e.message);
        }
    }
});
