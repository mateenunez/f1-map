"use client";
import { useEffect, useState, useRef } from "react";
import { getCircuito } from "@/components/circuitos";
import {
  Driver,
  DriverPosition,
  Location,
  NormalizedDrivers,
  PositionData,
  Session,
  Track,
} from "../components/interfaces";
import { getLocalizaciones } from "@/components/localizaciones";
import { Motion, spring } from "react-motion";
import { Anta } from "next/font/google";

const regularAnta = Anta({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  const [locations, setLocations] = useState<PositionData[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [trackData, setTrackData] = useState<Track>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [normalizedDrivers, setNormalizedDrivers] = useState<
    NormalizedDrivers[]
  >([]);
  const [localizacionesUnicas, setLocalizacionesUnicas] = useState<Location[]>(
    []
  );
  const [auxLocations, setAuxLocations] = useState<PositionData[][]>();

  const mockIndexRef = useRef(0);
  const auxIndexRef = useRef(0);

  function createAuxLocations(
    n: number,
    currentLocation: PositionData,
    nextLocation: PositionData,
    localizacionesUnicas: { x: number; y: number }[]
  ) {
    const currentIdx = localizacionesUnicas.findIndex(
      (p) => p.x === currentLocation.x && p.y === currentLocation.y
    );
    const nextIdx = localizacionesUnicas.findIndex(
      (p) => p.x === nextLocation.x && p.y === nextLocation.y
    );

    if (currentIdx === -1 || nextIdx === -1) return [];

    let pathPoints;
    if (currentIdx <= nextIdx) {
      pathPoints = localizacionesUnicas.slice(currentIdx, nextIdx + 1);
    } else {
      pathPoints = [
        ...localizacionesUnicas.slice(currentIdx),
        ...localizacionesUnicas.slice(0, nextIdx + 1),
      ];
    }

    const auxLocations: PositionData[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor((i / (n - 1)) * (pathPoints.length - 1));
      const point = pathPoints[idx];
      auxLocations.push({
        x: point.x,
        y: point.y,
        driver_number: currentLocation.driver_number,
      });
    }
    return auxLocations;
  }

  async function fetchSession() {
    const sessionResponse = await fetch(
      "https://api.openf1.org/v1/sessions?session_key=latest"
    );
    if (!sessionResponse.ok) {
      throw new Error(`Session API error: ${sessionResponse.status}`);
    }
    const sessions = await sessionResponse.json();
    const latestSession = sessions[sessions.length - 1];
    if (latestSession) {
      setSession(latestSession);
    }
  }

  async function fetchDrivers() {
    if (session) {
      var newDrivers = await fetch(
        `https://api.openf1.org/v1/drivers?session_key=latest`
      );
      var driversData = await newDrivers.json();
      if (driversData && Array.isArray(driversData)) {
        setDrivers(driversData.filter((driver) => driver.team_colour != null));
      } else setDrivers([]);
    }
  }

  async function fetchCords(n: number = 20) {
    if (session) {
      const url = `https://api.openf1.org/v1/location?session_key=latest&date>=${new Date(
        new Date().getTime() - 10 * 1000
      ).toISOString()}`;
      const res = await fetch(url);
      var data = await res.json();

      if (data.length > 0) {
        const uniquePositions = new Array();
        const seen = new Set<number>();

        for (let i = data.slice(-50).length - 1; i >= 0; i--) {
          var car = data[i];
          if (!seen.has(car.driver_number)) {
            uniquePositions.push(car);
            seen.add(car.driver_number);
          }
        }

        const auxLocationList: PositionData[][] = drivers.map((driver) => {
          const nextLocation = uniquePositions.find(
            (l) => l.driver_number === driver.driver_number
          );
          const currentLocation = locations.findLast(
            (l) => l.driver_number === driver.driver_number
          );
          if (currentLocation && nextLocation) {
            return createAuxLocations(
              n,
              currentLocation,
              nextLocation,
              localizacionesUnicas
            );
          }
          return [];
        });

        setAuxLocations(auxLocationList);

        setLocations(uniquePositions.reverse());
      }
    }
  }

  function fetchMockCords() {
    if (localizacionesUnicas && localizacionesUnicas.length > 0) {
      if (localizacionesUnicas.length > 0) {
        setIsEmpty(false);

        mockIndexRef.current =
          (mockIndexRef.current + 50) % localizacionesUnicas.length;

        const mockData: PositionData[] = new Array();

        // Todos los corredores 
        // for (let index = 0; index < drivers.length; index++) {
        //   mockData.push({
        //   driver_number: drivers[index].driver_number,
        //   x: localizacionesUnicas[mockIndexRef.current - 30 + index].x,
        //   y: localizacionesUnicas[mockIndexRef.current - 30 + index].y,
        // });
        // }

        // Uso a Verstappen como sujeto de prueba
        mockData.push({
          driver_number: 1,
          x: localizacionesUnicas[mockIndexRef.current - 50].x,
          y: localizacionesUnicas[mockIndexRef.current - 50].y,
        });

        // Una vez tenemos los datos para cada corredor, generamos la lista de PositionData auxiliares para cada uno

        const auxLocationList: PositionData[][] = drivers.map((driver) => {
          const nextPoint = localizacionesUnicas[mockIndexRef.current];
          const nextLocation: PositionData = {
            driver_number: driver.driver_number,
            x: nextPoint.x,
            y: nextPoint.y,
          };
          const currentLocation = mockData.findLast(
            (l) => l.driver_number === driver.driver_number
          );
          if (currentLocation && nextLocation) {
            return createAuxLocations(
              20,
              currentLocation,
              nextLocation,
              localizacionesUnicas
            );
          }

          return [];
        });

        setAuxLocations(auxLocationList);
      }
    }
  }

  async function fetchStartCords() {
    var data: PositionData[] = new Array();

    for (let index = 0; index < drivers.length; index++) {
      const d = drivers[index];
      const start = localizacionesUnicas[0] || { x: 0, y: 0 };
      data.push({ x: start.x, y: start.y, driver_number: d.driver_number });
    }

    if (data.length > 0) {
      setIsEmpty(false);
      const uniquePositions: PositionData[] = new Array();
      const seen = new Set<number>();

      for (let i = data.slice(-100).length - 1; i >= 0; i--) {
        var car = data[i];
        if (!seen.has(car.driver_number)) {
          uniquePositions.push(car);
          seen.add(car.driver_number);
        }
      }
      setLocations(uniquePositions.reverse());
    }
  }

  // Fetch de session
  useEffect(() => {
    fetchSession();
  }, []);

  // Fetch de drivers
  useEffect(() => {
    if (session) {
      fetchDrivers();
    }
  }, [session]);

  // Obtención de localizaciones normalizadas
  useEffect(() => {
    if (locations && drivers && trackData) {
      const normalizedDrivers = getLocalizaciones({
        locations,
        drivers,
        trackData,
      });
      setNormalizedDrivers(normalizedDrivers);
    }
  }, [locations]);

  // Fetch de coordenadas iniciales
  useEffect(() => {
    if (drivers && session && localizacionesUnicas.length > 0) {
      fetchStartCords();
    }
  }, [drivers, localizacionesUnicas]);

  // Fetch protocolar de localizaciones
  useEffect(() => {
    if (session && drivers && trackData) {
      const generalFetch = async () => {
        await fetchCords();
        //fetchMockCords(); // Eliminar en producción
      };
      generalFetch();
      const interval = setInterval(generalFetch, 10 * 1000);
      return () => clearInterval(interval);
    }
  }, [session, drivers, trackData]);

  // Cargar circuito y localizaciones únicas
  useEffect(() => {
    if (session && drivers) {
      const getCircuitoAsync = async () => {
        const { track } = await getCircuito(session.circuit_short_name);
        if (track) {
          setTrackData(track);
          setLocalizacionesUnicas(track.localizacionesUnicas); // <-- aquí guardas las localizaciones únicas
        }
      };
      getCircuitoAsync();
    }
  }, [session, drivers]);

  // Animación de posiciones auxiliares
  useEffect(() => {
    if (trackData && drivers && auxLocations) {
      auxIndexRef.current = 0; // Reinicia el índice cuando cambian las auxLocations

      const interval = setInterval(() => {
        // Avanza el índice, pero no más allá del último punto auxiliar
        if (
          auxLocations.length > 0 &&
          auxIndexRef.current < auxLocations[0].length - 1
        ) {
          auxIndexRef.current = auxIndexRef.current + 1;
        }

        const nextAuxLocations = new Array<PositionData>();

        for (let i = 0; i < auxLocations.length; i++) {
          const iDriver = auxLocations[i];
          const nextLocation = iDriver[auxIndexRef.current];
          nextAuxLocations.push(nextLocation);
        }

        // Filtra solo los valores definidos (por ahora solo Verstappen)
        const filteredAuxLocations = nextAuxLocations.filter(Boolean);

        // Normaliza las posiciones auxiliares actuales
        const normalizedDrivers = getLocalizaciones({
          locations: filteredAuxLocations,
          drivers,
          trackData,
        });

        setNormalizedDrivers(normalizedDrivers);
      }, 0.5 * 1000);

      return () => clearInterval(interval);
    }
  }, [auxLocations]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-h-full px-2">
        {trackData ? (
          <svg
            viewBox={trackData.viewBox}
            className="w-full h-auto border-none p-3"
            aria-label="Mapa de circuito de Fórmula 1 en tiempo real"
          >
            {/* Pista principal */}
            <path
              d={trackData.path}
              stroke="white"
              opacity={0.35}
              fill="none"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Renderizar corredores usando las posiciones animadas */}
            {normalizedDrivers.map((item) => (
              <Motion
                key={item.driver?.driver_number || 0 + auxIndexRef.current}
                defaultStyle={{
                  x: item.normalizedX,
                  y: item.normalizedY,
                }}
                style={{
                  x: spring(item.normalizedX, { stiffness: 30, damping: 10 }),
                  y: spring(item.normalizedY, { stiffness: 30, damping: 10 }),
                }}
              >
                {({ x, y }) => (
                  <g className="transition-all duration-300 eas-in-out" >
                    {/* Glow effect */}
                    <circle cx={x} cy={y} r="20" fill="url(#carGlow)" />
                    {/* Coche */}
                    <circle
                      cx={x}
                      cy={y}
                      r="20"
                      fill={`#${item.driver?.team_colour || "3B82F6"}`}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="drop-shadow-lg"
                    />
                    {/* Nombre o acrónimo */}
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      fontSize="30"
                      fill="#fff"
                      style={{ pointerEvents: "none" }}
                    >
                      {item.driver?.name_acronym}
                    </text>
                  </g>
                )}
              </Motion>
            ))}
          </svg>
        ) : (
          <h1
            className="text-center text-gray-200 mb-4"
            style={regularAnta.style}
          >
            Mapa de Fórmula 1
          </h1>
        )}
      </div>
      <h1 className="sr-only">Mapa de Fórmula 1 en Tiempo Real</h1>
      <p className="text-center text-gray-200 mb-4 sr-only">
        Mapa gratuito y en tiempo real de Fórmula 1. Puedes incrustarlo en tu
        web con un simple iframe.
      </p>
    </div>
  );
}
