export function performInitialZoom(viewer) {
    // Camera flies to Switzerland with a nice tilt angle
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(8.1355, 46.4754, 15000), // Swiss center
        orientation: {
            heading: Cesium.Math.toRadians(0), // Facing north
            pitch: Cesium.Math.toRadians(-60), // Looking down
            roll: 0 // No rolling!
        },
        duration: 2 // Smooth 2-second animation
    });
}

export function sortLayersByOrder(layersConfig,viewer) {
    const imageryLayers = viewer.imageryLayers;

    // Find the default layer
    const defaultLayer = layersConfig.find(layer => layer.order === 9999);
    const activeLayers = layersConfig
        .filter(layer => layer.viewerLayer && layer.order !== 9999)
        .sort((a, b) => a.order - b.order);

    // Clear all layers and re-add them in sorted order
    imageryLayers.removeAll(false);
    [...activeLayers, defaultLayer].reverse().forEach(layer => {
        if (layer && layer.viewerLayer) {
            imageryLayers.add(layer.viewerLayer);
        }
    });

    //console.log("Layers sorted correctly:", [defaultLayer.name, ...activeLayers.map(layer => layer.name)]);
}