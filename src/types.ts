/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TipoIdentificacion = 
  | "Cédula de ciudadanía"
  | "Cédula de extranjería"
  | "Pasaporte"
  | "Permiso Especial";

export type TipoLicencia =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "B3"
  | "C1"
  | "C2"
  | "C3";

export interface UserRegistration {
  tipoIdentificacion: TipoIdentificacion | "";
  numeroIdentificacion: string;
  nombreCompleto: string;
  edad: number | "";
  empresa: string;
  antiguedad: number | "";
  tipoLicencia: TipoLicencia | "";
}

export interface LikertOption {
  value: number; // 1 to 5
  label: string;
}

export interface LikertQuestion {
  id: number;
  question: string;
  block: "fatiga" | "psicosocial";
}

export interface BlockScore {
  score: number; // 15 to 75
  nivel: string;
  interpretacion: string;
}

export interface EvaluationResult {
  registration: UserRegistration;
  fatiga: BlockScore;
  psicosocial: BlockScore;
  respuestasFatiga: Record<number, number>; // questionId -> 1..5
  respuestasPsicosocial: Record<number, number>; // questionId -> 1..5
  tiempoEmpleado: string;
  fecha?: string;
  hora?: string;
}

export interface SyncStatus {
  status: "idle" | "syncing" | "success" | "error";
  message?: string;
  savedLocal?: boolean;
}
