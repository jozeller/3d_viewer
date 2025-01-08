async function updateTerrainProvider(viewer, newTerrainProvider) {
    // Save the current state of imagery layers
    const imageryLayersState = [];
    const imageryLayers = viewer.imageryLayers;

    for (let i = 0; i < imageryLayers.length; i++) {
        const layer = imageryLayers.get(i);
        imageryLayersState.push({
            imageryProvider: layer.imageryProvider,
            show: layer.show,
            alpha: layer.alpha,
        });
    }

    // Replace the terrain provider
    viewer.terrainProvider = newTerrainProvider;

    // Restore the imagery layers
    imageryLayers.removeAll(false);
    imageryLayersState.forEach(state => {
        const newLayer = imageryLayers.addImageryProvider(state.imageryProvider);
        newLayer.show = state.show;
        newLayer.alpha = state.alpha;
    });

    console.log("Terrain provider updated without reloading layers.");
}

export async function addShadowAnalysis(viewer) {
    const shadowButton = document.getElementById('shadowButton');
    const sliderContainer = document.createElement('div');
    sliderContainer.id = 'shadowSliderContainer';

    const dateField = document.createElement('input');
    dateField.type = 'date';
    dateField.value = new Date().toISOString().split('T')[0];
    dateField.classList.add('modern-date-selector');

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 24;
    slider.step = 0.01;
    slider.value = 12;
    slider.style.width = 'calc(100% - 20px)';
    slider.style.maxWidth = '300px';
    slider.style.margin = '0 auto';
    slider.style.display = 'block';
    slider.style.marginTop = '10px';

    const label = document.createElement('div');
    label.textContent = '12:00';
    label.style.textAlign = 'center';
    label.style.fontSize = '14px';
    label.style.marginTop = '5px';

    const timeInfo = document.createElement('div');
    timeInfo.style.textAlign = 'center';
    timeInfo.style.marginTop = '10px';

    sliderContainer.appendChild(dateField);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(label);
    sliderContainer.appendChild(timeInfo);
    document.body.appendChild(sliderContainer);

    let shadowsActive = false;
    let heightRestrictionListener = null;


    const minimumHeightAboveTerrain = 8000; // Mindesthöhe über dem Gelände in Metern
    const maximumHeightAboveTerrain = 20000; // Maximale Höhe über dem Gelände in Metern
    
    function enforceCameraHeightRestriction(viewer) {
        const camera = viewer.scene.camera;
        const globe = viewer.scene.globe;
    
        heightRestrictionListener = () => {
            const cameraPosition = camera.positionCartographic;
            const terrainHeight = globe.getHeight(cameraPosition) || 0;
            const currentHeightAboveTerrain = cameraPosition.height - terrainHeight;
    
            if (currentHeightAboveTerrain < minimumHeightAboveTerrain) {
                // Set camera to minimum height
                const newHeight = terrainHeight + minimumHeightAboveTerrain;
                const destination = Cesium.Cartesian3.fromRadians(
                    cameraPosition.longitude,
                    cameraPosition.latitude,
                    newHeight
                );
                camera.position = destination;
    
                console.log(`Höhe angepasst: Mindesthöhe ${minimumHeightAboveTerrain}m erreicht.`);
            }
    
            if (currentHeightAboveTerrain > maximumHeightAboveTerrain) {
                // Set camera to maximum height
                const newHeight = terrainHeight + maximumHeightAboveTerrain;
                const destination = Cesium.Cartesian3.fromRadians(
                    cameraPosition.longitude,
                    cameraPosition.latitude,
                    newHeight
                );
                camera.position = destination;
    
                console.log(`Höhe angepasst: Maximalhöhe ${maximumHeightAboveTerrain}m erreicht.`);
            }
        };
        viewer.scene.preRender.addEventListener(heightRestrictionListener);
    }
    

    async function enableShadows() {
        const newTerrain = Cesium.createWorldTerrain({
            //requestVertexNormals: true,
        });
    
        await updateTerrainProvider(viewer, newTerrain);
    
        // Check and adjust camera height before enforcing restrictions
        const camera = viewer.scene.camera;
        const globe = viewer.scene.globe;
        const cameraPosition = camera.positionCartographic;
        const terrainHeight = globe.getHeight(cameraPosition) || 0;
        const currentHeightAboveTerrain = cameraPosition.height - terrainHeight;
    
        if (currentHeightAboveTerrain < minimumHeightAboveTerrain) {
            const newHeight = terrainHeight + minimumHeightAboveTerrain;
            const destination = Cesium.Cartesian3.fromRadians(
                cameraPosition.longitude,
                cameraPosition.latitude,
                newHeight
            );
            camera.flyTo({ destination ,        
                orientation: {
                    heading: Cesium.Math.toRadians(0), // Facing north
                    pitch: Cesium.Math.toRadians(-30), // Looking down
                    roll: 0 // No rolling!
            }
            });
            console.log(`Kamera auf Mindesthöhe angepasst: ${minimumHeightAboveTerrain}m.`);
        } else if (currentHeightAboveTerrain > maximumHeightAboveTerrain) {
            const newHeight = terrainHeight + maximumHeightAboveTerrain;
            const destination = Cesium.Cartesian3.fromRadians(
                cameraPosition.longitude,
                cameraPosition.latitude,
                newHeight
            );
            camera.flyTo({ destination ,        
                orientation: {
                    heading: Cesium.Math.toRadians(0), // Facing north
                    pitch: Cesium.Math.toRadians(-50), // Looking down
                    roll: 0 // No rolling!
            }
            });
            console.log(`Kamera auf Maximalhöhe angepasst: ${maximumHeightAboveTerrain}m.`);
        }
    
        // Enable shadows and terrain lighting
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.globe.preloadAncestors = true;
        //viewer.scene.globe.maximumScreenSpaceError = 1; // Increase terrain quality
        //viewer.scene.globe.tileCacheSize = 1000; // Increase terrain cache size
        viewer.scene.requestRenderMode = false;
        viewer.shadows = true;
        viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.shadowMap.maximumDistance = 20000000;
        viewer.scene.shadowMap.size = 4096;
        viewer.scene.shadowMap.softShadows = true;
        viewer.scene.shadowMap.darkness = 0.5;
 //       viewer.scene.shadowMap.minimumPcfSamples = 16;   // Increase shadow quality
    
        // Enforce camera height restrictions during shadow analysis
        enforceCameraHeightRestriction(viewer);
    
        console.log("Shadows enabled and terrain switched to Cesium World Terrain.");
    }
    

    async function disableShadows() {
        // Disable shadows and terrain lighting
        viewer.shadows = false;
        viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
        viewer.scene.globe.enableLighting = false;

    // Remove camera height restriction
    if (heightRestrictionListener) {
        viewer.scene.preRender.removeEventListener(heightRestrictionListener);
        heightRestrictionListener = null;
    }

        console.log("Shadows disabled and camera restriction removed.");
    }

    shadowButton.addEventListener('click', async () => {
        const isVisible = sliderContainer.style.display === 'block';
    
            if (isVisible) {
                sliderContainer.style.display = 'none';
                await disableShadows(); // Disable shadow analysis
                shadowsActive = false;
                shadowButton.style.backgroundColor = '#383838';
            } else {
                sliderContainer.style.display = 'block';
                await enableShadows(); // Enable shadow analysis
                shadowsActive = true;
                shadowButton.style.backgroundColor = '#ffd904';
                updateSunTimes();
            }
    });
    
    async function fetchSunTimes(latitude, longitude, date) {
        const response = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`
        ); // Fetches sunrise and sunset times
        const data = await response.json();
        return {
            sunrise: luxon.DateTime.fromISO(data.results.sunrise, { zone: 'UTC' }).setZone('Europe/Zurich'),
            sunset: luxon.DateTime.fromISO(data.results.sunset, { zone: 'UTC' }).setZone('Europe/Zurich'),
        };
    }

    async function updateSunTimes() {
        const position = viewer.scene.camera.positionCartographic;
        const latitude = Cesium.Math.toDegrees(position.latitude);
        const longitude = Cesium.Math.toDegrees(position.longitude);
        const date = dateField.value;

        const { sunrise, sunset } = await fetchSunTimes(latitude, longitude, date);

        const sunriseHour = sunrise.hour + sunrise.minute / 60;
        const sunsetHour = sunset.hour + sunset.minute / 60;

        const buffer = 15 / 60; // Buffer of 15 minutes

        slider.min = (sunriseHour + buffer).toFixed(2);
        slider.max = (sunsetHour - buffer).toFixed(2);

        slider.value = 12;
        updateTimeLabel(12);

        timeInfo.innerHTML = `
            <div>☀️ Sonnenaufgang: ${sunrise.toFormat('HH:mm')} 🌙 Sonnenuntergang: ${sunset.toFormat('HH:mm')}</div>
        `; // Displays sunrise and sunset times
    }

    function updateTimeLabel(value) {
        const hours = Math.floor(value);
        const minutes = Math.floor((value - hours) * 60);
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        label.textContent = timeString;

        const selectedDate = new Date(dateField.value);
        const localDate = new Date(selectedDate);
        localDate.setHours(hours, minutes);

        const julianDate = Cesium.JulianDate.fromDate(localDate);
        viewer.clock.currentTime = julianDate;
    }

    slider.addEventListener('input', () => {
        updateTimeLabel(parseFloat(slider.value));
    });

    dateField.addEventListener('change', () => {
        updateSunTimes();
    });

    viewer.clock.shouldAnimate = false; // Stop the clock from animating
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date()); // Set the clock to the current time
}
