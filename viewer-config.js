import { layersConfig } from './layersConfig.js';
import { performInitialZoom, initializeLayers} from './cesium_utils.js';
import { addLayersToLegend } from './addlayertolegend.js';
import { addShadowAnalysis } from './shadow_analysis.js';
import { setupLayerVisibilityControl } from './cesium_utils.js';



Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmODI4YTJjMy0zYWZhLTRlNzItOWQ3My05NTNkZDQ1ODYyYWYiLCJpZCI6NzY1NzgsImlhdCI6MTYzOTU1MzA1Nn0.AQlWSR6-eL0Wdq2c0UyV3_gyn6cd1xmm3KolhvK54cw';
                                 
// Initialize Cesium Viewer with Swisstopo terrain
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: "//3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1" // Swiss 3D terrain
    }),
    shadows: true,
    baseLayerPicker: false,
    infoBox: false,
    animation: false, // No animation, keeps it minimal
    timeline: false,  // Who needs this ugly timeline anyway?
    selectionIndicator: false, // No selection indicator
    creditContainer: document.getElementById('invisibleCredits') // Hides credits
});

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(8.1355, 46.4754, 400000), // Zentrum der Schweiz
    orientation: {
        heading: Cesium.Math.toRadians(0),   // Richtung Norden
        pitch: Cesium.Math.toRadians(-90),  // Blickwinkel nach unten
        roll: 0                             // Kein Rollen
    }
});
let initialZoomPerformed = false;

viewer.scene.globe.preloadSiblings = true;
// Wait until all tiles are loaded before performing the initial zoom
viewer.scene.globe.tileLoadProgressEvent.addEventListener((current, total) => {
    if (!initialZoomPerformed && current === 0) {
        initialZoomPerformed = true;
        viewer.scene.globe.tileLoadProgressEvent.removeEventListener(); // Removes the listener
        performInitialZoom(viewer); // Center camera on Switzerland
    }
});

// Replaces home button default behavior with custom zoom
viewer.homeButton.viewModel.command.beforeExecute.addEventListener((event) => { 
    event.cancel = true;
    performInitialZoom(viewer); // Zoom to Switzerland
});

// Remove default base imagery and set it aside for custom management
const defaultImageryProvider = viewer.imageryLayers.get(0).imageryProvider;
viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

layersConfig[0].provider = defaultImageryProvider;

// Activate layers if marked active
layersConfig.forEach(layer => {
    if (layer.active) {
        if (!layer.viewerLayer) {
            layer.viewerLayer = viewer.imageryLayers.addImageryProvider(layer.provider);
            layer.viewerLayer.alpha = layer.opacity || 1;
        }
    }
});

// Sort layers after adding them
//sortLayersByOrder(layersConfig, viewer);
//updateLayerVisibility(layersConfig, viewer);
initializeLayers(layersConfig, viewer);
// Add legend layers to the UI
addLayersToLegend(layersConfig, viewer);

setupLayerVisibilityControl(layersConfig, viewer);
// Add Shadow Analysis to the UI
addShadowAnalysis(viewer);


const copyrightButton = document.getElementById('copyrightButton');
const overlay = document.getElementById('overlay');
const closeOverlay = document.getElementById('closeOverlay');
const overlayFrame = document.getElementById('overlayFrame');

// URL des Overlays einstellen
const overlayURL = 'copyright.html';

// Overlay öffnen
copyrightButton.addEventListener('click', () => {
    overlayFrame.src = overlayURL;
    overlay.classList.remove('hidden');
});

// Overlay schließen
closeOverlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlayFrame.src = ''; // Frame clear
});
