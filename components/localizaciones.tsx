"use client";
import { useMemo } from "react";
import { normalizePoint } from "@/components/circuitos";
import { Localizacion, NormalizedDrivers } from "./interfaces";

export function getLocalizaciones({
  locations,
  drivers,
  trackData,
}: Localizacion) {
  const driversMap = new Map(drivers.map((d) => [d.driver_number, d]));

  return locations.map((location) => {
    var normalizedLocation;
    var driver;
    if (location !== undefined) {
      normalizedLocation = normalizePoint(
        location,
        trackData.bounds,
        trackData.width,
        trackData.height,
        trackData.rotationAngle,
        trackData.mirrorY
      );
      driver = driversMap.get(location.driver_number);
    }
    return {
      ...normalizedLocation,
      driver: driver,
    };
  });
}
