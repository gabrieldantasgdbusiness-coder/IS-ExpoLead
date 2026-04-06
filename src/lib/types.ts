export interface Lead {
  id: string
  name: string
  phone: string
  cnpj: string | null
  company_name: string | null
  salesperson_name: string
  tipo_cliente: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  action: string
  lead_id: string
  created_by: string
  timestamp: string
}
