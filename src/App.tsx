/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Loader2 } from "lucide-react";
import Header from "./components/Header";
import RegistrationForm from "./components/RegistrationForm";
import BlockInstructionsCard from "./components/BlockInstructionsCard";
import BlockExamSession from "./components/BlockExamSession";
import FinalSuccessCard from "./components/FinalSuccessCard";

import { UserRegistration, BlockScore, SyncStatus } from "./types";
import {
  FATIGA_QUESTIONS,
  PSICOSOCIAL_QUESTIONS,
  calculateFatigaResult,
  calculatePsicosocialResult,
} from "./data/questions";

type Step =
  | "registration"
  | "fatiga_instructions"
  | "fatiga_exam"
  | "psicosocial_instructions"
  | "psicosocial_exam"
  | "submitting"
  | "final_success";

export default function App() {
  const [step, setStep] = useState<Step>("registration");
  const [registration, setRegistration] = useState<UserRegistration | null>(null);

  const [fatigaAnswers, setFatigaAnswers] = useState<Record<number, number>>({});
  const [fatigaResult, setFatigaResult] = useState<BlockScore | null>(null);

  const [psicosocialAnswers, setPsicosocialAnswers] = useState<Record<number, number>>({});
  const [psicosocialResult, setPsicosocialResult] = useState<BlockScore | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<string>("00:00");
  const [error, setError] = useState<string | null>(null);

  // Helper to format elapsed time as MM:SS
  const calculateElapsedTime = (startMs: number): string => {
    const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Registration Form Submitted
  const handleRegistrationSubmit = (data: UserRegistration) => {
    setRegistration(data);
    setStartTime(Date.now());
    setError(null);
    setStep("fatiga_instructions");
  };

  // Step 2: Fatiga Instructions -> Start Exam
  const handleStartFatiga = () => {
    setStep("fatiga_exam");
  };

  // Step 3: Fatiga Exam Complete
  const handleFatigaComplete = (answers: Record<number, number>) => {
    setFatigaAnswers(answers);
    const result = calculateFatigaResult(answers);
    setFatigaResult(result);
    setStep("psicosocial_instructions");
  };

  // Step 4: Psicosocial Instructions -> Start Exam
  const handleStartPsicosocial = () => {
    setStep("psicosocial_exam");
  };

  // Step 5: Psicosocial Exam Complete -> Submit
  const handlePsicosocialComplete = async (answers: Record<number, number>) => {
    setPsicosocialAnswers(answers);
    const result = calculatePsicosocialResult(answers);
    setPsicosocialResult(result);

    const elapsed = startTime ? calculateElapsedTime(startTime) : "00:00";
    setTimeSpent(elapsed);

    setStep("submitting");

    // Calculate final scores
    const fRes = fatigaResult || calculateFatigaResult(fatigaAnswers);
    const pRes = result;

    // Format answer summaries
    const fAnswers = fatigaAnswers || {};
    const pAnswers = answers || {};

    const formatSummary = (map: Record<number, number>) => {
      const parts: string[] = [];
      for (let i = 1; i <= 15; i++) {
        parts.push(`P${i}: ${map[i] ?? "-"}`);
      }
      return parts.join(", ");
    };

    const fQuestionsObj: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) {
      fQuestionsObj[`f${i}`] = fAnswers[i] ?? 0;
    }

    const pQuestionsObj: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) {
      pQuestionsObj[`p${i}`] = pAnswers[i] ?? 0;
    }

    const payload = {
      tipoIdentificacion: registration?.tipoIdentificacion || "",
      numeroIdentificacion: registration?.numeroIdentificacion || "",
      nombreCompleto: registration?.nombreCompleto || "",
      edad: registration?.edad || "",
      empresa: registration?.empresa || "",
      antiguedad: registration?.antiguedad || "",
      tipoLicencia: registration?.tipoLicencia || "",
      fatigaScore: fRes.score,
      fatigaNivel: fRes.nivel,
      fatigaInterpretacion: fRes.interpretacion,
      psicosocialScore: pRes.score,
      psicosocialNivel: pRes.nivel,
      psicosocialInterpretacion: pRes.interpretacion,
      tiempoEmpleado: elapsed,
      fecha: new Date().toLocaleDateString("es-CO"),
      hora: new Date().toLocaleTimeString("es-CO"),
      respuestasFatiga: formatSummary(fAnswers),
      respuestasPsicosocial: formatSummary(pAnswers),
      fatigaAnswers: fAnswers,
      psicosocialAnswers: pAnswers,
      ...fQuestionsObj,
      ...pQuestionsObj,
    };

    let syncResult: { status: "success" | "error"; message: string } = {
      status: "error",
      message: "No se pudo conectar con el servidor de Google Sheets tras varios reintentos.",
    };

    // Client-side retry mechanism with exponential backoff (up to 3 retries: 1s, 2s, 4s)
    let attempt = 0;
    const maxRetries = 3;
    let delayMs = 1000;

    while (attempt <= maxRetries) {
      if (attempt > 0) {
        console.log(`[CLIENT] Reintento de sincronización ${attempt}/${maxRetries} en ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Retraso exponencial
      }

      try {
        const response = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const resData = await response.json().catch(() => null);

        if (response.ok && resData?.success !== false) {
          syncResult = {
            status: "success",
            message: resData?.message || "Resultados guardados y sincronizados en Google Sheets.",
          };
          break; // Éxito, salir del bucle de reintentos
        } else if (resData?.message) {
          syncResult = {
            status: "error",
            message: resData.message,
          };
        }
      } catch (err) {
        console.warn(`[CLIENT] Error en intento ${attempt + 1} de sincronización:`, err);
      }

      attempt++;
    }

    setSyncStatus(syncResult);

    // Small delay for smooth transition
    setTimeout(() => {
      setStep("final_success");
    }, 600);
  };

  // Reset evaluation state for next driver
  const handleRestart = () => {
    setRegistration(null);
    setFatigaAnswers({});
    setFatigaResult(null);
    setPsicosocialAnswers({});
    setPsicosocialResult(null);
    setSyncStatus(null);
    setStartTime(null);
    setTimeSpent("00:00");
    setError(null);
    setStep("registration");
  };

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-800 p-0 sm:p-4 print:p-0 print:bg-white">
      {/* Smartphone Device Frame Container */}
      <div className="w-full max-w-md sm:max-w-[440px] min-h-screen sm:min-h-[820px] sm:max-h-[920px] sm:my-auto sm:rounded-[44px] sm:border-[8px] sm:border-slate-800/90 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] bg-slate-50 flex flex-col relative overflow-hidden transition-all print:border-none print:shadow-none print:m-0 print:max-w-none print:rounded-none print:bg-white print:h-auto print:max-h-none">
        
        {/* Co-Branded Header */}
        <Header />

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 text-rose-800 px-4 py-2.5 text-xs flex items-center gap-2 font-medium shrink-0 print:hidden">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Mobile App Scrollable Body */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === "registration" && (
              <motion.div
                key="registration-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-3 my-auto"
              >
                <div className="text-center pt-1 pb-1">
                  <span className="inline-block px-3 py-1 bg-blue-100/80 text-blue-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-1.5">
                    Evaluación de Conductores - Fatiga y Psicosocial
                  </span>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-snug">
                    Evaluación
                  </h1>
                </div>

                <RegistrationForm onSubmit={handleRegistrationSubmit} />
              </motion.div>
            )}

            {step === "fatiga_instructions" && (
              <motion.div key="fatiga-instructions-step" className="w-full my-auto">
                <BlockInstructionsCard block="fatiga" onStart={handleStartFatiga} />
              </motion.div>
            )}

            {step === "fatiga_exam" && (
              <motion.div key="fatiga-exam-step" className="w-full my-auto">
                <BlockExamSession
                  blockTitle="Bloque 1: Evaluación de Fatiga"
                  blockType="fatiga"
                  questions={FATIGA_QUESTIONS}
                  initialAnswers={fatigaAnswers}
                  onComplete={handleFatigaComplete}
                />
              </motion.div>
            )}

            {step === "psicosocial_instructions" && (
              <motion.div key="psicosocial-instructions-step" className="w-full my-auto">
                <BlockInstructionsCard block="psicosocial" onStart={handleStartPsicosocial} />
              </motion.div>
            )}

            {step === "psicosocial_exam" && (
              <motion.div key="psicosocial-exam-step" className="w-full my-auto">
                <BlockExamSession
                  blockTitle="Bloque 2: Psicosocial"
                  blockType="psicosocial"
                  questions={PSICOSOCIAL_QUESTIONS}
                  initialAnswers={psicosocialAnswers}
                  onComplete={handlePsicosocialComplete}
                />
              </motion.div>
            )}

            {step === "submitting" && (
              <motion.div
                key="submitting-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 text-center w-full flex flex-col items-center justify-center my-auto min-h-[320px] shadow-sm border border-slate-100"
              >
                <div className="relative flex items-center justify-center mb-5">
                  <div className="w-14 h-14 border-4 border-slate-100 rounded-full" />
                  <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute" />
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Procesando respuestas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sincronizando información en el sistema...
                </p>
              </motion.div>
            )}

            {step === "final_success" && (
              <motion.div key="final-success-step" className="w-full my-auto">
                <FinalSuccessCard
                  registration={registration}
                  syncStatus={syncStatus}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
