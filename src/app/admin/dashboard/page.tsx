"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SALESPEOPLE } from "@/lib/salespeople";
import { Lead } from "@/lib/types";
import {
  Download,
  LogOut,
  Users,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  X,
  CalendarDays,
} from "lucide-react";
import Image from "next/image";
import * as XLSX from "xlsx";

const CELULAS: Record<string, { label: string; color: string; bg: string }> = {
  AT: { label: "Amatools",  color: "#fb923c", bg: "#431407" },
  SB: { label: "Salvabras", color: "#a78bfa", bg: "#2e1065" },
  ST: { label: "Starrett®", color: "#34d399", bg: "#022c22" },
};

function getCelula(salesperson: string) {
  const suffix = salesperson.split("_").pop()?.toUpperCase() ?? "";
  return CELULAS[suffix] ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSalesperson, setFilterSalesperson] = useState("");
  const [filterCelula, setFilterCelula] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("is_admin") !== "true") {
      router.replace("/admin");
    }
  }, [router]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function handleLogout() {
    sessionStorage.removeItem("is_admin");
    router.push("/admin");
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
    setDeletingId(null);
    setConfirmId(null);
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSalesperson =
      !filterSalesperson || lead.salesperson_name === filterSalesperson;
    const suffix = lead.salesperson_name.split("_").pop()?.toUpperCase() ?? "";
    const matchesCelula = !filterCelula || suffix === filterCelula;
    const matchesTipo = !filterTipo || (lead.tipo_cliente ?? "Revenda") === filterTipo;
    const leadDate = new Date(lead.created_at);
    const matchesFrom = !dateFrom || leadDate >= new Date(dateFrom + "T00:00:00");
    const matchesTo = !dateTo || leadDate <= new Date(dateTo + "T23:59:59");
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.includes(search) ||
      (lead.company_name || "").toLowerCase().includes(searchLower) ||
      (lead.cnpj || "").includes(search);
    return matchesSalesperson && matchesCelula && matchesTipo && matchesFrom && matchesTo && matchesSearch;
  });

  function exportToExcel() {
    const exportData = filteredLeads.map((lead) => ({
      Nome: lead.name,
      Telefone: lead.phone,
      Empresa: lead.company_name || "",
      CNPJ: lead.cnpj || "",
      Tipo: lead.tipo_cliente ?? "Revenda",
      Célula: getCelula(lead.salesperson_name)?.label ?? "",
      Vendedor: lead.salesperson_name,
      "Data/Hora": formatDate(lead.created_at),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    ws["!cols"] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
    ];

    const filename = `IS_ExpoLead_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Confirm Delete Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmId(null)}
          />
          <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setConfirmId(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center text-lg mb-1">
              Excluir lead?
            </h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              {leads.find((l) => l.id === confirmId)?.name} será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#334155] text-slate-300 hover:bg-[#334155] transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deletingId === confirmId ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="IS Logo" width={40} height={40} className="rounded-full" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                IS <span className="text-[#3b82f6]">ExpoLead</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Dashboard Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-white">{leads.length}</span>
              <span className="text-xs text-slate-400">leads</span>
            </div>
            <button
              onClick={fetchLeads}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
            <p className="text-xs text-slate-400 mb-1">Total de leads</p>
            <p className="text-2xl font-bold text-white">{leads.length}</p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
            <p className="text-xs text-slate-400 mb-1">Com empresa</p>
            <p className="text-2xl font-bold text-white">
              {leads.filter((l) => l.company_name).length}
            </p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
            <p className="text-xs text-slate-400 mb-1">Vendedores ativos</p>
            <p className="text-2xl font-bold text-white">
              {new Set(leads.map((l) => l.salesperson_name)).size}
            </p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
            <p className="text-xs text-slate-400 mb-1">Filtrados</p>
            <p className="text-2xl font-bold text-[#3b82f6]">{filteredLeads.length}</p>
          </div>
        </div>

        {/* Filters + Export */}
        <div className="flex flex-col gap-3">

          {/* Date range row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm whitespace-nowrap">
              <CalendarDays className="w-4 h-4" />
              Período:
            </div>
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                />
              </div>
              <span className="self-center text-slate-500 text-sm">até</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#334155] transition-colors text-xs whitespace-nowrap"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Other filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, empresa..."
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          {/* Tipo de Cliente filter */}
          <div className="relative sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full appearance-none bg-[#1e293b] border border-[#334155] rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            >
              <option value="">Todos os tipos</option>
              <option value="Revenda">🏪 Revenda</option>
              <option value="Construtora">🏗️ Construtora</option>
            </select>
          </div>

          {/* Célula filter */}
          <div className="relative sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={filterCelula}
              onChange={(e) => { setFilterCelula(e.target.value); setFilterSalesperson(""); }}
              className="w-full appearance-none bg-[#1e293b] border border-[#334155] rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            >
              <option value="">Todas as células</option>
              {Object.entries(CELULAS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Vendedor filter */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={filterSalesperson}
              onChange={(e) => setFilterSalesperson(e.target.value)}
              className="w-full appearance-none bg-[#1e293b] border border-[#334155] rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            >
              <option value="">Todos os vendedores</option>
              {SALESPEOPLE
                .filter((name) => !filterCelula || name.endsWith(`_${filterCelula}`))
                .map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
            </select>
          </div>

          <button
            onClick={exportToExcel}
            disabled={filteredLeads.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-4 bg-[#334155] rounded flex-1" />
                  <div className="h-4 bg-[#334155] rounded w-32" />
                  <div className="h-4 bg-[#334155] rounded w-40" />
                  <div className="h-4 bg-[#334155] rounded w-28" />
                </div>
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">
                {leads.length === 0
                  ? "Nenhum lead capturado ainda"
                  : "Nenhum resultado para o filtro atual"}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                {leads.length === 0
                  ? "Os leads cadastrados aparecerão aqui"
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    {["Nome", "Telefone", "Empresa", "CNPJ", "Tipo", "Célula", "Vendedor", "Data/Hora", ""].map(
                      (col, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#243044] transition-colors group"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">
                        {lead.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {lead.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {lead.company_name || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap font-mono text-xs">
                        {lead.cnpj || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.tipo_cliente === "Construtora" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300">
                            🏗️ Construtora
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-900/40 text-sky-300">
                            🏪 Revenda
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const c = getCelula(lead.salesperson_name);
                          return c ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ color: c.color, backgroundColor: c.bg }}
                            >
                              {c.label}
                            </span>
                          ) : <span className="text-slate-600">—</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1e3a5f] text-[#60a5fa]">
                          {lead.salesperson_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setConfirmId(lead.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
                          title="Excluir lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredLeads.length > 0 && (
          <p className="text-xs text-slate-500 text-right">
            Mostrando {filteredLeads.length} de {leads.length} leads
          </p>
        )}

        {/* Ranking */}
        {leads.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              🏆 Ranking de captação
              <span className="text-xs font-normal text-slate-500">
                {dateFrom || dateTo ? "— período filtrado" : "— geral"}
              </span>
            </h2>
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
              {(() => {
                const counts: Record<string, number> = {};
                filteredLeads.forEach((l) => {
                  counts[l.salesperson_name] = (counts[l.salesperson_name] ?? 0) + 1;
                });
                const ranking = Object.entries(counts)
                  .sort((a, b) => b[1] - a[1]);
                const max = ranking[0]?.[1] ?? 1;

                const medals = ["🥇", "🥈", "🥉"];

                return ranking.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Nenhum dado para exibir</p>
                ) : (
                  <div className="divide-y divide-[#334155]">
                    {ranking.map(([name, count], i) => {
                      const celula = getCelula(name);
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={name} className="flex items-center gap-4 px-5 py-3 hover:bg-[#243044] transition-colors">
                          {/* Position */}
                          <div className="w-8 text-center text-lg flex-shrink-0">
                            {i < 3 ? medals[i] : (
                              <span className="text-slate-500 text-sm font-bold">{i + 1}º</span>
                            )}
                          </div>

                          {/* Name + bar */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-sm font-medium text-white truncate">{name}</span>
                              {celula && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                  style={{ color: celula.color, backgroundColor: celula.bg }}
                                >
                                  {celula.label}
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#3b82f6",
                                }}
                              />
                            </div>
                          </div>

                          {/* Count */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-bold text-white">{count}</span>
                            <span className="text-xs text-slate-500 ml-1">lead{count !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
