import { layersConfig } from './layersConfig.js';
import { performInitialZoom, sortLayersByOrder} from './cesium_utils.js';
import { addLayersToLegend } from './addlayertolegend.js';


Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MzhmMWRkMS01ZGM2LTRlMTctYjU1YS03NWE3YzUyOWIzMzkiLCJpZCI6NzY1NzgsImlhdCI6MTczMTA4MTIwMn0.u1K3tG279-utQU2WAw2nKtPGx7hiwnJHLHis9JPcM8Q';

// Initialize Cesium Viewer with Swisstopo terrain
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: "//3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1" // Swiss 3D terrain
    }),
    baseLayerPicker: false,
    animation: false, // No animation, keeps it minimal
    timeline: false,  // Who needs a timeline anyway?
    creditContainer: document.getElementById('invisibleCredits') // Hides credits
});

let initialZoomPerformed = false;

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
sortLayersByOrder(layersConfig, viewer);

// Add legend layers to the UI
addLayersToLegend(layersConfig, viewer);


const copyrightButton = document.getElementById('copyrightButton');
const overlay = document.getElementById('overlay');
const closeOverlay = document.getElementById('closeOverlay');
const overlayFrame = document.getElementById('overlayFrame');

// URL des Overlays einstellen
const overlayURL = 'copyright.html'; // Deine HTML-Datei

// Overlay öffnen
copyrightButton.addEventListener('click', () => {
    overlayFrame.src = overlayURL;
    overlay.classList.remove('hidden');
});

// Overlay schließen
closeOverlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlayFrame.src = ''; // Frame leeren
});
