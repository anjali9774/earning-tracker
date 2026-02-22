import axios from 'axios';
import { Expense, ExpenseRequest, DashboardData } from '../types';

const BASE = `${process.env.REACT_APP_API_BASE_URL}/api/expenses`;


export const api = {
  getAll: () => axios.get<Expense[]>(BASE).then(r => r.data),

  add: (data: ExpenseRequest) => axios.post<Expense>(BASE, data).then(r => r.data),

  delete: (id: number) => axios.delete(`${BASE}/${id}`),

uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return axios.post<{ message: string; count: number; expenses: Expense[] }>(
      `${process.env.REACT_APP_API_BASE_URL}/api/expenses/upload-csv`,
      formData
      // no Content-Type header — let browser set it with boundary automatically
    ).then(r => r.data);
},

  getAnomalies: () => axios.get<Expense[]>(`${BASE}/anomalies`).then(r => r.data),

  getDashboard: (year: number, month: number) =>
    axios.get<DashboardData>(`${BASE}/dashboard?year=${year}&month=${month}`).then(r => r.data),
};
