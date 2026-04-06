"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SALESPEOPLE } from "@/lib/salespeople";
import { User, Phone, Building2, Hash, ChevronDown, CheckCircle } from "lucide-react";
import Image from "next/image";

const INITIAL_FORM = {
  name: "",
  phone: "",
  cnpj: "",
  company_name: "",
  salesperson_name: "",
  tipo_cliente: "Revenda",
};

export default function LeadCapturePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function formatCNPJ(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else if (name === "cnpj") {
      setForm((prev) => ({ ...prev, cnpj: formatCNPJ(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }
    if (!form.salesperson_name) {
      toast.error("Selecione o vendedor responsável");
      return;
    }

    setLoading(true);

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        cnpj: form.cnpj.trim() || null,
        company_name: form.company_name.trim() || null,
        salesperson_name: form.salesperson_name,
        tipo_cliente: form.tipo_cliente,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar contato. Tente novamente.");
      setLoading(false);
      return;
    }

    if (lead) {
      await supabase.from("activity_logs").insert({
        action: "lead_created",
        lead_id: lead.id,
        created_by: form.salesperson_name,
      });
    }

    setLoading(false);
    setSuccess(true);
    toast.success("Cliente cadastrado com sucesso!", {
      icon: "✅",
      duration: 3000,
    });

    setTimeout(() => {
      setForm(INITIAL_FORM);
      setSuccess(false);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="IS Logo" width={44} height={44} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              IS <span className="text-[#3b82f6]">ExpoLead</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Captura de contatos</p>
          </div>
        </div>
        <a
          href="/admin"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1e293b]"
        >
          Admin
        </a>
      </header>

      {/* Form */}
      <main className="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome completo"
                autoComplete="off"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Telefone <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                autoComplete="off"
                inputMode="numeric"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Empresa{" "}
              <span className="text-slate-500 font-normal text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Nome da empresa"
                autoComplete="off"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CNPJ{" "}
              <span className="text-slate-500 font-normal text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0001-00"
                autoComplete="off"
                inputMode="numeric"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* Salesperson */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vendedor responsável <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                name="salesperson_name"
                value={form.salesperson_name}
                onChange={handleChange}
                className="w-full appearance-none bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
              >
                <option value="" disabled>
                  Selecione seu nome
                </option>
                {SALESPEOPLE.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Tipo de cliente <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Revenda", "Construtora"].map((tipo) => (
                <label
                  key={tipo}
                  className={[
                    "flex items-center justify-center gap-2 py-4 rounded-xl border-2 cursor-pointer transition-all duration-150 font-medium text-base",
                    form.tipo_cliente === tipo
                      ? "border-[#3b82f6] bg-[#1e3a5f] text-white"
                      : "border-[#334155] bg-[#1e293b] text-slate-400 hover:border-[#475569]",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="tipo_cliente"
                    value={tipo}
                    checked={form.tipo_cliente === tipo}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span>{tipo === "Revenda" ? "🏪" : "🏗️"}</span>
                  {tipo}
                </label>
              ))}
            </div>
          </div>
        </form>
      </main>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className={[
              "w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200",
              "flex items-center justify-center gap-2",
              success
                ? "bg-[#22c55e] text-white scale-[0.98]"
                : "bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.98] text-white",
              "disabled:opacity-70 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Salvando...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Salvo com sucesso!
              </>
            ) : (
              "Salvar contato"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
