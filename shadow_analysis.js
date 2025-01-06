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

    function enableShadows() {
        viewer.shadows = true;
        viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.shadowMap.maximumDistance = 50000;
        viewer.scene.shadowMap.size = 8000;
        viewer.scene.shadowMap.softShadows = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
    }

    function disableShadows() {
        viewer.shadows = false;
        viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
        viewer.scene.globe.enableLighting = false;
    }

    let shadowsActive = false;

    shadowButton.addEventListener('click', () => {
        const isVisible = sliderContainer.style.display === 'block';

        if (isVisible) {
            sliderContainer.style.display = 'none';
            disableShadows();
            shadowsActive = false;
            shadowButton.style.backgroundColor = '#383838';
        } else {
            sliderContainer.style.display = 'block';
            enableShadows();
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

        const buffer = 15 / 60;

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
