// types/leaflet.d.ts
import * as L from "leaflet";

declare module "leaflet" {
  function markerClusterGroup(
    options?: MarkerClusterGroupOptions
  ): MarkerClusterGroup;

  interface MarkerClusterGroupOptions {
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    disableClusteringAtZoom?: number;
    maxClusterRadius?: number | ((zoom: number) => number);
    polygonOptions?: L.PolylineOptions;
    singleMarkerMode?: boolean;
    spiderfyDistanceMultiplier?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon;
    chunkedLoading?: boolean;
  }

  interface MarkerClusterGroup extends L.FeatureGroup {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getChildCount(): number;
  }

  interface MarkerCluster extends L.Marker {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
    getConvexHull(): L.Point[];
  }

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: (L.LatLng | [number, number, number])[]): this;
    addLatLng(latlng: L.LatLng | [number, number, number]): this;
    setOptions(options: HeatMapOptions): this;
    redraw(): this;
  }

  function heatLayer(
    latlngs: (L.LatLng | [number, number, number])[],
    options?: HeatMapOptions
  ): HeatLayer;
}

declare module "leaflet.heat" {
  import * as L from "leaflet";
  export = L;
}

declare module "leaflet.markercluster" {
  import * as L from "leaflet";
  export = L;
}
