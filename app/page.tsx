"use client";
import { useEffect, useState } from "react";
import { getCircuito } from "@/components/circuitos";

interface PositionData {
  x: number;
  y: number;
  driver_number: number;
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
}

export default function Home() {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [trackData, setTrackData] = useState<Track>();
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  function createLinearizer(pathElement: any, numSamples = 100) {
    const totalLength = pathElement.getTotalLength();
    const samples = new Array();

    for (let i = 0; i < numSamples; i++) {
      const u = i / (numSamples - 1);
      const length = u * totalLength;
      const point = pathElement.getPointAtLength(length);
      samples.push({ u, x: point.x, y: point.y });
    }

    // Función que convierte (x, y) en u
    return (x: number, y: number) => {
      let minDistSq = Infinity;
      let bestU = 0;

      for (const sample of samples) {
        const dx = sample.x - x;
        const dy = sample.y - y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
          minDistSq = distSq;
          bestU = sample.u;
        }
      }

      return bestU;
    };
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
    console.log(latestSession);
    if (latestSession) {
      setSession(latestSession);
    }
  }

 async function fetchDrivers() {
    if (session) {
      var newDrivers = await fetch(
        `https://api.openf1.org/v1/drivers?session_key=${session.session_key}`
      );
      var driversData = await newDrivers.json();
      if (driversData && Array.isArray(driversData)) {
        setDrivers(driversData);
      } else setDrivers([]);
    }
  }

  async function fetchCords() {
    if (session) {
      const url = `https://api.openf1.org/v1/location?session_key=${session?.session_key}&date>${new Date(new Date().getTime() - 5 * 1000).toISOString()}&date<${new Date().toISOString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.length>0){
        setIsEmpty(false)
      }
      const uniquePositions = [];
      const seen = new Set<number>();
      for (let i = data.slice(-100).length - 1; i >= 0; i--) {
      var car = data[i];
      if (!seen.has(car.driver_number)) {
        uniquePositions.push(car);
        seen.add(car.driver_number);
      }
    }
      setPositions(uniquePositions.reverse());
      console.log(uniquePositions.reverse(), data)
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(()=>{
    if (session){
      fetchDrivers()
    }
  }, [session])

  useEffect(() => {
    if (session && drivers) {
      const track = getCircuito(session.circuit_short_name);
      if (track) {
        setTrackData(track);
        const generalFetch = async () => {
          await fetchCords();
          setLastUpdate(new Date());
        };
        generalFetch();
          const interval = setInterval(generalFetch, 20 * 1000); // Cada 20 segundos.
          return () => clearInterval(interval);
      }
    }
  }, [session, drivers]);


  return (
<div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl px-2">
      {isEmpty ? <h1> No se está corriendo una carrera. </h1> : <></>}
      {trackData ? (
        <svg viewBox={trackData.viewBox} className="w-full h-auto border-none p-3">
          {/* Pista principal */}
          <path d={trackData.path} stroke="black" fill="none" strokeWidth="3" />

          {
          
          
          positions.map((car) => {

            const pathElement = document.querySelector("path");
            let p = { x: 0, y: 0 };

            if (pathElement) {
              const linearize = createLinearizer(pathElement);
              const totalLength = pathElement.getTotalLength();

              const u = linearize(car.x, car.y);
              const point = pathElement.getPointAtLength(u * totalLength);

              p = point;
            }

            const driver = drivers.find(d => d.driver_number === car.driver_number)

            return (
              <g
                key={car.driver_number+car.x}
                transform={`translate(${p.x},${p.y})`}
                className="transition-all duration-200"
              >
                <circle r="3" fill={`#${driver?.team_colour}`} />
                <text y="" textAnchor="start" fontSize="10" fill={`#${driver?.team_colour}`} className="text-md font-bold">
                  {driver?.name_acronym}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <h1> Cargando circuito...</h1>
      )}
    </div>
</div>
  );
}
