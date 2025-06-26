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

function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleDegrees: number
) {
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function normalizePoint(
  point: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width = 800,
  height = 600,
  rotationAngle = 0,
  mirrorY = true
) {
  // Centro del circuito para rotar
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  // Aplica rotación si es necesario
  const rotated =
    rotationAngle !== 0 ? rotatePoint(point, center, rotationAngle) : point;

  let normalizedX =
    ((rotated.x - bounds.minX) / (bounds.maxX - bounds.minX)) * width;
  let normalizedY =
    ((rotated.y - bounds.minY) / (bounds.maxY - bounds.minY)) * height;

  // Espejar en Y si se pide
  if (mirrorY) {
    normalizedY = height - normalizedY;
  }

  return { normalizedX, normalizedY };
}

function generateTrackPath(
  normalizedPoints: { normalizedX: number; normalizedY: number }[]
) {
  if (!normalizedPoints || normalizedPoints.length === 0) return "";

  let path = `M ${normalizedPoints[0].normalizedX} ${normalizedPoints[0].normalizedY}`;
  for (let i = 1; i < normalizedPoints.length; i++) {
    const p = normalizedPoints[i];
    if (p && p.normalizedX != null && p.normalizedY != null) {
      path += ` L ${p.normalizedX} ${p.normalizedY}`;
    }
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

async function getLocalizacionesCorredor(old_session_key: string, old_session_date_start: Date) {
  const res = await fetch(
    `https://api.openf1.org/v1/location?session_key=${old_session_key}&driver_number=1&date<=${new Date(new Date(old_session_date_start).getTime() + 0.5 * 60000).toISOString()}`
  );
  const data = await res.json();
  const localizacionesUnicas = filtrarLocalizacionesUnicas(data);
  return localizacionesUnicas;
}

const createCircuito = async (circuitName: string) => {
  // Obtener sesión vieja
  const sesionVieja = await getSesionVieja(circuitName);
  const old_session_key = sesionVieja ? sesionVieja.session_key : null;
  const old_session_date_start = sesionVieja ? sesionVieja.date_start : null;
  // Obtener localizaciones de un corredor
  const localizacionesUnicas = await getLocalizacionesCorredor(old_session_key, old_session_date_start);

  const bounds = getBounds(localizacionesUnicas);

  // DATOS HARDCODEADOS DEL CIRCUITO
  const width = 500;
  const height = 1000;
  const zoomFactor = 0.9;
  const rotationAngle = -100;
  const mirrorY = true;


  const normalizedTrack = localizacionesUnicas.map((loc) =>
    normalizePoint(loc, bounds, width, height, rotationAngle, mirrorY)
  );
  const trackPath = generateTrackPath(normalizedTrack);

  const viewBox = `${bounds.minX * 0.105} ${0} ${
    (bounds.maxX - bounds.minX) * zoomFactor
  } ${(bounds.maxY - bounds.minY) * zoomFactor}`;

  const tracks = {
    [circuitName]: {
      viewBox: viewBox,
      path: trackPath,
      bounds: bounds,
      width: width,
      height: height,
      localizacionesUnicas: localizacionesUnicas,
      rotationAngle: rotationAngle,
      mirrorY: mirrorY,
    },
  };
  return {
    track: tracks[circuitName],
  };
};

const getCircuito = async (circuitName: string): Promise<{ track: Track }> => {
  var circuito = getCircuitoPrecargado(circuitName);

  if (!circuito) {
    const { track } = await createCircuito(circuitName);
    return { track };
  }

  return {
    track: circuito as Track,
  };
};

export { getCircuito };
