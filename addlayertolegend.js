//import { updateLayerVisibility } from './cesium_utils.js';
// import { initializeLayers } from './cesium_utils.js';

// import { setupLayerVisibilityControl } from './cesium_utils.js';
// import { layersConfig } from './layersConfig.js';

const sanitizeLayerName = (name) => name.replace(/[^a-zA-Z0-9-_]/g, '-');

// Funktion zum Hinzufügen der Layer zur Legende
export function addLayersToLegend(layersConfig, viewer) {

    const groupedLayers = layersConfig.reduce((groups, layer) => {
        if (!groups[layer.category]) {
            groups[layer.category] = [];
        }
        groups[layer.category].push(layer);
        return groups;
    }, {});

    const legendElement = document.getElementById('legend');
    const sortedCategories = Object.keys(groupedLayers).sort();

    sortedCategories.forEach((category) => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'legend-category';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categoryContainer.appendChild(categoryTitle);

        groupedLayers[category]
            .sort((a, b) => a.order - b.order)
            .forEach((layer) => {
                const listItem = document.createElement('li');
                listItem.className = 'legend-item';

                const title = document.createElement('div');
                title.className = 'legend-item-title';
                title.textContent = layer.name;

                // Checkbox mit eindeutiger ID
                const toggleCheckbox = document.createElement('input');
                toggleCheckbox.type = 'checkbox';
                toggleCheckbox.checked = layer.active;
                toggleCheckbox.id = `checkbox-${sanitizeLayerName(layer.name)}`;

                // Eventlistener für die Checkbox
                toggleCheckbox.addEventListener('change', () => {
                    layer.active = toggleCheckbox.checked;

                });

                const menu = document.createElement('div');
                menu.className = 'legend-item-menu';

                if (layer.provider && typeof layer.provider !== 'function') {
                    const range = document.createElement('input');
                    range.type = 'range';
                    range.min = 0;
                    range.max = 1;
                    range.step = 0.1;
                    range.value = layer.opacity || 1;

                    range.addEventListener('input', () => {
                        layer.opacity = parseFloat(range.value);
                        if (layer.viewerLayer) {
                            layer.viewerLayer.alpha = layer.opacity;
                        }
                    });

                    const sliderLabel = document.createElement('label');
                    sliderLabel.textContent = 'Transparenz:';
                    menu.appendChild(sliderLabel);
                    menu.appendChild(range);
                }

                const infoButton = document.createElement('button');
                infoButton.textContent = 'Info';
                infoButton.addEventListener('click', () => {
                    alert(`Information zu ${layer.name}`);
                });
                menu.appendChild(infoButton);

                title.addEventListener('click', () => {
                    menu.classList.toggle('open');
                });

                title.prepend(toggleCheckbox);
                listItem.appendChild(title);
                listItem.appendChild(menu);
                categoryContainer.appendChild(listItem);

                // Initialisiere aktive Layer
                if (layer.active && toggleCheckbox.checked) {
                    toggleCheckbox.dispatchEvent(new Event('change'));
                }
            });

        legendElement.appendChild(categoryContainer);
    });
}

