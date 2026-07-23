/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Hash, 
  Calendar, 
  Building2, 
  Briefcase, 
  Award, 
  ChevronRight, 
  ShieldAlert 
} from "lucide-react";
import { UserRegistration, TipoIdentificacion, TipoLicencia } from "../types";

interface RegistrationFormProps {
  onSubmit: (data: UserRegistration) => void;
}

export default function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [formData, setFormData] = useState<UserRegistration>({
    tipoIdentificacion: "Cédula de ciudadanía",
    numeroIdentificacion: "",
    nombreCompleto: "",
    edad: "",
    empresa: "",
    antiguedad: "",
    tipoLicencia: ""
  });

  const [errors, setErrors] = useState<{ [key in keyof UserRegistration]?: string }>({});

  const validateForm = (): boolean => {
    const tempErrors: { [key in keyof UserRegistration]?: string } = {};
    let isValid = true;

    if (!formData.tipoIdentificacion) {
      tempErrors.tipoIdentificacion = "Seleccione el tipo de identificación";
      isValid = false;
    }

    if (!formData.numeroIdentificacion.trim()) {
      tempErrors.numeroIdentificacion = "Ingrese el número de identificación";
      isValid = false;
    } else if (formData.numeroIdentificacion.length < 5) {
      tempErrors.numeroIdentificacion = "Debe tener al menos 5 caracteres";
      isValid = false;
    }

    if (!formData.nombreCompleto.trim()) {
      tempErrors.nombreCompleto = "Ingrese su nombre completo";
      isValid = false;
    } else if (formData.nombreCompleto.split(" ").length < 2) {
      tempErrors.nombreCompleto = "Ingrese nombre y apellido completo";
      isValid = false;
    }

    if (formData.edad === "") {
      tempErrors.edad = "Ingrese su edad";
      isValid = false;
    } else {
      const edadNum = Number(formData.edad);
      if (isNaN(edadNum) || edadNum < 16 || edadNum > 99) {
        tempErrors.edad = "La edad debe estar entre 16 y 99 años";
        isValid = false;
      }
    }

    if (!formData.empresa.trim()) {
      tempErrors.empresa = "Ingrese el nombre de la empresa";
      isValid = false;
    }

    if (formData.antiguedad === "") {
      tempErrors.antiguedad = "Ingrese los años de antigüedad";
      isValid = false;
    } else {
      const antNum = Number(formData.antiguedad);
      if (isNaN(antNum) || antNum < 0 || antNum > 60) {
        tempErrors.antiguedad = "Debe ser un número válido (0 a 60)";
        isValid = false;
      }
    }

    if (!formData.tipoLicencia) {
      tempErrors.tipoLicencia = "Seleccione el tipo de licencia";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields properly and convert name & empresa to uppercase
    let parsedValue: string | number = value;
    if (name === "edad" || name === "antiguedad") {
      parsedValue = value === "" ? "" : Number(value);
    } else if (name === "nombreCompleto" || name === "empresa") {
      parsedValue = value.toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Clear error for this field
    if (errors[name as keyof UserRegistration]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-3xl shadow-md border border-slate-100/80 p-4 sm:p-5 w-full"
    >
      <div className="mb-4">
        <h2 className="font-sans font-bold text-base text-slate-900 tracking-tight">
          Datos del Aspirante
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Ingrese sus datos para habilitar su intento oficial de evaluación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3.5">
        {/* Tipo de identificación */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-blue-600" />
            Tipo de Identificación *
          </label>
          <select
            name="tipoIdentificacion"
            value={formData.tipoIdentificacion}
            onChange={handleChange}
            className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 focus:bg-white transition-all outline-none ${
              errors.tipoIdentificacion 
                ? "border-rose-400 focus:ring-rose-200/60" 
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          >
            <option value="">-- Seleccione... --</option>
            <option value="Cédula de ciudadanía">Cédula de Ciudadanía</option>
            <option value="Cédula de extranjería">Cédula de Extranjería</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="Permiso Especial">Permiso Especial (PEP / PPT)</option>
          </select>
          {errors.tipoIdentificacion && (
            <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
              <ShieldAlert className="w-3 h-3" /> {errors.tipoIdentificacion}
            </p>
          )}
        </div>

        {/* Número de identificación */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
            <Hash className="w-3 h-3 text-blue-600" />
            Número de Identificación *
          </label>
          <input
            type="text"
            name="numeroIdentificacion"
            value={formData.numeroIdentificacion}
            onChange={handleChange}
            placeholder="Ej: 1234567890"
            className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 focus:bg-white transition-all outline-none ${
              errors.numeroIdentificacion 
                ? "border-rose-400 focus:ring-rose-200/60" 
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.numeroIdentificacion && (
            <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
              <ShieldAlert className="w-3 h-3" /> {errors.numeroIdentificacion}
            </p>
          )}
        </div>

        {/* Nombre completo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
            <User className="w-3 h-3 text-blue-600" />
            Nombre Completo (Mayúsculas) *
          </label>
          <input
            type="text"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            placeholder="EJ: CARLOS ANDRÉS PÉREZ"
            className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium uppercase focus:ring-2 focus:bg-white transition-all outline-none ${
              errors.nombreCompleto 
                ? "border-rose-400 focus:ring-rose-200/60" 
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.nombreCompleto && (
            <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
              <ShieldAlert className="w-3 h-3" /> {errors.nombreCompleto}
            </p>
          )}
        </div>

        {/* Grid para Edad + Tipo Licencia */}
        <div className="grid grid-cols-2 gap-3">
          {/* Edad */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              Edad *
            </label>
            <input
              type="number"
              name="edad"
              value={formData.edad}
              onChange={handleChange}
              placeholder="25"
              min="16"
              max="99"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 focus:bg-white transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                errors.edad 
                  ? "border-rose-400 focus:ring-rose-200/60" 
                  : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            />
            {errors.edad && (
              <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
                <ShieldAlert className="w-3 h-3" /> {errors.edad}
              </p>
            )}
          </div>

          {/* Tipo de licencia */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-600" />
              Licencia *
            </label>
            <select
              name="tipoLicencia"
              value={formData.tipoLicencia}
              onChange={handleChange}
              className={`w-full h-11 px-2.5 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 focus:bg-white transition-all outline-none ${
                errors.tipoLicencia 
                  ? "border-rose-400 focus:ring-rose-200/60" 
                  : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            >
              <option value="">Seleccione...</option>
              <option value="A1">A1 (Motos ≤ 125 c.c.)</option>
              <option value="A2">A2 (Motos &gt; 125 c.c.)</option>
              <option value="B1">B1 (Carros particulares)</option>
              <option value="B2">B2 (Camiones particulares)</option>
              <option value="B3">B3 (Articulados particulares)</option>
              <option value="C1">C1 (Taxis, públicos)</option>
              <option value="C2">C2 (Buses, camiones rígidos)</option>
              <option value="C3">C3 (Articulados públicos)</option>
            </select>
            {errors.tipoLicencia && (
              <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
                <ShieldAlert className="w-3 h-3" /> {errors.tipoLicencia}
              </p>
            )}
          </div>
        </div>

        {/* Grid para Empresa + Antigüedad */}
        <div className="grid grid-cols-3 gap-3">
          {/* Empresa */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              Empresa (Mayúsculas) *
            </label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="EJ: MI EMPRESA S.A.S."
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium uppercase focus:ring-2 focus:bg-white transition-all outline-none ${
                errors.empresa 
                  ? "border-rose-400 focus:ring-rose-200/60" 
                  : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            />
            {errors.empresa && (
              <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
                <ShieldAlert className="w-3 h-3" /> {errors.empresa}
              </p>
            )}
          </div>

          {/* Antigüedad */}
          <div className="col-span-1 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-blue-600" />
              Años *
            </label>
            <input
              type="number"
              name="antiguedad"
              value={formData.antiguedad}
              onChange={handleChange}
              placeholder="0"
              min="0"
              max="60"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 focus:bg-white transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                errors.antiguedad 
                  ? "border-rose-400 focus:ring-rose-200/60" 
                  : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            />
            {errors.antiguedad && (
              <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1 ml-1 font-semibold">
                <ShieldAlert className="w-3 h-3" /> {errors.antiguedad}
              </p>
            )}
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          className="mt-2 w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
        >
          <span>INICIAR EVALUACIÓN</span>
          <ChevronRight className="w-4 h-4 text-blue-200" />
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        <span>🔒 Datos Protegidos</span>
        <span>Google Sheets Sync</span>
      </div>
    </motion.div>
  );
}
