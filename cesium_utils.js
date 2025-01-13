export function performInitialZoom(viewer) {
    // Camera zoom with a nice tilt angle
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(8.627678, 46.350356, 60000),     
        orientation: {
            heading: Cesium.Math.toRadians(0), // Facing north
            pitch: Cesium.Math.toRadians(-50), // Looking down
            roll: 0 // No rolling!
        },
        duration: 2 // Smooth 2-second animation
    });
}

export function initializeLayers(layersConfig, viewer) {
    const imageryLayers = viewer.imageryLayers;

    // Sortiere Layer basierend auf ihrer `order` (aufsteigend)
    const sortedLayers = layersConfig.sort((a, b) => a.order - b.order);

    // Füge die Layer in umgekehrter Reihenfolge hinzu
    for (let i = sortedLayers.length - 1; i >= 0; i--) {
        const layer = sortedLayers[i];
        if (!layer.viewerLayer && layer.active) {
            layer.viewerLayer = imageryLayers.addImageryProvider(layer.provider);
            layer.viewerLayer.alpha = layer.opacity || 1;
        }
        if (layer.viewerLayer) {
            layer.viewerLayer.show = layer.active;
        }
    }

    // Basislayer nach unten verschieben
    const baseLayer = layersConfig.find(layer => layer.order === 9999);
    if (baseLayer && baseLayer.viewerLayer) {
        imageryLayers.lowerToBottom(baseLayer.viewerLayer);
    }
}

const sanitizeLayerName = (name) => name.replace(/[^a-zA-Z0-9-_]/g, '-');


export function setupLayerVisibilityControl(layersConfig, viewer) {
    const imageryLayers = viewer.imageryLayers;

    layersConfig.forEach(layer => {
        const checkbox = document.querySelector(`#checkbox-${sanitizeLayerName(layer.name)}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    // Falls der Layer noch nicht existiert, nur beim ersten Aktivieren hinzufügen
                    if (!layer.viewerLayer) {
                        layer.viewerLayer = imageryLayers.addImageryProvider(layer.provider);
                        layer.viewerLayer.alpha = layer.opacity || 1;
                    }
                    // Layer sichtbar machen
                    layer.viewerLayer.show = true;
                } else {
                    // Layer nur ausblenden
                    if (layer.viewerLayer) {
                        layer.viewerLayer.show = false;
                    }
                }
            });
        }
    });
}

