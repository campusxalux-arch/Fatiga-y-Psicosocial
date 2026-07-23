/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Brain, Moon, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { FATIGA_SCALE_OPTIONS, PSICOSOCIAL_SCALE_OPTIONS } from "../data/questions";

interface BlockInstructionsCardProps {
  block: "fatiga" | "psicosocial";
  onStart: () => void;
}

export default function BlockInstructionsCard({ block, onStart }: BlockInstructionsCardProps) {
  const isFatiga = block === "fatiga";

  const scaleOptions = isFatiga ? FATIGA_SCALE_OPTIONS : PSICOSOCIAL_SCALE_OPTIONS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
    >
      <div className="space-y-5">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full uppercase tracking-wider">
            {isFatiga ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                Bloque 1 de 2
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5 text-indigo-600" />
                Bloque 2 de 2
              </>
            )}
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            15 Preguntas
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            {isFatiga ? "Evaluación de Fatiga" : "Evaluación Psicosocial"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {isFatiga
              ? "Instrucciones de Aplicación: Selecciona la opción que mejor describa tu estado actual utilizando la siguiente escala del 1 al 5."
              : "Instrucciones de Aplicación: Selecciona la opción que mejor describa tu comportamiento o tus pensamientos habituales mientras conduces."}
          </p>
        </div>

        {/* Scale Legend Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            Escala de Valoración (1 a 5)
          </div>
          <div className="space-y-1.5 pt-1">
            {scaleOptions.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-2xs"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {opt.value}
                </span>
                <span className="text-xs text-slate-700 font-semibold leading-tight">
                  {opt.label.substring(3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Responde con total sinceridad. Tus respuestas son confidenciales y fundamentales para garantizar la seguridad en la vía.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <button
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
        >
          <span>Iniciar {isFatiga ? "Bloque 1: Fatiga" : "Bloque 2: Psicosocial"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
