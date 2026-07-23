/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { LikertQuestion, LikertOption } from "../types";
import { FATIGA_SCALE_OPTIONS, PSICOSOCIAL_SCALE_OPTIONS } from "../data/questions";

interface BlockExamSessionProps {
  blockTitle: string;
  blockType: "fatiga" | "psicosocial";
  questions: LikertQuestion[];
  initialAnswers?: Record<number, number>;
  onComplete: (answers: Record<number, number>) => void;
}

export default function BlockExamSession({
  blockTitle,
  blockType,
  questions,
  initialAnswers = {},
  onComplete,
}: BlockExamSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const scaleOptions: LikertOption[] =
    blockType === "fatiga" ? FATIGA_SCALE_OPTIONS : PSICOSOCIAL_SCALE_OPTIONS;

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (value: number) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Automatically go to next question after selecting option (smooth auto-advance)
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 250);
    }
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      setValidationError("Por favor selecciona una respuesta para continuar.");
      return;
    }
    setValidationError(null);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const firstUnansweredIndex = questions.findIndex((q) => !answers[q.id]);
      setCurrentIndex(firstUnansweredIndex);
      setValidationError(
        `Faltan ${unanswered.length} pregunta(s) por responder. Por favor completa todas las preguntas.`
      );
      return;
    }

    onComplete(answers);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
      {/* Top Header & Progress */}
      <div className="space-y-3 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
            {blockTitle}
          </span>
          <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Selector Numbers Grid */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setValidationError(null);
                  setCurrentIndex(idx);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 transition-all ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                    : isAnswered
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                }`}
              >
                {q.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Body */}
      <div className="flex-1 py-4 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Question Text */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Pregunta #{currentQuestion.id}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Options 1 to 5 */}
            <div className="space-y-2">
              {scaleOptions.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200"
                        : "bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-white text-blue-600"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {opt.value}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold leading-tight">
                        {opt.label.substring(3)}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <div className="text-[11px] font-bold text-slate-400">
          Respondidas: {answeredCount}/{totalQuestions}
        </div>

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={handleFinish}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 uppercase tracking-wide"
          >
            <span>Finalizar Bloque</span>
            <Sparkles className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
