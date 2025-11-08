const LS_KEY = "weapons";
let currentImageData = "";
let editingId = null;

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readLS() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeLS(arr) {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function renderPreview() {
    const el = document.getElementById("image-preview");
    el.innerHTML = "";
    if (currentImageData) {
        const img = document.createElement("img");
        img.src = currentImageData;
        el.appendChild(img);
    } else {
        const span = document.createElement("span");
        span.className = "muted";
        span.textContent = "Image preview";
        el.appendChild(span);
    }
}

function deleteWeapon(id) {
    const arr = readLS().filter(x => x.id !== id);
    writeLS(arr);
    if (editingId === id) clearForm();
    renderList();
}

function toCard(c) {
    const div = document.createElement("div");
    div.className = "card";
    if (c.imageData)  {
        const img = document.createElement("img");
        img.src = c.imageData;
        div.appendChild(img);
    }
    const h3 = document.createElement("h3");
    h3.textContent = c.name || "(no name)";
    const p = document.createElement("p");
    p.textContent = c.description || "";
    const row = document.createElement("div");
    row.className = "row";

    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.onclick = () => loadToForm(c.id);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteWeapon(c.id);

    const expBtn = document.createElement("button");
    expBtn.textContent = "Export";
    expBtn.onclick = () => exportJSON([c], `weapon-${c.id}.json`);

    row.append(loadBtn, delBtn, expBtn);
    div.append(h3, p, row);
    return div;
}

function renderList() {
    const wrap = document.getElementById("characters-list");
    wrap.innerHTML = "";
    readLS().forEach(c => wrap.appendChild(toCard(c)));
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

async function handleImageChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    currentImageData = await fileToDataURL(f);
    renderPreview();
}

function clearForm() {
    document.getElementById("character-form").reset();
    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    currentImageData = "";
    editingId = null;
    renderPreview();
}

function loadToForm(id) {
    const arr = readLS();
    const c = arr.find(x => x.id === id);
    if (!c) return;
    editingId = c.id;
    document.getElementById("name").value = c.name || "";
    document.getElementById("description").value = c.description || "";
    currentImageData = c.imageData || "";
    renderPreview();
}

function deleteWeapon(id) {
    const arr = readLS().filter(x => x.id !== id);
    writeLS(arr);
    if (editingId === id) clearForm();
    renderList();
}

function setup() {
    const form = document.getElementById("character-form");
    const image = document.getElementById("image");
    const clearBtn = document.getElementById("clear-form");
    const exportAll = document.getElementById("export-all");
const importJSON = document.getElementById("import-json");

    image.addEventListener("change", handleImageChange);
    clearBtn.addEventListener("click", clearForm);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const arr = readLS();

        if (editingId) {
            const idx = arr.findIndex(x => x.id === editingId);
            if (idx !== -1) {
                arr[idx] = { ...arr[idx], name, description, imageData: currentImageData };
            }
        } else {
            arr.push({ id: uid(), name, description, imageData: currentImageData, createdAt: Date.now() });
        }

        writeLS(arr);
        renderList();
        clearForm();
    });

    exportAll.addEventListener("click", () => {
    exportJSON(readLS(), "weapons.json");
    });

    importJSON.addEventListener("change", async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        try {
            const text = await f.text();
            const parsed = JSON.parse(text);
            const items = normalizeImported(parsed).filter(validChar);
            const merged = mergeWeapons(readLS(), items);
            writeLS(merged);
            renderList();
        } finally {
            importJSON.value = "";
        }
    });
    
    renderPreview();
    renderList();
}

document.addEventListener("DOMContentLoaded", setup);

function exportJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function normalizeImported(input) {
    if (Array.isArray(input)) return input;
    if (input && typeof input === "object") return [input];
    return[];
}

function validChar(obj) {
    return obj && ("name" in obj || "description" in obj || "imageData" in obj);
}

function mergeWeapons(existing, incoming) {
    const map = new Map(existing.map(x => [x.id, x]));
    incoming.forEach(it => {
        const id = it.id || uid();
        const next = {
            id,
            name: it.name || "",
            description: it.description || "",
            imageData: it.imageData || "",
            createdAt: it.createdAt || Date.now()
        };
        map.set(id,next);
    });
    return Array.from(map.values());
}
