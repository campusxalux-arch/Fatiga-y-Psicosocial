/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LikertQuestion, LikertOption, BlockScore } from "../types";

export const FATIGA_SCALE_OPTIONS: LikertOption[] = [
  { value: 1, label: "1: Totalmente en desacuerdo / Nada" },
  { value: 2, label: "2: En desacuerdo / Ligero" },
  { value: 3, label: "3: Neutral / Moderado" },
  { value: 4, label: "4: De acuerdo / Bastante" },
  { value: 5, label: "5: Totalmente de acuerdo / Mucho" },
];

export const PSICOSOCIAL_SCALE_OPTIONS: LikertOption[] = [
  { value: 1, label: "1: Nunca / Totalmente en desacuerdo" },
  { value: 2, label: "2: Rara vez / En desacuerdo" },
  { value: 3, label: "3: A veces / Neutral" },
  { value: 4, label: "4: Frecuentemente / De acuerdo" },
  { value: 5, label: "5: Siempre / Totalmente de acuerdo" },
];

export const FATIGA_QUESTIONS: LikertQuestion[] = [
  { id: 1, question: "¿Sientes pesadez o dificultad para mantener los ojos abiertos?", block: "fatiga" },
  { id: 2, question: "¿Has estado bostezando con frecuencia en los últimos minutos/horas?", block: "fatiga" },
  { id: 3, question: "¿Sientes la vista borrosa o molestia/cansancio visual?", block: "fatiga" },
  { id: 4, question: "¿Te cuesta mantener una postura erguida o sientes tensión acumulada en el cuello/espalda?", block: "fatiga" },
  { id: 5, question: "¿Has dormido menos de las horas recomendadas (7-8 h) antes de este turno?", block: "fatiga" },
  { id: 6, question: "¿Sientes pesadez física o torpeza en los brazos y piernas al reaccionar?", block: "fatiga" },
  { id: 7, question: "¿Te cuesta mantener la concentración constante en la vía?", block: "fatiga" },
  { id: 8, question: "¿Has experimentado episodios donde no recuerdas los últimos kilómetros recorridos?", block: "fatiga" },
  { id: 9, question: "¿Te ha costado mantener el vehículo dentro del carril de manera constante?", block: "fatiga" },
  { id: 10, question: "¿Has reaccionado más lento de lo normal ante un frenazo o imprevisto?", block: "fatiga" },
  { id: 11, question: "¿Te sientes irritable, impaciente o más frustrado de lo habitual mientras conduces?", block: "fatiga" },
  { id: 12, question: "¿Sientes somnolencia o una fuerte necesidad de tomar una siesta ahora mismo?", block: "fatiga" },
  { id: 13, question: "¿Has tenido que esforzarte conscientemente para \"mantenerte despierto\" (subir la música, bajar la ventana, etc.)?", block: "fatiga" },
  { id: 14, question: "¿Llevas más de 2 horas conduciendo de forma continua sin realizar una pausa activa?", block: "fatiga" },
  { id: 15, question: "En general, ¿cómo calificarías tu nivel de agotamiento en este momento?", block: "fatiga" },
];

export const PSICOSOCIAL_QUESTIONS: LikertQuestion[] = [
  { id: 1, question: "¿Sientes frustración o rabia intensa cuando otro vehículo se te cruza o interrumpe tu paso?", block: "psicosocial" },
  { id: 2, question: "¿Usas la bocina (pito) o ráfagas de luz para expresar tu molestia hacia otros conductores?", block: "psicosocial" },
  { id: 3, question: "¿Sueles pegarte demasiado al vehículo de adelante si consideras que va demasiado lento?", block: "psicosocial" },
  { id: 4, question: "¿Haces gestos obscenos, miras fijamente o gritas insultos a otros usuarios de la vía?", block: "psicosocial" },
  { id: 5, question: "¿Has acelerado para evitar que otro vehículo cambie de carril o te rebase?", block: "psicosocial" },
  { id: 6, question: "¿Sientes la necesidad de \"ganarle\" a otros conductores o competir en los semáforos/vías?", block: "psicosocial" },
  { id: 7, question: "¿Pierdes la paciencia con facilidad cuando te encuentras con tráfico pesado o trancones?", block: "psicosocial" },
  { id: 8, question: "¿Conduces de manera más agresiva o imprudente cuando estás bajo estrés o tuviste un mal día?", block: "psicosocial" },
  { id: 9, question: "¿Has frenado bruscamente a propósito frente a alguien para \"darle una lección\"?", block: "psicosocial" },
  { id: 10, question: "¿Te resulta difícil controlar tu ira si sientes que otro conductor cometió una infracción injusta?", block: "psicosocial" },
  { id: 11, question: "¿Percibes los errores o maniobras de los demás como agresiones dirigidas personalmente hacia ti?", block: "psicosocial" },
  { id: 12, question: "¿Sueles exceder los límites de velocidad intencionalmente cuando estás de mal humor?", block: "psicosocial" },
  { id: 13, question: "¿Has tenido pensamientos de golpear o hacerle daño físico al vehículo/persona de otro conductor?", block: "psicosocial" },
  { id: 14, question: "¿Te cuesta calmarte rápidamente después de tener una discusión o altercado en la vía?", block: "psicosocial" },
  { id: 15, question: "En general, ¿consideras que tu estilo de conducción es impulsivo o dominado por tus emociones?", block: "psicosocial" },
];

export function calculateFatigaResult(answers: Record<number, number>): BlockScore {
  let score = 0;
  for (let i = 1; i <= 15; i++) {
    score += Number(answers[i]) || 1;
  }

  if (score <= 30) {
    return {
      score,
      nivel: "Fatiga Baja - Estado Óptimo",
      interpretacion: "El conductor se encuentra apto para iniciar o continuar la marcha de forma segura.",
    };
  } else if (score <= 50) {
    return {
      score,
      nivel: "Fatiga Moderada - Alerta",
      interpretacion: "Existen signos claros de cansancio. Se recomienda realizar una pausa activa de 15 a 20 minutos, hidratarse y caminar antes de continuar.",
    };
  } else {
    return {
      score,
      nivel: "Fatiga Alta - Riesgo Crítico",
      interpretacion: "Alto riesgo de microdormidas o accidentes. El conductor NO debe continuar manejando. Es obligatorio realizar un descanso prolongado o el relevo del conductor.",
    };
  }
}

export function calculatePsicosocialResult(answers: Record<number, number>): BlockScore {
  let score = 0;
  for (let i = 1; i <= 15; i++) {
    score += Number(answers[i]) || 1;
  }

  if (score <= 30) {
    return {
      score,
      nivel: "Baja Agresividad - Conducción Prosocial",
      interpretacion: "El conductor demuestra tolerancia, adecuado autocontrol emocional y manejo de la frustración en la vía.",
    };
  } else if (score <= 50) {
    return {
      score,
      nivel: "Agresividad Moderada - Riesgo Intermedio",
      interpretacion: "Existen conductas reactivas e impulsividad ocasional. Se recomienda capacitación en inteligencia emocional, técnicas de manejo de estrés y conducción defensiva.",
    };
  } else {
    return {
      score,
      nivel: "Agresividad Alta - Riesgo Crítico",
      interpretacion: "Alto nivel de hostilidad, reactividad y predisposición a la \"ira al volante\" (Road Rage). Requiere evaluación psicológica especializada e intervención conductual antes de asumir la responsabilidad de un vehículo.",
    };
  }
}
