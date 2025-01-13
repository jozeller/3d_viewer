import { sortLayersByOrder } from './cesium_utils.js';

const sanitizeLayerName = (name) => name.replace(/[^a-zA-Z0-9-_]/g, '-');

// Konfiguration: Gruppen mit Checkboxen oder Radiobuttons
const radioGroups = ['Basiskarten']; // Kategorien, die Radiobuttons verwenden
//const checkboxGroups = ['Analyse', 'Gefahrenkarten']; // Kategorien mit Checkboxen
const categoryOrder = ['Analyse', 'Gefahrenkarten','Basiskarten']; // Sortierreihenfolge der Kategorien

export function addLayersToLegend(layersConfig, viewer) {
    const groupedLayers = layersConfig.reduce((groups, layer) => {
        if (!groups[layer.category]) {
            groups[layer.category] = [];
        }
        groups[layer.category].push(layer);
        return groups;
    }, {});

    const legendElement = document.getElementById('legend');
    
    // Kategorien sortieren nach categoryOrder
    const sortedCategories = categoryOrder.filter(category => groupedLayers[category]);

    sortedCategories.forEach((category) => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'legend-category';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categoryContainer.appendChild(categoryTitle);

        const isRadioGroup = radioGroups.includes(category);

        groupedLayers[category]
            .sort((a, b) => a.order - b.order)
            .forEach((layer) => {
                const listItem = document.createElement('li');
                listItem.className = 'legend-item';

                const title = document.createElement('div');
                title.className = 'legend-item-title';
                title.textContent = layer.name;

                const toggleInput = document.createElement('input');
                toggleInput.type = isRadioGroup ? 'radio' : 'checkbox';
                toggleInput.name = isRadioGroup ? `radio-${sanitizeLayerName(category)}` : '';
                toggleInput.checked = layer.active;
                toggleInput.id = `input-${sanitizeLayerName(layer.name)}`;

                toggleInput.addEventListener('change', () => {
                    if (isRadioGroup) {
                        groupedLayers[category].forEach((groupLayer) => {
                            if (groupLayer.viewerLayer) {
                                viewer.imageryLayers.remove(groupLayer.viewerLayer);
                                groupLayer.viewerLayer = null;
                            }
                        });
                    }

                    if (toggleInput.checked) {
                        if (!layer.viewerLayer) {
                            layer.viewerLayer = viewer.imageryLayers.addImageryProvider(layer.provider);
                            layer.viewerLayer.alpha = layer.opacity || 1;
                        }
                    } else {
                        if (layer.viewerLayer) {
                            viewer.imageryLayers.remove(layer.viewerLayer);
                            layer.viewerLayer = null;
                        }
                    }
                    sortLayersByOrder(layersConfig, viewer);
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

                title.prepend(toggleInput);
                listItem.appendChild(title);
                listItem.appendChild(menu);
                categoryContainer.appendChild(listItem);
            });

        legendElement.appendChild(categoryContainer);
    });
}
