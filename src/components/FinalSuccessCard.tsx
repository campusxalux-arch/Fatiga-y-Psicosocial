/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck, RefreshCw, UserCheck, AlertTriangle, CloudCheck } from "lucide-react";
import { UserRegistration, SyncStatus } from "../types";

interface FinalSuccessCardProps {
  registration: UserRegistration | null;
  syncStatus?: SyncStatus | null;
  onRestart: () => void;
}

export default function FinalSuccessCard({ registration, syncStatus, onRestart }: FinalSuccessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md text-center flex flex-col items-center justify-between my-auto min-h-[440px]"
    >
      <div className="w-full flex flex-col items-center my-auto space-y-5">
        {/* Success Animated Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            className="absolute inset-0 w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-11 h-11 text-white" />
          </motion.div>
        </div>

        {/* User requested exact message */}
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Felicidades has completado con exito el cuestionario
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tus respuestas de Fatiga y Psicosocial han sido procesadas correctamente.
          </p>
        </div>

        {/* Google Sheets Synchronization Status Badge */}
        {syncStatus && (
          <div
            className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              syncStatus.status === "success"
                ? "bg-emerald-50/90 border-emerald-200/90 text-emerald-900"
                : "bg-amber-50/90 border-amber-200/90 text-amber-900"
            }`}
          >
            {syncStatus.status === "success" ? (
              <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">
                Sincronización con Google Sheets
              </span>
              <p className="text-xs font-bold leading-snug">
                {syncStatus.message ||
                  (syncStatus.status === "success"
                    ? "Resultados guardados y sincronizados en Google Sheets."
                    : "No se pudo sincronizar automáticamente con la plantilla.")}
              </p>
            </div>
          </div>
        )}

        {/* Participant Data Badge */}
        {registration && (
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200/60 pb-2">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              Datos del Evaluado
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nombre</span>
                <span className="font-bold text-slate-800">{registration.nombreCompleto}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Identificación</span>
                <span className="font-bold text-slate-800">{registration.numeroIdentificacion}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Empresa</span>
                <span className="font-bold text-slate-800">{registration.empresa}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Licencia</span>
                <span className="font-bold text-slate-800">{registration.tipoLicencia}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Información registrada en el sistema</span>
        </div>
      </div>

      {/* Restart Button */}
      <div className="w-full pt-4">
        <button
          onClick={onRestart}
          className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Realizar nueva evaluación</span>
        </button>
      </div>
    </motion.div>
  );
}

