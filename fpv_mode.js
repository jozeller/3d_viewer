export function enableFPV(viewer) {
    // FPV-Button erstellen
    const fpvButton = document.createElement('div');
    fpvButton.id = 'fpvButton';
    fpvButton.className = 'action-button';
    fpvButton.textContent = 'FPV';
    document.body.appendChild(fpvButton);

    // Hinweis-Overlay erstellen
    const hintOverlay = document.createElement('div');
    hintOverlay.id = 'hintOverlay';
    hintOverlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
        text-align: center;
    `;
    document.body.appendChild(hintOverlay);

    // Hinweis aktualisieren
    function updateHint(text, showExitButton = false) {
        if (showExitButton) {
            hintOverlay.innerHTML = `
                ${text}<br>
                Verlassen des Standortes mit ESC oder 
                <button id="exitFPV" style="
                    background-color: #ff5722; 
                    color: white; 
                    border: none; 
                    padding: 5px 10px; 
                    border-radius: 3px; 
                    cursor: pointer;">HIER KLICKEN</button>.
            `;
            document.getElementById('exitFPV').addEventListener('click', () => {
                if (isFPVActive) {
                    deactivateFPV();
                }
            });
        } else {
            hintOverlay.textContent = text;
        }
        hintOverlay.style.display = 'block';
    }

    function hideHint() {
        hintOverlay.style.display = 'none';
    }

    // Initialposition und -ausrichtung
    let initialPosition = viewer.camera.position.clone();
    let initialOrientation = viewer.camera.heading;

    const scene = viewer.scene;
    let isFPVActive = false;

    // ScreenSpaceEventHandler für Klick-Events
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    function activateFPV(pickedPosition) {
        const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
        const terrainHeight = scene.globe.getHeight(cartographic) || 0;
    
        const newPosition = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            terrainHeight + 1.8
        );
    
        viewer.camera.flyTo({
            destination: newPosition,
            orientation: {
                heading: viewer.camera.heading,
                pitch: Cesium.Math.toRadians(0),
                roll: 0,
            },
            duration: 1.5,
            complete: () => {
                console.log('Camera moved to FPV position');
                terrainCheckInterval = setInterval(ensureAboveTerrain, 200); // Start terrain check
            },
        });
    
        // Navigationseinschränkungen aktivieren
        Object.assign(scene.screenSpaceCameraController, {
            enableRotate: false, // Kein Rotieren der Kamera
            enableZoom: false,   // Kein Zoomen
            enableTilt: false,   // Kein Neigen
            enableLook: true,    // Mausbewegung für Rundumblick aktivieren
            enableTranslate: false, // Kein Verschieben
        });
    
        freeLookHandler = enableFreeLook(scene, viewer);
        enableDeviceOrientation(viewer);

        isFPVActive = true;
        fpvButton.style.backgroundColor = '#ffd904'; // Aktiver Button
    
        // Hinweis aktualisieren, nachdem der Punkt ausgewählt wurde
        updateHint('Nur Blickrichtung steuerbar', true);
    }
    
    function enableFreeLook(scene, viewer) {
        const sensitivity = 0.005; // Passe die Empfindlichkeit an
        const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    
        // Kamera auf den Horizont ausrichten, wenn FreeLook aktiviert wird
        viewer.camera.setView({
            orientation: {
                heading: viewer.camera.heading, // Beibehaltung der aktuellen Richtung
                pitch: -90, // Blick auf den Horizont
                roll: viewer.camera.roll, // Roll unverändert
            },
        });
    
        // Hinzufügen der Maussteuerung
        handler.setInputAction((movement) => {
            const { startPosition, endPosition } = movement;
            const deltaX = endPosition.x - startPosition.x;
            const deltaY = endPosition.y - startPosition.y;
    
            // Umgekehrte horizontale Bewegung (deltaX)
            const heading = viewer.camera.heading + deltaX * sensitivity; // "+" statt "-"
            const pitch = Cesium.Math.clamp(
                viewer.camera.pitch - deltaY * sensitivity,
                Cesium.Math.toRadians(-90),
                Cesium.Math.toRadians(90)
            );
    
            viewer.camera.setView({
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: viewer.camera.roll,
                },
            });
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
        return handler;
    }
    
    
/*
    let deviceOrientationListener;



    function enableDeviceOrientation(viewer) {
        deviceOrientationListener = (event) => {
            const alpha = Cesium.Math.toRadians(event.alpha || 0); // Rotation um die Z-Achse
            const beta = Cesium.Math.toRadians(event.beta || 0); // Vor-/Rückneigung
            const gamma = Cesium.Math.toRadians(event.gamma || 0); // Seitliche Neigung
    
            const screenOrientation = (window.orientation || 0) * (Math.PI / 180);

            //R.1: Converting deviceorientation angles to a Rotation Matrix representation
function getBaseRotationMatrix( alpha, beta, gamma ) {
    var _x = beta ? beta * degtorad : 0; // beta value
    var _y = gamma ? gamma * degtorad : 0; // gamma value
    var _z = alpha ? alpha * degtorad : 0; // alpha value
    
    var cX = Math.cos( _x );
    var cY = Math.cos( _y );
    var cZ = Math.cos( _z );
    var sX = Math.sin( _x );
    var sY = Math.sin( _y );
    var sZ = Math.sin( _z );
    
    //
    // ZXY-ordered rotation matrix construction.
    //
    
    var m11 = cZ * cY - sZ * sX * sY;
    var m12 = - cX * sZ;
    var m13 = cY * sZ * sX + cZ * sY;
    
    var m21 = cY * sZ + cZ * sX * sY;
    var m22 = cZ * cX;
    var m23 = sZ * sY - cZ * cY * sX;
    
    var m31 = - cX * sY;
    var m32 = sX;
    var m33 = cX * cY;
    
    return [
    m11, m12, m13,
    m21, m22, m23,
    m31, m32, m33
    ];
    };

    //R.2: Fixing our rotation matrix frame relative to the current screen orientation
function getScreenTransformationMatrix( screenOrientation ) {
    var orientationAngle = screenOrientation ? screenOrientation * degtorad : 0;
    
    var cA = Math.cos( orientationAngle );
    var sA = Math.sin( orientationAngle );
    
    // Construct our screen transformation matrix
    var r_s = [
    cA, -sA, 0,
    sA, cA, 0,
    0, 0, 1
    ];
    
    return r_s;
    }

    //R.4: Computing our final rotation matrix representation
function matrixMultiply( a, b ) {
    var final = [];
    
    final[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    final[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    final[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];
    
    final[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    final[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    final[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];
    
    final[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    final[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    final[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];
    
    return final;
    }

//R.3: Fix our rotation matrix frame relative to our application’s world orientation (rotation around x-axis)
function getWorldTransformationMatrix() {
    var x = 90 * degtorad;
    
    var cA = Math.cos( x );
    var sA = Math.sin( x );
    
    // Construct our world transformation matrix
    var r_w = [
    1, 0, 0,
    0, cA, -sA,
    0, sA, cA
    ];
    
    return r_w;
    }

    var degtorad = Math.PI / 180; // Degree-to-Radian conversion

            //Returns a 3 x 3 rotation matrix as an array
function computeMatrix(alpha, beta, gamma, currentScreenOrientation) {
    var rotationMatrix = getBaseRotationMatrix(
    alpha,
    beta,
    gamma
    ); // R
    

    var screenTransform = getScreenTransformationMatrix( currentScreenOrientation ); // r_s
    
    var screenAdjustedMatrix = matrixMultiply( rotationMatrix, screenTransform ); // R_s
    
    var worldTransform = getWorldTransformationMatrix(); // r_w
    
    var finalMatrix = matrixMultiply( screenAdjustedMatrix, worldTransform ); // R_w
    
    return finalMatrix; // [ m11, m12, m13, m21, m22, m23, m31, m32, m33 ]
    }

    
            var matrix = computeMatrix(alpha, beta, gamma, screenOrientation)
            var rotationmatrix = Cesium.Matrix3.fromArray(matrix);
            
            var matrix4 = new Cesium.Matrix4.fromRotationTranslation(rotationmatrix, destination, matrix4);
            
            console.log(matrix4);
            
            viewer.camera.setView({
            endTransform: matrix4
            });
            
            };
    
        // Event-Listener hinzufügen
        window.addEventListener('deviceorientation', deviceOrientationListener);
    }
 */

    let deviceOrientationListener;

    function enableDeviceOrientation(viewer) {
        deviceOrientationListener = (event) => {
            const alpha = Cesium.Math.toRadians(event.alpha || 0); // Drehung um die Z-Achse (Kompass)
            const beta = Cesium.Math.toRadians(event.beta || 0); // Neigung vor/zurück (X-Achse)
            const gamma = Cesium.Math.toRadians(event.gamma || 0); // Seitliche Neigung (Y-Achse)
    
            // Korrektur für aufrecht stehendes Handy
            const screenOrientation = (window.orientation || 0) * (Math.PI / 180); // Portrait/Landscape
            const adjustedAlpha = alpha + screenOrientation; // Kompass um Bildschirm orientieren
            const adjustedBeta = beta - Math.PI / 2; // Beta so anpassen, dass 0° geradeaus ist
    
            // Berechnung des Headings und Pitch
            const heading = Cesium.Math.TWO_PI - adjustedAlpha; // Heading entlang des Horizonts
            const pitch = Cesium.Math.clamp(adjustedBeta, Cesium.Math.toRadians(-90), Cesium.Math.toRadians(90)); // Vertikale Neigung
    
            // Kameraausrichtung setzen
            viewer.camera.setView({
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: 0, // Roll bleibt immer 0
                },
            });
        };
    
        // Event-Listener hinzufügen
        window.addEventListener('deviceorientation', deviceOrientationListener);
    }
    
    // Funktion zum Entfernen des Event-Listeners
    function disableDeviceOrientation() {
        if (deviceOrientationListener) {
            window.removeEventListener('deviceorientation', deviceOrientationListener);
            deviceOrientationListener = null;
        }
    }
    


    

    let freeLookHandler;

    
    function deactivateFPV() {
        if (terrainCheckInterval) {
            clearInterval(terrainCheckInterval); // Stop terrain check
        }
    
        if (freeLookHandler) {
            freeLookHandler.destroy(); // Entfernt den MOUSE_MOVE-Listener
        }

    // DeviceOrientation-Listener entfernen
    if (deviceOrientationListener) {
        window.removeEventListener('deviceorientation', deviceOrientationListener);
        deviceOrientationListener = null; // Setze die Referenz zurück
    }

        const currentCartographic = viewer.camera.positionCartographic;
        const terrainHeight = scene.globe.getHeight(currentCartographic) || 0;
    
        const newHeight = terrainHeight + 10000; // 10.000 Meter über Terrain
        const newPosition = Cesium.Cartesian3.fromRadians(
            currentCartographic.longitude,
            currentCartographic.latitude,
            newHeight
        );
    
        viewer.camera.flyTo({
            destination: newPosition,
            orientation: {
                heading: viewer.camera.heading, // Behalte die aktuelle Blickrichtung
                pitch: Cesium.Math.toRadians(-50), // Nach unten blicken
                roll: 0,
            },
            duration: 1.5,
            complete: () => console.log('Kamera auf 10.000 m Höhe über der aktuellen Position.'),
        });
    
        // Navigationseinstellungen zurücksetzen
        Object.assign(scene.screenSpaceCameraController, {
            enableRotate: true,
            enableZoom: true,
            enableTilt: true,
            enableLook: true,
            enableTranslate: true,
        });
    
        isFPVActive = false;
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK); // Deaktiviert den Klick-Listener
        fpvButton.style.backgroundColor = ''; // Standardfarbe
        hideHint(); // Hinweis ausblenden
    }
    

    function getPositionWithTerrain(scene, clickPosition) {
        let pickedPosition = scene.pickPosition(clickPosition);

        if (!Cesium.defined(pickedPosition)) {
            console.warn('pickPosition fehlgeschlagen, versuche Fallback-Methode.');
            pickedPosition = getFallbackPosition(scene, clickPosition);
        }

        if (!Cesium.defined(pickedPosition)) {
            console.warn('Kein gültiger Punkt gefunden, auch nach Fallback.');
            return null;
        }

        const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
        const terrainHeight = scene.globe.getHeight(cartographic) || 0;

        return Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            terrainHeight + 1.8
        );
    }

    function getFallbackPosition(scene, clickPosition) {
        const ray = viewer.camera.getPickRay(clickPosition);
        const cartesian = scene.globe.pick(ray, scene);
        if (!Cesium.defined(cartesian)) {
            console.warn('Fallback: Keine gültige Position gefunden.');
            return null;
        }

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const terrainHeight = scene.globe.getHeight(cartographic) || 0;
        return Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            terrainHeight + 1.8
        );
    }
    let terrainCheckInterval;

    function ensureAboveTerrain() {
        if (!isFPVActive) return;
    
        const currentCartographic = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        const terrainHeight = scene.globe.getHeight(currentCartographic) || 0;
    
        // Korrigiere Position, falls unter dem Gelände
        if (currentCartographic.height < terrainHeight + 1.8) {
            console.warn('Kamera unter Gelände, korrigiere Position.');
            const correctedPosition = Cesium.Cartesian3.fromRadians(
                currentCartographic.longitude,
                currentCartographic.latitude,
                terrainHeight + 1.8
            );
    
            viewer.camera.setView({
                destination: correctedPosition,
                orientation: {
                    heading: viewer.camera.heading,
                    pitch: viewer.camera.pitch,
                    roll: viewer.camera.roll,
                },
            });
        }
    }


    fpvButton.addEventListener('click', () => {
        if (isFPVActive) {
            console.warn('FPV-Modus ist bereits aktiv.');
            return;
        }

        handler.setInputAction((click) => {
            const adjustedPosition = getPositionWithTerrain(scene, click.position);
            if (adjustedPosition) {
                activateFPV(adjustedPosition);
            } else {
                console.warn('Kein Punkt gefunden oder Fehler bei der Höhenschätzung.');
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        console.log('FPV-Modus aktiviert. Klicken Sie auf die Karte, um einen Punkt auszuwählen.');
        updateHint('First Person View-Standort auf der Karte anklicken.'); // Initialer Hinweis
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isFPVActive) {
            deactivateFPV();
            console.log('FPV-Modus beendet.');
        }
    });
}
