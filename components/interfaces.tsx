interface PositionData {
  x: number;
  y: number;
  driver_number: number;
}

interface Location {
  x: number;
  y: number;
}

interface Session {
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  location: string;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  country_code: string;
}

interface Track {
  path: string;
  viewBox: string;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  width: number;
  height: number;
  localizacionesUnicas: PositionData[];
  rotationAngle: number;
  mirrorY: boolean;
}

interface DriverPosition {
  driver_number: number;
  currentU: number;
  targetU: number;
  lastUpdate: number;
  animationDuration: number;
}

interface Localizacion {
  locations: PositionData[];
  drivers: Driver[];
  trackData: Track;
}

interface NormalizedDrivers {
  driver: Driver | undefined;
  normalizedX: number;
  normalizedY: number;
}

export type {
  PositionData,
  Session,
  Driver,
  Track,
  DriverPosition,
  Localizacion,
  NormalizedDrivers,
  Location,
};
