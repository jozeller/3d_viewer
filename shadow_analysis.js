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
    const minimumHeightAboveTerrain = 1500; // Minimum height above terrain in meters

    let moveEndListenerFunction;

    function cameraMoveEndHandler(viewer) {
        const cameraPosition = viewer.scene.camera.positionCartographic;
        const terrainHeight = viewer.scene.globe.getHeight(cameraPosition) || 0;
        const currentHeightAboveTerrain = cameraPosition.height - terrainHeight;

        if (currentHeightAboveTerrain < minimumHeightAboveTerrain) {
            const newHeight = terrainHeight + minimumHeightAboveTerrain;

            viewer.scene.camera.flyTo({
                destination: Cesium.Cartesian3.fromRadians(
                    cameraPosition.longitude,
                    cameraPosition.latitude,
                    newHeight
                ),
                orientation: {
                    pitch: Cesium.Math.toRadians(-40)
                },
                duration: 0.5,
                easingFunction: Cesium.EasingFunction.EXPONENTIAL_IN_OUT,
            });

            console.log(`Camera adjusted to maintain a minimum height of ${minimumHeightAboveTerrain} meters.`);
        }
    }
    async function enableShadows() {
        // Switch to Cesium World Terrain for better shadow calculations
        viewer.terrainProvider = Cesium.createWorldTerrain({
            requestVertexNormals: true, // Needed for accurate shadow calculations
        });

        // Enable shadows and terrain lighting
        viewer.shadows = true;
        viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.shadowMap.maximumDistance = 20000000; // Increase shadow map range
        viewer.scene.shadowMap.size = 2048; // Increase shadow resolution
        viewer.scene.shadowMap.softShadows = false; // Enable soft shadows
        viewer.scene.shadowMap.darkness = 0.6; // Reduce shadow darkness
        viewer.scene.globe.preloadSiblings = true; // Load neighboring tiles
        //viewer.scene.globe.preloadAncestors = true; // Load parent tiles for better accuracy

        console.log("Shadows enabled and terrain switched to Cesium World Terrain.");

        moveEndListenerFunction = cameraMoveEndHandler.bind(null, viewer);
        viewer.camera.moveEnd.addEventListener(moveEndListenerFunction);

    }

    async function disableShadows() {
        // Disable shadows and terrain lighting
        viewer.shadows = false;
        viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
        viewer.scene.globe.enableLighting = false;

        if (moveEndListenerFunction) {
            viewer.camera.moveEnd.removeEventListener(moveEndListenerFunction);
            moveEndListenerFunction = null;
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
        );
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
        `;
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

    viewer.clock.shouldAnimate = false;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
}
