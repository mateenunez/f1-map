"use client";
import { useMemo } from "react";
import { normalizePoint } from "@/components/circuitos";
import { Localizacion, NormalizedDrivers } from "./interfaces";

export function getLocalizaciones({
  locations,
  drivers,
  trackData,
}: Localizacion): NormalizedDrivers[] {
  const driversMap = new Map(drivers.map((d) => [d.driver_number, d]));

  return locations.map((location) => {
    const normalizedLocation = normalizePoint(
      location,
      trackData.bounds,
      trackData.width,
      trackData.height,
      trackData.rotationAngle,
      trackData.mirrorY
    );
    return {
      ...normalizedLocation,
      driver: driversMap.get(location.driver_number),
    };
  });
}
