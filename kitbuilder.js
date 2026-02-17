document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const itemList = document.getElementById('itemList');
    const itemSearch = document.getElementById('itemSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const dropZone = document.getElementById('kitDropZone');
    const jsonOutput = document.getElementById('jsonOutput');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Kit Management Elements
    const kitSelector = document.getElementById('kitSelector');
    const btnNewKit = document.getElementById('btnNewKit');
    const btnCopyKit = document.getElementById('btnCopyKit');
    const btnRenameKit = document.getElementById('btnRenameKit');
    const btnDeleteKit = document.getElementById('btnDeleteKit');

    // Kit Settings Inputs
    const kitPermissionInput = document.getElementById('kitPermission');
    const kitImageInput = document.getElementById('kitImage');
    const kitCooldownInput = document.getElementById('kitCooldown');
    const kitMaxInput = document.getElementById('kitMax');
    const kitDescriptionInput = document.getElementById('kitDescription');

    // Buttons
    const btnCopy = document.getElementById('bCopy');
    const btnImport = document.getElementById('bImport');
    const btnClear = document.getElementById('bClear');

    // State
    let allItems = [];
    let currentTab = 'items'; // items, wear, belt
    let currentCategory = 'all';

    // Multi-Kit State
    let kits = {}; // Object to store all kits: { "kitName": { ...data... } }
    let currentKitName = null;

    // Categories sorted by the itemlist_full.json data
    const categories = {
        all: "All",
        Ammunition: "Ammunition",
        Attire: "Attire",
        Component: "Component",
        Construction: "Construction",
        Electrical: "Electrical",
        Food: "Food",
        Fun: "Fun",
        Items: "Items",
        Medical: "Medical",
        Misc: "Misc",
        Resources: "Resources",
        Tool: "Tool",
        Traps: "Traps",
        Weapon: "Weapon"
    };

    function getCategory(item) {
        if (!item || !item.category) return 'Misc';
        return item.category; // Strict usage of server-provided category
    }

    // Initialize
    async function init() {
        try {
            const response = await fetch('rust_items.json');
            const data = await response.json();

            allItems = data.map(item => {
                item.shortName = item.shortName || item.shortname || "";
                item.category = getCategory(item);
                return item;
            });

            // Load from LocalStorage
            loadFromLocalStorage();

            setupEventListeners();
            renderCategories();
            filterAndRenderItems();

            if (Object.keys(kits).length === 0) {
                createNewKit('default');
            } else {
                if (!currentKitName) currentKitName = Object.keys(kits)[0];
                switchKit(currentKitName);
            }
        } catch (error) {
            console.error('Veri yüklenemedi:', error);
            itemList.innerHTML = '<p style="color:red; text-align:center;">Veri yüklenemedi (rust_items.json).</p>';
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem('rust_kits_data', JSON.stringify({
            kits: kits,
            currentKitName: currentKitName
        }));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem('rust_kits_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                kits = data.kits || {};
                currentKitName = data.currentKitName || null;
            } catch (e) {
                console.error("LocalStorage load error", e);
            }
        }
    }

    function renderCategories() {
        categoryFilter.innerHTML = '';
        Object.keys(categories).forEach(key => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${key === currentCategory ? 'active' : ''}`;
            btn.dataset.category = key;
            btn.textContent = categories[key];
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = key;
                filterAndRenderItems();
            });
            categoryFilter.appendChild(btn);
        });
    }

    function filterAndRenderItems() {
        const term = itemSearch.value.toLowerCase();
        const filtered = allItems.filter(item => {
            const name = (item.displayName || "").toLowerCase();
            const sname = (item.shortName || "").toLowerCase();
            const matchesSearch = name.includes(term) || sname.includes(term);
            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            return matchesSearch && matchesCategory;
        });
        renderItems(filtered);
    }

    function getItemIcon(item) {
        const sname = item.shortName || item.shortname || "";
        const localPath = `icons/${sname}.png`;
        const dataUrl = item.iconUrl || "";
        const rustLabsUrl = `https://rustlabs.com/img/items180/${sname}.png`;
        return { localPath, dataUrl, rustLabsUrl };
    }

    function renderItems(items) {
        itemList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'item-card';
            el.draggable = true;
            el.dataset.shortname = item.shortName;
            el.dataset.name = item.displayName;

            const icon = getItemIcon(item);
            el.innerHTML = `
                <img src="${icon.localPath}" alt="${item.displayName}" loading="lazy" 
                    onerror="if(this.src.includes('icons/')) { this.src='${icon.dataUrl || icon.rustLabsUrl}'; } else if(!this.src.includes('rustlabs')) { this.src='${icon.rustLabsUrl}'; }">
                <span>${item.displayName}</span>
            `;

            el.addEventListener('dragstart', handleDragStart);
            el.addEventListener('click', () => addItemToKit(item));
            fragment.appendChild(el);
        });
        itemList.appendChild(fragment);
    }

    function renderKitContent() {
        dropZone.innerHTML = '';
        if (!currentKitName || !kits[currentKitName]) return;

        const items = kits[currentKitName][currentTab] || [];
        if (items.length === 0) {
            dropZone.innerHTML = `<div class="empty-state"><p>${currentTab.toUpperCase()} listesi boş.</p></div>`;
            return;
        }

        items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'kit-item-row';
            const icon = getItemIcon(item);
            row.innerHTML = `
                <img src="${icon.localPath}" onerror="if(this.src.includes('icons/')) { this.src='${icon.dataUrl || icon.rustLabsUrl}'; } else if(!this.src.includes('rustlabs')) { this.src='${icon.rustLabsUrl}'; }">
                <div class="kit-item-info">
                    <span class="kit-item-name">${item.customName || item.displayName || item.shortname}</span>
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

    function setupEventListeners() {
        itemSearch.addEventListener('input', filterAndRenderItems);
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTab = btn.dataset.tab;
                renderKitContent();
            });
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', handleDrop);

        const inputs = [kitPermissionInput, kitImageInput, kitCooldownInput, kitMaxInput, kitDescriptionInput];
        inputs.forEach(input => {
            if (input) input.addEventListener('input', updateCurrentKitDataFromInputs);
        });

        kitSelector.addEventListener('change', (e) => switchKit(e.target.value));
        btnNewKit.addEventListener('click', promptNewKit);
        btnCopyKit.addEventListener('click', promptCopyKit);
        btnRenameKit.addEventListener('click', promptRenameKit);
        btnDeleteKit.addEventListener('click', deleteCurrentKit);

        btnCopy.addEventListener('click', copyJSON);
        btnClear.addEventListener('click', clearCurrentKit);
        btnImport.addEventListener('click', importJSON);
    }

    function createNewKit(name, data = null) {
        if (kits[name]) { alert('Bu isimde bir kit zaten var!'); return false; }
        kits[name] = data || {
            name: name, permission: `kits.${name}`, image: '', description: '',
            cooldown: 0, max: 0, items: [], wear: [], belt: []
        };
        updateKitSelector();
        switchKit(name);
        saveToLocalStorage();
        return true;
    }

    function switchKit(name) {
        if (!kits[name]) return;
        currentKitName = name;
        kitSelector.value = name;
        const kit = kits[name];
        if (kitPermissionInput) kitPermissionInput.value = kit.permission || '';
        if (kitImageInput) kitImageInput.value = kit.image || '';
        if (kitCooldownInput) kitCooldownInput.value = kit.cooldown || 0;
        if (kitMaxInput) kitMaxInput.value = kit.max || 0;
        if (kitDescriptionInput) kitDescriptionInput.value = kit.description || '';
        renderKitContent();
        updateJSON();
        saveToLocalStorage();
    }

    function updateKitSelector() {
        kitSelector.innerHTML = '';
        Object.keys(kits).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            kitSelector.appendChild(option);
        });
        if (currentKitName) kitSelector.value = currentKitName;
    }

    function deleteCurrentKit() {
        if (Object.keys(kits).length <= 1) { alert('En az bir kit kalmalı!'); return; }
        if (confirm(`"${currentKitName}" kitini silmek istediğinize emin misiniz?`)) {
            delete kits[currentKitName];
            switchKit(Object.keys(kits)[0]);
            updateKitSelector();
            saveToLocalStorage();
        }
    }

    function promptRenameKit() {
        const newName = prompt('Yeni isim:', currentKitName);
        if (newName && newName !== currentKitName) {
            if (kits[newName]) { alert('Bu isim zaten kullanılıyor.'); return; }
            kits[newName] = kits[currentKitName];
            kits[newName].name = newName;
            delete kits[currentKitName];
            currentKitName = newName;
            updateKitSelector();
            switchKit(newName);
            saveToLocalStorage();
        }
    }

    function promptCopyKit() {
        const newName = prompt('Kopyalanacak yeni kit adı:', `${currentKitName}_copy`);
        if (newName) {
            const copyData = JSON.parse(JSON.stringify(kits[currentKitName]));
            copyData.name = newName;
            createNewKit(newName, copyData);
        }
    }

    function promptNewKit() {
        const name = prompt('Yeni kit adı:');
        if (name) createNewKit(name);
    }

    function handleDragStart(e) { e.dataTransfer.setData('text/plain', e.currentTarget.dataset.shortname); }
    function handleDrop(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const shortname = e.dataTransfer.getData('text/plain');
        const item = allItems.find(i => i.shortName === shortname);
        if (item) addItemToKit(item);
    }

    function addItemToKit(item) {
        if (!currentKitName) return;
        const newItem = {
            shortname: item.shortName,
            displayName: item.displayName,
            amount: 1,
            skinid: 0,
            iconUrl: item.iconUrl || ""
        };
        kits[currentKitName][currentTab].push(newItem);
        renderKitContent();
        updateJSON();
        saveToLocalStorage();
    }

    window.removeKitItem = (index) => { if (!currentKitName) return; kits[currentKitName][currentTab].splice(index, 1); renderKitContent(); updateJSON(); saveToLocalStorage(); };
    window.updateItemAmount = (index, val) => { if (!currentKitName) return; kits[currentKitName][currentTab][index].amount = parseInt(val) || 1; updateJSON(); saveToLocalStorage(); };
    window.updateItemSkin = (index, val) => { if (!currentKitName) return; kits[currentKitName][currentTab][index].skinid = parseInt(val) || 0; updateJSON(); saveToLocalStorage(); };
    window.updateItemName = (index, val) => { if (!currentKitName) return; kits[currentKitName][currentTab][index].customName = val; updateJSON(); saveToLocalStorage(); };

    function updateCurrentKitDataFromInputs() {
        if (!currentKitName) return;
        const kit = kits[currentKitName];
        kit.permission = kitPermissionInput.value;
        kit.image = kitImageInput.value;
        kit.description = kitDescriptionInput.value;
        kit.cooldown = parseInt(kitCooldownInput.value) || 0;
        kit.max = parseInt(kitMaxInput.value) || 0;
        updateJSON();
        saveToLocalStorage();
    }

    function updateJSON() {
        const output = {};
        Object.keys(kits).forEach(key => {
            const k = kits[key];
            output[key] = {
                name: k.name, image: k.image, description: k.description,
                permission: k.permission, cooldown: k.cooldown, max: k.max,
                items: k.items.map(cleanItem), wear: k.wear.map(cleanItem), belt: k.belt.map(cleanItem)
            };
        });
        jsonOutput.textContent = JSON.stringify(output, null, 4);
    }

    function cleanItem(i) {
        const obj = { shortname: i.shortname, amount: i.amount, skinid: i.skinid };
        if (i.customName) obj.name = i.customName;
        return obj;
    }

    function copyJSON() {
        const range = document.createRange();
        range.selectNode(jsonOutput);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Kopyalandı!';
        setTimeout(() => btnCopy.textContent = originalText, 2000);
    }

    function clearCurrentKit() {
        if (!currentKitName) return;
        if (confirm(`"${currentKitName}" temizlensin mi?`)) {
            kits[currentKitName].items = []; kits[currentKitName].wear = []; kits[currentKitName].belt = [];
            renderKitContent(); updateJSON(); saveToLocalStorage();
        }
    }

    const fileInput = document.getElementById('fileInput');
    function importJSON() { fileInput.click(); }
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { processImportedData(event.target.result); fileInput.value = ''; };
        reader.readAsText(file);
    });

    function processImportedData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            let sourceKits = data._kits || data;
            let newKits = {};

            Object.keys(sourceKits).forEach(key => {
                const k = sourceKits[key];
                if (typeof k !== 'object') return;
                newKits[key] = {
                    name: k.Name || k.name || key,
                    image: k.KitImage || k.image || '',
                    description: k.Description || k.description || '',
                    permission: k.RequiredPermission || k.permission || '',
                    cooldown: k.Cooldown || k.cooldown || 0,
                    max: k.MaximumUses || k.max || 0,
                    items: (k.MainItems || k.items || []).map(mapItem),
                    wear: (k.WearItems || k.wear || []).map(mapItem),
                    belt: (k.BeltItems || k.belt || []).map(mapItem)
                };
            });

            if (Object.keys(newKits).length === 0) throw new Error("No kits found");

            kits = newKits;
            updateKitSelector();
            switchKit(Object.keys(kits)[0]);
            saveToLocalStorage();
            alert(`${Object.keys(kits).length} kit yüklendi.`);
        } catch (e) { alert('JSON hatası: ' + e.message); }
    }

    function mapItem(i) {
        return {
            shortname: i.Shortname || i.shortname || '',
            amount: i.Amount || i.amount || 1,
            skinid: i.Skin || i.skinid || 0,
            customName: i.DisplayName || i.name || '',
            iconUrl: i.iconUrl || ""
        };
    }

    init();
});
