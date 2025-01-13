// Default layer configuration
export const defaultLayer = {
    name: "Standard Cesium Imagery",
    category: "Basiskarten",
    order: 9999, // Highest order, so it stays behind
    provider: null,
    active: false,
    opacity: 1,
    viewerLayer: null
};

// Configuration of all layers
export const layersConfig = [
    defaultLayer, // Default imagery as base
    {
        name: "swisstopo Luftbild",
        category: "Basiskarten",
        order: 99,
        provider: new Cesium.WebMapServiceImageryProvider({
            url: 'https://wms.geo.admin.ch/',
            layers: 'ch.swisstopo.swissimage',
            parameters: {
                format: 'image/png',
                transparent: true
            }
        }),
        active: false,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "swisstopo Landeskarte Winter",
        category: "Basiskarten",
        order: 98,
        provider: new Cesium.WebMapServiceImageryProvider({
            url: 'https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities',
            layers: 'ch.swisstopo.pixelkarte-farbe-winter',
            parameters: {
                format: 'image/png',
                tiled: false
            }
        }),
        active: true,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "Hangneigung über 30°",
        category: "Analyse",
        order: 3,
        provider: new Cesium.WebMapServiceImageryProvider({
            url: 'https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities',
            layers: 'ch.swisstopo.hangneigung-ueber_30',
            parameters: {
                format: 'image/png'
            }
        }),
        active: true,
        opacity: 0.5,
        viewerLayer: null
    },
    {
        name: "swisstopo Skitouren",
        category: "Analyse",
        order: 2,
        provider: new Cesium.WebMapServiceImageryProvider({
            url: 'https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities',
            layers: 'ch.swisstopo-karto.skitouren',
            parameters: {
                format: 'image/png'
            }
        }),
        active: true,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "Avalanche Map (ATHM)",
        category: "Gefahrenkarten",
        order: 5,
        provider: new Cesium.UrlTemplateImageryProvider({
            url: "https://map.skitourenguru.ch/AP_SG_ATHM.tms?x={x}&y={y}&z={z}",
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 17,
            tileWidth: 256,
            tileHeight: 256
        }),
        active: false,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "SLF Terrain Classification",
        category: "Analyse",
        order: 6,
        provider: new Cesium.WebMapTileServiceImageryProvider({
            url: "https://map.slf.ch/public/mapcache/wmts?",
            layer: "ch.slf.terrainclassification-hom",
            style: "default",
            format: "image/png",
            tileMatrixSetID: "GoogleMapsCompatible",
            maximumLevel: 18
        }),
        active: false,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "EXOLAB Snowheight",
        category: "Analyse",
        order: 7,
        provider: new Cesium.UrlTemplateImageryProvider({
            url: "https://p20.cosmos-project.ch/BfOlLXvmGpviW0YojaYiRqsT9NHEYdn88fpHZlr_map/gmaps/sd20alps@epsg3857/{z}/{x}/{y}.png",
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 18,
            tileWidth: 256,
            tileHeight: 256
        }),
        active: false,
        opacity: 1,
        viewerLayer: null
    },
    {
        name: "Lawinenunfälle (KML)",
        category: "Gefahrenkarten",
        order: 8,
        provider: function () {
            return Cesium.KmlDataSource.load("accidents_season_all_de.kml", {
                clampToGround: true
            });
        },
        active: false,
        viewerLayer: null
    }
];