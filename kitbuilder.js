document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const itemList = document.getElementById('itemList');
    const itemSearch = document.getElementById('itemSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const dropZone = document.getElementById('kitDropZone');
    const jsonOutput = document.getElementById('jsonOutput');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Kit Settings Inputs
    const kitNameInput = document.getElementById('kitName');
    const kitPermissionInput = document.getElementById('kitPermission');
    const kitImageInput = document.getElementById('kitImage');
    const kitCooldownInput = document.getElementById('kitCooldown');
    const kitMaxInput = document.getElementById('kitMax');
    // const kitDescriptionInput = document.getElementById('kitDescription'); // Optional

    // Buttons
    const btnCopy = document.getElementById('bCopy');
    const btnImport = document.getElementById('bImport');
    const btnClear = document.getElementById('bClear');

    // State
    let allItems = [];
    let currentTab = 'items'; // items, wear, belt
    let kitData = {
        name: '',
        permission: '',
        image: '',
        description: '',
        cooldown: 3600,
        max: 0,
        items: [],
        wear: [],
        belt: []
    };

    // Initialize
    loadItems();
    setupEventListeners();

    // -------------------------------------------------------------------------
    // Data Loading & Rendering
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

        // Limit rendering for performance if list is huge, simpler for now
        // Or render generic categories

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'item-card';
            el.draggable = true;
            el.dataset.shortname = item.shortName;
            el.dataset.name = item.displayName;
            el.dataset.id = item.id;

            // Icon handling: try local first
            // Note: In real app we might fallback to remote URL if local missing
            // For now assuming local icons copied from rust_icons
            const iconPath = `icons/${item.shortName}.png`;

            el.innerHTML = `
                <img src="${iconPath}" alt="${item.displayName}" loading="lazy" onerror="this.src='https://rustlabs.com/img/items180/${item.shortName}.png'">
                <span>${item.displayName}</span>
            `;

            el.addEventListener('dragstart', handleDragStart);
            el.addEventListener('click', () => addItemToKit(item)); // Click to add support

            fragment.appendChild(el);
        });

        itemList.appendChild(fragment);
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------
    function setupEventListeners() {
        // Search
        itemSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allItems.filter(item =>
                item.displayName.toLowerCase().includes(term) ||
                item.shortName.toLowerCase().includes(term)
            );
            renderItems(filtered);
        });

        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTab = btn.dataset.tab;
                renderKitContent();
            });
        });

        // Drop Zone
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', handleDrop);

        // Sidebar Categories (Simple implementation)
        // Ideally we need categories in JSON. If not, we can fuzzy match or skip.
        // For now, "All" is enough given the search bar is powerful.

        // Settings Inputs
        const inputs = [kitNameInput, kitPermissionInput, kitImageInput, kitCooldownInput, kitMaxInput];
        inputs.forEach(input => {
            input.addEventListener('input', updateKitDataFromInputs);
        });

        // Buttons
        btnCopy.addEventListener('click', copyJSON);
        btnClear.addEventListener('click', clearKit);
        btnImport.addEventListener('click', importJSON);
    }

    // -------------------------------------------------------------------------
    // Drag & Drop Logic
    // -------------------------------------------------------------------------
    function handleDragStart(e) {
        const shortname = e.currentTarget.dataset.shortname;
        e.dataTransfer.setData('text/plain', shortname);
    }

    function handleDrop(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const shortname = e.dataTransfer.getData('text/plain');

        const item = allItems.find(i => i.shortName === shortname);
        if (item) {
            addItemToKit(item);
        }
    }

    // -------------------------------------------------------------------------
    // Kit Management
    // -------------------------------------------------------------------------
    function addItemToKit(item) {
        const newItem = {
            shortname: item.shortName,
            displayName: item.displayName, // kept for UI, maybe not strict JSON
            amount: 1,
            skinid: 0,
            activeInfo: item // store full ref if needed
        };

        // Add to current active tab list
        kitData[currentTab].push(newItem);
        renderKitContent();
        updateJSON();
    }

    function removeItemFromKit(index) {
        kitData[currentTab].splice(index, 1);
        renderKitContent();
        updateJSON();
    }

    function updateItemProperty(index, prop, value) {
        kitData[currentTab][index][prop] = value;
        updateJSON();
    }

    function renderKitContent() {
        dropZone.innerHTML = '';
        const items = kitData[currentTab];

        if (items.length === 0) {
            dropZone.innerHTML = `
                <div class="empty-state">
                    <p>${currentTab.toUpperCase()} listesi boş. Eşya ekleyin.</p>
                </div>`;
            return;
        }

        items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'kit-item-row';

            const iconPath = `icons/${item.shortname}.png`;

            row.innerHTML = `
                <img src="${iconPath}" onerror="this.src='https://rustlabs.com/img/items180/${item.shortname}.png'">
                <div class="kit-item-info">
                    <span class="kit-item-name">${item.displayName || item.shortname}</span>
                    <span class="kit-item-shortname">${item.shortname}</span>
                </div>
                <div class="kit-item-controls">
                    <div class="control-group">
                        <label>Miktar</label>
                        <input type="number" value="${item.amount}" min="1" onchange="updateItemAmount(${index}, this.value)">
                    </div>
                    <div class="control-group">
                        <label>Skin ID</label>
                        <input type="number" value="${item.skinid || 0}" onchange="updateItemSkin(${index}, this.value)">
                    </div>
                     <div class="control-group">
                        <label>Custom Name</label>
                        <input type="text" placeholder="İsim..." value="${item.customName || ''}" onchange="updateItemName(${index}, this.value)" style="width:100px;">
                    </div>
                </div>
                <button class="btn-remove" onclick="removeKitItem(${index})">&times;</button>
            `;
            dropZone.appendChild(row);
        });
    }

    // Global scope wrappers for inline onclicks
    window.removeKitItem = (index) => removeItemFromKit(index);
    window.updateItemAmount = (index, val) => updateItemProperty(index, 'amount', parseInt(val));
    window.updateItemSkin = (index, val) => updateItemProperty(index, 'skinid', parseInt(val)); // Note: skinid might need to be ulong/string
    window.updateItemName = (index, val) => updateItemProperty(index, 'customName', val);

    // -------------------------------------------------------------------------
    // JSON Handling
    // -------------------------------------------------------------------------
    function updateKitDataFromInputs() {
        kitData.name = kitNameInput.value;
        kitData.permission = kitPermissionInput.value;
        kitData.image = kitImageInput.value;
        kitData.cooldown = parseInt(kitCooldownInput.value) || 0;
        kitData.max = parseInt(kitMaxInput.value) || 0;
        updateJSON();
    }

    function updateJSON() {
        // Construct the output object to match common Rust Kits plugins
        // Structure may vary, currently aiming for a generic standard

        const output = {
            name: kitData.name,
            image: kitData.image,
            description: kitData.description,
            permission: kitData.permission,
            cooldown: kitData.cooldown,
            max: kitData.max,
            items: kitData.items.map(cleanItem),
            wear: kitData.wear.map(cleanItem),
            belt: kitData.belt.map(cleanItem)
        };

        jsonOutput.textContent = JSON.stringify(output, null, 4);
    }

    function cleanItem(i) {
        // Return only relevant fields for JSON
        const obj = {
            shortname: i.shortname,
            amount: i.amount,
            skinid: i.skinid
        };
        if (i.customName) obj.name = i.customName;
        // Add ammo/mods if we implement that later
        return obj;
    }

    function copyJSON() {
        const range = document.createRange();
        range.selectNode(jsonOutput);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();

        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Kopyalandı!';
        setTimeout(() => btnCopy.textContent = originalText, 2000);
    }

    function clearKit() {
        if (confirm('Tüm kit içeriği silinecek?')) {
            kitData.items = [];
            kitData.wear = [];
            kitData.belt = [];
            renderKitContent();
            updateJSON();
        }
    }

    function importJSON() {
        const input = prompt('JSON yapıştırın:');
        if (!input) return;

        try {
            const data = JSON.parse(input);
            kitData.name = data.name || '';
            kitData.image = data.image || '';
            kitData.permission = data.permission || '';
            kitData.cooldown = data.cooldown || 0;
            kitData.max = data.max || 0;

            kitData.items = data.items || [];
            kitData.wear = data.wear || [];
            kitData.belt = data.belt || [];

            // Update Inputs
            kitNameInput.value = kitData.name;
            kitPermissionInput.value = kitData.permission;
            kitImageInput.value = kitData.image;
            kitCooldownInput.value = kitData.cooldown;
            kitMaxInput.value = kitData.max;

            renderKitContent();
            updateJSON();
        } catch (e) {
            alert('Geçersiz JSON formatı!');
        }
    }
});
