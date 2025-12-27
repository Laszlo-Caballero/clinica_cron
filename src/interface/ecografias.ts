export interface Ecografia {
  id: string;
  idCliente: string;
  nombreCliente: string;
  dniCliente: string;
  edadCliente: string;
  furoperacional: string | null;
  idAtiende: string;
  nombreAtiende: string;
  idecografia: string;
  nombreecografia: string;
  fondoimpresion: string;
  ecografo: string;
  cuerpo: string;
  hagazgos: string | null;
  idVenta: string;
  motivo: string;
  fechaEcografia: string; // ISO datetime
  fechaRegistro: string; // ISO datetime
  estado: string;
  iddetalle: string | null;
  diagnostico: string | null;
  resultadofinal: string | null;
}

export type EcoType =
  | "diagnosticos_y_comentarios"
  | "resumen_hallazgos_comentarios"
  | "resumen_hallazgos"
  | "diagnosticos_comentarios"
  | "diagnosticos"
  | "comentarios"
  | "no_clasificado"
  | "conclusiones"
  | "hallazgos_conclusiones"
  | "error";

export type EcoCountType = {
  id: string;
  htmlContent: string;
  parsedContent: string;
  result: string;
  type: EcoType;
};

const ECO_TYPES: readonly EcoType[] = [
  "diagnosticos_y_comentarios",
  "resumen_hallazgos_comentarios",
  "resumen_hallazgos",
  "diagnosticos_comentarios",
  "diagnosticos",
  "comentarios",
  "no_clasificado",
  "conclusiones",
  "hallazgos_conclusiones",
  "error",
] as const;

export function isEcoType(value: string): value is EcoType {
  return ECO_TYPES.includes(value as EcoType);
}
