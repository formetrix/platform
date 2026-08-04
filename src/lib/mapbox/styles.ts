export const MAPBOX_STREET_STYLE = "mapbox://styles/mapbox/streets-v12";
export const MAPBOX_SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export type MapboxBasemapStyle = "street" | "satellite";

export function mapboxStyleUrl(style: MapboxBasemapStyle): string {
  return style === "satellite" ? MAPBOX_SATELLITE_STYLE : MAPBOX_STREET_STYLE;
}
