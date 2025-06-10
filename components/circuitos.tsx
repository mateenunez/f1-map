import { Track } from "./interfaces";
import { getCircuitoPrecargado } from "./circuitosPrecargados";

function getBounds(points: { x: number; y: number }[]) {
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

export function normalizePoint(
  point: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width = 800,
  height = 600,
  padding = 50
) {
  return {
    normalizedX:
      ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) *
        (width - 2 * padding) +
      padding,
    normalizedY:
      ((point.y - bounds.minY) / (bounds.maxY - bounds.minY)) *
        (height - 2 * padding) +
      padding,
  };
}

function generateTrackPath(
  normalizedPoints: { normalizedX: number; normalizedY: number }[]
) {
  if (normalizedPoints.length === 0) return "";
  let path = `M ${normalizedPoints[0].normalizedX} ${normalizedPoints[0].normalizedY}`;
  for (let i = 1; i < normalizedPoints.length; i++) {
    const p = normalizedPoints[i];
    path += ` L ${p.normalizedX} ${p.normalizedY}`;
  }
  return path;
}

const getSesionVieja = async (circuitName: string) => {
  const res = await fetch(
    `https://api.openf1.org/v1/sessions?circuit_short_name=${circuitName}&year=2024`
  );
  const data = await res.json();
  if (data.length > 0) {
    return data[data.length - 1];
  }
  return null;
};

function filtrarLocalizacionesUnicas(data: any[]) {
  const seen = new Set<string>();
  return data.filter((loc) => {
    const key = `${loc.x},${loc.y},${loc.z}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getLocalizacionesCorredor(old_session_key: string) {
  const res = await fetch(
    `https://api.openf1.org/v1/location?session_key=${old_session_key}&driver_number=1`
  );
  const data = await res.json();
  const localizacionesUnicas = filtrarLocalizacionesUnicas(data);
  return localizacionesUnicas;
}

const createCircuito = async (circuitName: string) => {
  // Obtener sesión vieja
  const sesionVieja = await getSesionVieja(circuitName);
  const old_session_key = sesionVieja ? sesionVieja.session_key : null;
  // Obtener localizaciones de un corredor
  const localizacionesUnicas = await getLocalizacionesCorredor(old_session_key);
  const width = 1000;
  const height = 2400;
  const padding = 0;
  const zoomFactor = 0.5;

  const bounds = getBounds(localizacionesUnicas);
  const normalizedTrack = localizacionesUnicas.map((loc) =>
    normalizePoint(loc, bounds, width, height, padding)
  );
  const trackPath = generateTrackPath(normalizedTrack);

  const viewBox = `${bounds.minX * 0.5} ${bounds.minY * 0.05} ${
    (bounds.maxX - bounds.minX) * zoomFactor
  } ${(bounds.maxY - bounds.minY) * zoomFactor}`;

  const tracks = {
    [circuitName]: {
      viewBox: viewBox,
      path: trackPath,
      bounds: bounds,
      width: width,
      height: height,
      localizacionesUnicas: localizacionesUnicas
    },
  };
  return {
    track: tracks[circuitName],
  };
};

const getCircuito = async (
  circuitName: string
): Promise<{ track: Track}> => {
  var circuito = getCircuitoPrecargado(circuitName);

  if (!circuito) {
    const { track } = await createCircuito(circuitName);
    console.log(track)
    return { track };
  }

  return {
    track: circuito as Track,
  };
};

export { getCircuito };
