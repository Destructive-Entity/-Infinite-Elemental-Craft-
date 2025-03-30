/*
 * Infinite Elemental Craft Enhanced
 * Based on the concept of elemental combination games.
 * Features: Dynamic combinations, emojis, search, reset, persistence, clear elements.
 * All code is completely written by destructive-entity (github). JS enhancements by destructive-entity (github).
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const palette = document.getElementById('palette');
    const workspace = document.getElementById('workspace');
    const messageArea = document.getElementById('message-area');
    const elementCountSpan = document.getElementById('element-count');
    const searchInput = document.getElementById('search-bar');
    const resetButton = document.getElementById('reset-button');
    const attributionFooter = document.getElementById('attribution');

    // --- Core Data Definitions ---

    const BASE_ELEMENTS = ['Water', 'Fire', 'Earth', 'Air'];

    // **IMPORTANT: Initial definitions used for default state & reset**
    const initialElementDataDefinition = new Map([
        // Base Elements
        ['Water', { emoji: '💧', tags: ['liquid', 'wet', 'cold', 'flow', 'natural', 'base'] }],
        ['Fire',  { emoji: '🔥', tags: ['hot', 'energy', 'light', 'danger', 'transform', 'base'] }],
        ['Earth', { emoji: '🌍', tags: ['solid', 'ground', 'natural', 'stable', 'mineral', 'base'] }],
        ['Air',   { emoji: '💨', tags: ['gas', 'invisible', 'flow', 'sky', 'natural', 'base'] }],

        // Initial Derived Elements (Add tags for better generation!)
        ['Steam', { emoji: '💨', tags: ['gas', 'hot', 'watery', 'airborne', 'energy', 'derived'] }],
        ['Energy',{ emoji: '⚡️', tags: ['energy', 'light', 'hot', 'power', 'abstract', 'derived'] }],
        ['Lava',  { emoji: '🌋', tags: ['liquid', 'hot', 'danger', 'earthy', 'mineral', 'flow', 'derived'] }],
        ['Mud',   { emoji: '💩', tags: ['liquid', 'solid', 'wet', 'earthy', 'sticky', 'derived'] }], // Alt emoji: 🧱
        ['Dust',  { emoji: '🌪️', tags: ['solid', 'dry', 'airborne', 'small', 'earthy', 'derived'] }],
        ['Rain',  { emoji: '🌧️', tags: ['liquid', 'wet', 'cold', 'sky', 'weather', 'derived'] }],
        ['Plant', { emoji: '🌱', tags: ['life', 'green', 'natural', 'growth', 'solid', 'organic', 'derived'] }],
        ['Life',  { emoji: '🧬', tags: ['life', 'complex', 'organic', 'abstract', 'energy', 'derived'] }],
        ['Stone', { emoji: '🪨', tags: ['solid', 'hard', 'mineral', 'earthy', 'heavy', 'derived'] }],
        ['Metal', { emoji: '⚙️', tags: ['solid', 'hard', 'mineral', 'shiny', 'conductive', 'hot', 'derived'] }],
        ['Human', { emoji: '🧑', tags: ['life', 'complex', 'conscious', 'tool-user', 'organic', 'derived'] }],
        ['Clay',  { emoji: '🧱', tags: ['solid', 'earthy', 'moldable', 'wet', 'dry', 'derived'] }], // Can be wet or dry
        ['Obsidian', { emoji: '🖤', tags: ['solid', 'hard', 'mineral', 'dark', 'sharp', 'glassy', 'derived'] }],
        ['Sand',  { emoji: '🏖️', tags: ['solid', 'dry', 'small', 'granular', 'earthy', 'derived'] }],
        ['Glass', { emoji: '🔍', tags: ['solid', 'transparent', 'fragile', 'sharp', 'hot', 'derived'] }],
        // --- Added from initialRecipes logic ---
        ['Pressure', { emoji: '🏋️', tags: ['gas', 'energy', 'force', 'derived'] }],
        ['Mountain', { emoji: '⛰️', tags: ['solid', 'earthy', 'large', 'natural', 'stable', 'derived'] }],
        ['Sun', { emoji: '☀️', tags: ['hot', 'light', 'energy', 'star', 'gas', 'danger', 'derived'] }],
        ['Sea', { emoji: '🌊', tags: ['liquid', 'watery', 'large', 'natural', 'flow', 'derived'] }],
        ['Wall', { emoji: '🧱', tags: ['solid', 'hard', 'structure', 'mineral', 'derived'] }], // Reusing brick emoji
        ['Love', { emoji: '💖', tags: ['abstract', 'life', 'complex', 'emotion', 'derived'] }],
        ['Big Bang', { emoji: '💥', tags: ['energy', 'abstract', 'hot', 'light', 'origin', 'derived'] }],
    ]);

    const initialRecipesDefinition = {
        'Air+Fire': 'Energy', 'Air+Water': 'Rain', 'Air+Earth': 'Dust',
        'Earth+Fire': 'Lava', 'Earth+Water': 'Mud', 'Fire+Water': 'Steam',
        'Earth+Rain': 'Plant', 'Energy+Plant': 'Life', 'Lava+Water': 'Obsidian',
        'Lava+Air': 'Stone', 'Stone+Fire': 'Metal', 'Mud+Fire': 'Clay',
        'Life+Clay': 'Human', 'Air+Lava': 'Stone', 'Air+Stone': 'Sand',
        'Sand+Fire': 'Glass', 'Water+Stone': 'Sand',
        // --- Self-Combination Recipes ---
        'Air+Air': 'Pressure',
        'Earth+Earth': 'Mountain',
        'Fire+Fire': 'Sun',
        'Water+Water': 'Sea',
        'Stone+Stone': 'Wall',
        'Life+Life': 'Love',
        'Energy+Energy': 'Big Bang',
        // Add more initial recipes here
    };

    // --- State Variables ---
    // These will be populated by loadProgress or default initialization
    let discoveredElements = new Set();
    let recipes = {};
    let elementData = new Map(); // Holds {emoji, tags} for ALL elements (base, initial, generated)
    let draggedElement = null;
    let elementCounter = 0; // For unique workspace element IDs

    // --- Helper Functions ---
    function capitalize(str) {
        if (!str) return '';
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    function getElementData(name) {
        // Ensure name consistency (although internal names should be consistent now)
        const cleanName = capitalize(name); // Capitalize for lookup just in case
        return elementData.get(cleanName) || { emoji: '❓', tags: ['unknown'] };
    }

    function getEmoji(name) {
        return getElementData(name).emoji;
    }

    function updateElementCount() {
        if (elementCountSpan) {
            elementCountSpan.textContent = discoveredElements.size;
        } else {
           // console.warn("Element count span not found");
        }
    }

    function showMessage(text, isError = false, isDiscovery = false) {
        if (!messageArea) { /*console.warn("Message area not found");*/ return; }
        messageArea.textContent = text;
        messageArea.className = 'message show'; // Base classes
        if (isError) messageArea.classList.add('error');
        if (isDiscovery) messageArea.classList.add('discovery');

        if (messageArea.timeoutId) clearTimeout(messageArea.timeoutId);

        messageArea.timeoutId = setTimeout(() => {
            messageArea.classList.remove('show', 'error', 'discovery');
            setTimeout(() => {
                 if (!messageArea.classList.contains('show')) {
                    messageArea.textContent = '';
                 }
             }, 500);
             messageArea.timeoutId = null;
        }, 3000);
    }

    function createElementDiv(name, isDraggable = true) {
        const div = document.createElement('div');
        // Use the original name (which should be capitalized correctly now)
        const data = getElementData(name);
        div.innerHTML = `<span>${data.emoji}</span> ${name}`; // Wrap emoji in span for potential styling
        div.classList.add('element');
        div.dataset.elementName = name; // Store the canonical name
        div.title = `${name}\nTags: ${data.tags.join(', ')}`;

        if (isDraggable) {
            div.draggable = true;
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragend', handleDragEnd);
        }
        return div;
    }

    function renderPalette(filter = '') {
        if (!palette) { console.error("Palette element not found!"); return; }
        const scrollPos = palette.scrollTop;
        palette.innerHTML = ''; // Clear
        const filterLower = filter.trim().toLowerCase();
        const fragment = document.createDocumentFragment();

        const title = document.createElement('h2');
        title.textContent = 'Discovered Elements';
        fragment.appendChild(title);

        // Sort discovered elements alphabetically for display
        const sortedElements = [...discoveredElements]
            .sort((a, b) => a.localeCompare(b)) // Alphabetical sort
            .filter(name => filterLower === '' || name.toLowerCase().includes(filterLower));

        // console.log(`Rendering palette with ${sortedElements.length} elements (Filter: '${filter}')`);

        sortedElements.forEach(name => {
            if (elementData.has(name)) { // Ensure data exists before creating div
                 const div = createElementDiv(name);
                 fragment.appendChild(div);
            } else {
                console.warn(`Data missing for discovered element: ${name}. Skipping render.`);
            }
        });
        palette.appendChild(fragment);
        updateElementCount();
        palette.scrollTop = scrollPos;
    }

    function saveProgress() {
        try {
            const elementDataArray = Array.from(elementData.entries());
            const saveData = {
                version: 2, // Keep version 2
                discovered: [...discoveredElements],
                recipes: recipes,
                elementData: elementDataArray
            };
            localStorage.setItem('infiniteElementalCraftSave_v2', JSON.stringify(saveData));
            // console.log("Progress Saved.");
        } catch (e) {
            console.error("Error saving progress:", e);
            showMessage("Error saving progress! Storage might be full.", true);
        }
    }

    // **CRITICAL FUNCTION FOR INITIALIZATION**
    function loadProgress() {
        console.log("Attempting to load progress...");
        const savedV2 = localStorage.getItem('infiniteElementalCraftSave_v2');
        let loadedSuccessfully = false;

        if (savedV2) {
            try {
                const saveData = JSON.parse(savedV2);
                // **Stricter validation**
                if (saveData && saveData.version === 2 &&
                    Array.isArray(saveData.discovered) &&
                    typeof saveData.recipes === 'object' && saveData.recipes !== null &&
                    Array.isArray(saveData.elementData))
                {
                    discoveredElements = new Set(saveData.discovered);
                    recipes = saveData.recipes;
                    // Reconstruct the Map, ensuring keys are capitalized consistently
                    elementData = new Map(saveData.elementData.map(([key, value]) => [capitalize(key), value]));
                    loadedSuccessfully = true;
                    console.log(`Progress Loaded (v2). ${discoveredElements.size} elements, ${elementData.size} data entries.`);
                } else {
                    console.warn("Invalid or incompatible save data format (v2). Resetting.");
                    localStorage.removeItem('infiniteElementalCraftSave_v2');
                }
            } catch (e) {
                console.error("Failed to parse save data (v2):", e);
                localStorage.removeItem('infiniteElementalCraftSave_v2');
            }
        } else {
            console.log("No save data found (v2).");
        }

        // --- Fallback to Default Initialization ---
        if (!loadedSuccessfully) {
             console.log("Initializing default state.");
             // Deep copy initial data to prevent modification of constants
             elementData = new Map(JSON.parse(JSON.stringify(Array.from(initialElementDataDefinition))));
             recipes = JSON.parse(JSON.stringify(initialRecipesDefinition));
             discoveredElements = new Set(BASE_ELEMENTS);

             // Ensure all elements defined in initial recipes are also in elementData and discovered
             Object.values(recipes).forEach(resultName => {
                 if (initialElementDataDefinition.has(resultName)) {
                    discoveredElements.add(resultName);
                    // elementData already populated from initial definition
                 } else {
                    console.warn(`Element '${resultName}' from initial recipes is missing in initial element data!`)
                 }
             });
             console.log(`Default state initialized. ${discoveredElements.size} elements, ${elementData.size} data entries.`);
             saveProgress(); // Save the initial default state
        }

        // --- Post-Load/Init Sanity Checks ---
        // Ensure base elements are discovered and have data
        BASE_ELEMENTS.forEach(el => {
             if (!elementData.has(el)) {
                 console.error(`CRITICAL: Base element '${el}' data missing after load/init! Restoring default.`);
                 if(initialElementDataDefinition.has(el)) {
                     elementData.set(el, JSON.parse(JSON.stringify(initialElementDataDefinition.get(el))));
                 } else {
                      elementData.set(el, { emoji: '❓', tags: ['unknown', 'base', 'error'] }); // Fallback
                 }
             }
             discoveredElements.add(el); // Always ensure base are discovered
         });

        // Ensure all discovered elements have data (e.g., if save was slightly corrupted)
         const discoveredArray = [...discoveredElements]; // Avoid modifying set while iterating
         discoveredArray.forEach(el => {
            if (!elementData.has(el)) {
                console.warn(`Discovered element '${el}' missing data. Removing from discovered set.`);
                // Instead of adding default, remove from discovered if data is truly lost
                discoveredElements.delete(el);
                // Alternatively, could try to re-generate placeholder data:
                // elementData.set(el, { emoji: '❓', tags: ['unknown', 'recovered'] });
            }
         });

        console.log(`Final state check: ${discoveredElements.size} discovered, ${elementData.size} data entries.`);
        renderPalette(); // Render the loaded/initial state
    }

    function resetProgress() {
        if (confirm("Reset all progress? This cannot be undone!")) {
            localStorage.removeItem('infiniteElementalCraftSave_v2');
            if (workspace) {
                workspace.innerHTML = ''; // Clear workspace elements
                // Re-add placeholder if needed by checking after clear
                const placeholder = document.createElement('p');
                placeholder.className = 'workspace-placeholder';
                placeholder.textContent = 'Drag elements here or combine elements from the palette!';
                workspace.appendChild(placeholder);
            }

            // --- Re-initialize state from constants ---
            console.log("Resetting to default state.");
            elementData = new Map(JSON.parse(JSON.stringify(Array.from(initialElementDataDefinition))));
            recipes = JSON.parse(JSON.stringify(initialRecipesDefinition));
            discoveredElements = new Set(BASE_ELEMENTS);
             // Add results from initial recipes to discovered set
             Object.values(recipes).forEach(resultName => {
                 if (initialElementDataDefinition.has(resultName)) {
                     discoveredElements.add(resultName);
                 }
             });

            elementCounter = 0;

            renderPalette();
            saveProgress(); // Save the reset state
            showMessage("Progress Reset!");
            if (searchInput) searchInput.value = '';
        }
    }

    // --- Drag and Drop Handlers ---
    function handleDragStart(event) {
        const target = event.target.closest('.element');
        if (!target || !target.dataset.elementName) { event.preventDefault(); return; }
        const isFromPalette = target.parentElement?.id === 'palette';
        draggedElement = {
            name: target.dataset.elementName, // Use canonical name from dataset
            source: isFromPalette ? 'palette' : 'workspace',
            elementRef: target
        };
        event.dataTransfer.setData('text/plain', draggedElement.name);
        event.dataTransfer.effectAllowed = 'move';
        target.classList.add('dragging');
    }

    function handleDragEnd(event) {
        if (draggedElement?.elementRef) {
            draggedElement.elementRef.classList.remove('dragging');
        }
        event.target?.classList?.remove('dragging');
        draggedElement = null;
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(event) {
        event.preventDefault();
        if (!draggedElement || !workspace) return;

        const target = event.target;
        const workspaceRect = workspace.getBoundingClientRect();
        const dropX = event.clientX - workspaceRect.left;
        const dropY = event.clientY - workspaceRect.top;

        const dropTargetElement = target.closest('.element');
        const isDropOnWorkspace = target === workspace || (target.parentElement === workspace && !dropTargetElement);
        const isDropOnPalette = target.closest('#palette');

        if (dropTargetElement && dropTargetElement.parentElement === workspace) {
            const targetElementName = dropTargetElement.dataset.elementName;
            const draggedElementName = draggedElement.name;

            if (!targetElementName || !draggedElementName) {
                console.error("Missing element name on drop target or dragged item.");
                return;
            }

            if (draggedElement.source === 'workspace' && draggedElement.elementRef === dropTargetElement) {
                moveElement(draggedElement.elementRef, dropX, dropY);
                return;
            }
            combineElements(draggedElementName, targetElementName, dropTargetElement, draggedElement.elementRef, dropX, dropY);
        }
        else if (isDropOnWorkspace) {
            if (draggedElement.source === 'palette') {
                placeElementOnWorkspace(draggedElement.name, dropX, dropY);
            } else if (draggedElement.source === 'workspace' && draggedElement.elementRef) {
                moveElement(draggedElement.elementRef, dropX, dropY);
            }
        }
        else if (isDropOnPalette && draggedElement.source === 'workspace' && draggedElement.elementRef) {
            handleDeleteElement({ target: draggedElement.elementRef }); // Reuse delete handler for visual effect
            // draggedElement.elementRef.remove(); // Or just remove instantly
            draggedElement.elementRef = null;
        }
    }

    // --- Workspace Element Management ---
     function moveElement(elementDiv, x, y) {
        if (!elementDiv || !workspace) return;
        const elementRect = elementDiv.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        let finalX = x - elementRect.width / 2;
        let finalY = y - elementRect.height / 2;
        // Basic boundary constraint
        finalX = Math.max(0, Math.min(finalX, workspaceRect.width - elementRect.width));
        finalY = Math.max(0, Math.min(finalY, workspaceRect.height - elementRect.height));
        elementDiv.style.left = `${finalX}px`;
        elementDiv.style.top = `${finalY}px`;
    }

    // --- Added: Handler for Deleting Elements ---
    function handleDeleteElement(event) {
        const elementToDelete = event.target.closest('.element');
        if (elementToDelete && elementToDelete.parentElement === workspace) {
            const elementName = elementToDelete.dataset.elementName || 'Element';
            console.log(`Deleting ${elementName}`);
            elementToDelete.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            elementToDelete.style.transform = 'scale(0.1)';
            elementToDelete.style.opacity = '0';
            setTimeout(() => {
                elementToDelete.remove();
                // Check if workspace is empty after deletion
                 if (workspace.querySelectorAll('.element').length === 0) {
                    const placeholder = workspace.querySelector('.workspace-placeholder');
                    if(placeholder) placeholder.style.display = 'block'; // Show placeholder
                }
                // Optional confirmation: showMessage(`${elementName} removed.`);
            }, 200);
        }
    }

    function placeElementOnWorkspace(name, x, y) {
        if (!workspace) return;
         // Ensure the element data exists before placing
         if (!elementData.has(name)) {
            console.error(`Attempted to place element '${name}' with no data!`);
            showMessage(`Error: Data missing for ${name}`, true);
            return;
         }

        const newElementDiv = createElementDiv(name);
        newElementDiv.style.position = 'absolute';
        newElementDiv.id = `ws-el-${elementCounter++}`;

        newElementDiv.addEventListener('dragover', handleDragOver);
        newElementDiv.addEventListener('drop', handleDrop);
        newElementDiv.addEventListener('dblclick', handleDeleteElement); // Add delete listener

        workspace.appendChild(newElementDiv);
        const placeholder = workspace.querySelector('.workspace-placeholder');
        if(placeholder) placeholder.style.display = 'none'; // Hide placeholder

        moveElement(newElementDiv, x, y);
    }

    // --- Generation & Combination Logic ---

    function getBaseNoun(name) {
         if(!name) return 'Thing';
         const parts = name.split(' ');
         return parts[parts.length - 1];
    }

    function getAdjectiveFromTags(tags) {
        if (!Array.isArray(tags)) return null;
        // Prioritize specific tags
        if (tags.includes('hot')) return 'Burning';
        if (tags.includes('cold')) return 'Frozen';
        if (tags.includes('wet')) return 'Soaked'; // Better than 'Wet'
        if (tags.includes('dry')) return 'Parched'; // Better than 'Dry'
        if (tags.includes('life')) return 'Living';
        if (tags.includes('energy')) return 'Charged';
        if (tags.includes('dark')) return 'Shadow'; // Noun-like adjective
        if (tags.includes('light')) return 'Glowing';
        if (tags.includes('liquid')) return 'Molten'; // Can also mean hot liquid
        if (tags.includes('solid')) return 'Solidified';
        if (tags.includes('gas')) return 'Gaseous';
        if (tags.includes('danger')) return 'Hazardous';
        if (tags.includes('complex')) return 'Intricate';
        if (tags.includes('sharp')) return 'Sharp';
        if (tags.includes('shiny')) return 'Shiny';
        // Fallback to less specific tags
        if (tags.includes('mineral')) return 'Mineral';
        if (tags.includes('organic')) return 'Organic';
        if (tags.includes('earthy')) return 'Earthy';
        if (tags.includes('watery')) return 'Watery';
        if (tags.includes('airborne')) return 'Floating';
        return null;
    }

    function generateNewElement(name1, name2) {
        // Use canonical names
        name1 = capitalize(name1);
        name2 = capitalize(name2);

        console.log(`Generating new element for: ${name1} + ${name2}`);

        // Handle self-combination explicitly if it reaches here (meaning no recipe)
        if (name1 === name2) {
             const data1 = getElementData(name1);
             let adj = getAdjectiveFromTags(data1.tags);
             if (data1.tags.includes('liquid')) return capitalize(`Ocean of ${name1}`);
             if (data1.tags.includes('solid')) return capitalize(`Mountain of ${name1}`);
             if (data1.tags.includes('gas')) return capitalize(`Atmosphere of ${name1}`);
             return capitalize(`${adj || 'Pure'} ${getBaseNoun(name1)}`);
        }

        const data1 = getElementData(name1);
        const data2 = getElementData(name2);
        const combinedTags = new Set([...(data1.tags || []), ...(data2.tags || [])]); // Ensure tags arrays exist

        let generatedName = '';
        const baseNoun1 = getBaseNoun(name1);
        const baseNoun2 = getBaseNoun(name2);
        const sortedNouns = [baseNoun1, baseNoun2].sort();

        // --- Prioritize Specific Overrides ---
        if (combinedTags.has('life') && combinedTags.has('stone')) generatedName = 'Golem';
        else if (combinedTags.has('life') && combinedTags.has('metal')) generatedName = 'Robot';
        else if (combinedTags.has('life') && combinedTags.has('watery')) generatedName = 'Fish';
        else if (combinedTags.has('life') && combinedTags.has('earthy')) generatedName = 'Animal';
        else if (combinedTags.has('life') && combinedTags.has('sky')) generatedName = 'Bird';
        else if (combinedTags.has('hot') && combinedTags.has('stone') && !combinedTags.has('watery')) generatedName = 'Magma Rock';
        else if (combinedTags.has('plant') && combinedTags.has('stone')) generatedName = 'Mossy Rock';
        else if (combinedTags.has('watery') && combinedTags.has('airborne')) generatedName = 'Cloud';
        else if (combinedTags.has('cold') && combinedTags.has('watery')) generatedName = 'Ice';
        else if (combinedTags.has('energy') && combinedTags.has('metal')) generatedName = 'Electricity';
        else if (combinedTags.has('human') && combinedTags.has('stone')) generatedName = 'Statue';
        else if (combinedTags.has('human') && combinedTags.has('metal')) generatedName = 'Knight';
        // --- ADD MORE OVERRIDES ---

        // --- Template Generation ---
        if (!generatedName) {
            const rand = Math.random();
            if (rand < 0.5) { // Template: [Adjective] [Noun]
                 let adj = getAdjectiveFromTags(combinedTags);
                 let noun = (baseNoun1.length <= baseNoun2.length) ? baseNoun2 : baseNoun1; // Prefer more complex noun?
                 if (adj && noun !== adj) { // Avoid "Burning Burn" etc.
                    generatedName = `${adj} ${noun}`;
                 } else { // Fallback if no good adjective or adj == noun
                    generatedName = `${sortedNouns[0]}-${sortedNouns[1]} Mix`;
                 }
            } else if (rand < 0.8) { // Template: [Noun] Essence / Power / etc.
                 let suffix = 'Mixture';
                 if (combinedTags.has('energy')) suffix = 'Energy';
                 if (combinedTags.has('life')) suffix = 'Spirit';
                 if (combinedTags.has('danger')) suffix = 'Hazard';
                 if (combinedTags.has('abstract')) suffix = 'Concept';
                 let noun = (baseNoun1.length <= baseNoun2.length) ? baseNoun1 : baseNoun2; // Prefer simpler noun for essence?
                 generatedName = `${noun} ${suffix}`;
            } else { // Fallback: Noun-Noun or Tag descriptor
                 if (sortedNouns[0] !== sortedNouns[1]) {
                    generatedName = `${sortedNouns[0]}-${sortedNouns[1]}`;
                 } else { // Should not happen due to earlier check, but safe fallback
                     const primaryTag = [...combinedTags].find(tag => !['unknown', 'generated', 'base', 'derived'].includes(tag)) || 'Compound';
                     generatedName = `${capitalize(primaryTag)} Substance`;
                 }
            }
        }

        generatedName = capitalize(generatedName);

        // --- Limit Complexity & Length ---
        const wordCount = generatedName.split(/[\s-]+/).length;
        if (wordCount > 3) {
             let adj = getAdjectiveFromTags(combinedTags) || sortedNouns[0];
             let noun = (baseNoun1.length >= baseNoun2.length) ? baseNoun1 : baseNoun2; // Pick longer noun?
             if (adj === noun) adj = sortedNouns[0] === baseNoun1 ? sortedNouns[1] : sortedNouns[0]; // Ensure adj != noun
             generatedName = capitalize(`${adj} ${noun}`);
        }
        if (generatedName.length > 25) {
             generatedName = "Complex Substance";
        }

        // --- Collision Handling ---
        let finalName = generatedName;
        let counter = 2;
        // Check against discovered elements AND recipes values
        const existingNames = new Set([...discoveredElements, ...Object.values(recipes)]);

        while (existingNames.has(finalName)) {
             console.log(`Collision detected for ${finalName}. Resolving...`);
             if (generatedName === "Complex Substance") { // Handle generic name collision
                 finalName = `Substance ${counter}`;
             } else {
                 const romanMatch = finalName.match(/^(.*)\s([IVXLCDM]+)$/i);
                 const numberMatch = finalName.match(/^(.*)\s(\d+)$/);
                 if (romanMatch && counter <= 5) {
                     const base = romanMatch[1];
                     const currentRoman = romanMatch[2].toUpperCase();
                     if (currentRoman === 'I') finalName = `${base} II`;
                     else if (currentRoman === 'II') finalName = `${base} III`;
                     else if (currentRoman === 'III') finalName = `${base} IV`;
                     else if (currentRoman === 'IV') finalName = `${base} V`;
                     else finalName = `${generatedName} ${counter}`; // Fallback if Roman gets complex
                 } else if (numberMatch) {
                      finalName = `${numberMatch[1]} ${parseInt(numberMatch[2]) + 1}`;
                 } else {
                     finalName = `${generatedName} II`; // Start with II
                 }
             }
             counter++;
             if (counter > 15) {
                  console.error("Collision resolution limit reached for", generatedName);
                  finalName = `${generatedName}-${Date.now()}`;
                  break;
             }
        }

        // --- Generate Data for the New Element ---
        const newElementTags = Array.from(combinedTags);
        if (!newElementTags.includes('generated')) newElementTags.push('generated');

        // Inherit emoji - prioritize non-base, non-default emoji
        let newEmoji = '✨'; // Default
        const emoji1 = data1.emoji || '✨';
        const emoji2 = data2.emoji || '✨';
        if (emoji1 !== '✨' && emoji1 !== '❓' && !BASE_ELEMENTS.includes(name1)) newEmoji = emoji1;
        else if (emoji2 !== '✨' && emoji2 !== '❓' && !BASE_ELEMENTS.includes(name2)) newEmoji = emoji2;
        else if (emoji1 !== '✨' && emoji1 !== '❓') newEmoji = emoji1; // Fallback to first parent if non-default
        else if (emoji2 !== '✨' && emoji2 !== '❓') newEmoji = emoji2; // Fallback to second parent

        // Add the new element's data to the main map
        elementData.set(finalName, { emoji: newEmoji, tags: newElementTags });
        console.log(`-> Generated Data for ${finalName}: ${newEmoji} [${newElementTags.join(', ')}]`);

        return finalName;
    }

    function combineElements(name1, name2, targetElementDiv, draggedElementDiv, dropX, dropY) {
        // Ensure names are canonical before lookup/combination
        name1 = capitalize(name1);
        name2 = capitalize(name2);

        const key = [name1, name2].sort().join('+');
        let resultName = recipes[key];
        let isNewDiscovery = false;
        let isFirstTimeCombination = !recipes[key]; // True if we are about to generate

        // --- Check for existing recipe FIRST ---
        if (resultName) {
             // Ensure result name is also capitalized for consistency
             resultName = capitalize(resultName);
             // console.log(`Using recipe: ${key} -> ${resultName}`);
             if (!elementData.has(resultName)) {
                 console.error(`Recipe found (${key} -> ${resultName}), but data for result is missing! Attempting to recover.`);
                 // Try to find it in initial definitions
                 if(initialElementDataDefinition.has(resultName)) {
                      elementData.set(resultName, JSON.parse(JSON.stringify(initialElementDataDefinition.get(resultName))));
                      console.log(`Recovered data for ${resultName}`);
                 } else {
                      elementData.set(resultName, { emoji: '❓', tags: ['unknown', 'recovered'] }); // Add placeholder data
                      showMessage(`Data error for ${resultName}. Please report.`, true);
                 }
             }
             isNewDiscovery = !discoveredElements.has(resultName);
        } else {
            // --- Generate if recipe doesn't exist ---
            resultName = generateNewElement(name1, name2); // Will be capitalized
            // Add the new recipe dynamically
            recipes[key] = resultName; // Store canonical (capitalized) name
            isNewDiscovery = true; // Generated elements are always new discoveries
        }

        // --- Handle Discovery Status ---
        if (isNewDiscovery) {
            discoveredElements.add(resultName); // Add canonical name
            renderPalette();
            showMessage(`🚀 New Discovery: ${getEmoji(resultName)} ${resultName}!`, false, true);
            saveProgress(); // Save new discovery, recipe, and potentially new element data
        } else if (isFirstTimeCombination) {
             // This case should be rare now, as generation happens immediately if no recipe
            showMessage(`💡 Combined: ${getEmoji(name1)} ${name1} + ${getEmoji(name2)} ${name2} = ${getEmoji(resultName)} ${resultName}!`, false, false); // Not really a discovery message
            // No save needed if recipe existed
        } else {
            // Standard combination
            showMessage(`Combined ${getEmoji(name1)} ${name1} + ${getEmoji(name2)} ${name2} = ${getEmoji(resultName)} ${resultName}.`);
        }

        // --- Update Workspace ---
        targetElementDiv?.remove();
        if (draggedElement?.source === 'workspace' && draggedElementDiv) {
             draggedElementDiv.remove();
        }

        // Ensure workspace isn't empty before trying to remove placeholder again
         if (workspace.querySelectorAll('.element').length === 0) {
            const placeholder = workspace.querySelector('.workspace-placeholder');
            if(placeholder) placeholder.style.display = 'none'; // Hide placeholder before placing new element
        }

        placeElementOnWorkspace(resultName, dropX, dropY); // Place using canonical name

        if (draggedElement && draggedElement.elementRef === draggedElementDiv) {
            draggedElement.elementRef = null;
        }
    }

    // --- Initialization ---
    console.log("Setting up event listeners...");
    if (searchInput) searchInput.addEventListener('input', (e) => renderPalette(e.target.value));
    else console.warn("Search bar element (#search-bar) not found.");
    if (resetButton) resetButton.addEventListener('click', resetProgress);
    else console.warn("Reset button element (#reset-button) not found.");

    if (!palette) console.error("Palette element (#palette) not found!");
    if (!workspace) console.error("Workspace element (#workspace) not found!");
    if (!messageArea) console.warn("Message area element (#message-area) not found.");
    if (!elementCountSpan) console.warn("Element count span (#element-count) not found.");

    if (workspace) {
        workspace.addEventListener('dragover', handleDragOver);
        workspace.addEventListener('drop', handleDrop);
    } else {
         console.error("Workspace element not found, drag/drop will not work.");
    }

    // Add Attribution
    if (attributionFooter) {
        attributionFooter.innerHTML = "Infinite Craft Concept & Logic inspired by various sources though ALL code is original. JS enhancements by destructive-entity (github). All code is completley written by destructive-entity (github).";
    } else {
        console.log("Attribution: Infinite Craft Concept & Logic inspired by various sources though ALL code is original. JS enhancements by destructive-entity (github). All code is completley written by destructive-entity (github).");
    }

    // --- Load progress or set defaults ---
    loadProgress(); // This function now handles initialization and rendering

    // --- Optional: Add CSS for shake animation ---
    try {
        const styleSheet = document.styleSheets[0];
        let ruleExists = false;
        for(let i = 0; i < styleSheet.cssRules.length; i++) {
            if(styleSheet.cssRules[i] instanceof CSSKeyframesRule && styleSheet.cssRules[i].name === 'shake') {
                ruleExists = true; break;
            }
        }
        if (!ruleExists && styleSheet) { // Check if stylesheet exists
            styleSheet.insertRule(` @keyframes shake { /* ... shake keyframes ... */ } `, styleSheet.cssRules.length);
        }
    } catch (e) { console.warn("Could not check/insert CSS rule for shake animation:", e); }

    console.log("Game Initialized.");

}); // End DOMContentLoaded