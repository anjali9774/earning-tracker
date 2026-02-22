import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Expense, ExpenseRequest, DashboardData, CATEGORIES, CATEGORY_COLORS } from './types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Add Expense Form ──────────────────────────────────────────────────────────
function AddExpenseForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState<ExpenseRequest>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    vendorName: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorName || !form.amount || !form.date) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const expense = await api.add(form);
      setSuccess(`Expense added! Category: ${expense.category}${expense.anomaly ? ' ⚠️ (Anomaly detected)' : ''}`);
      setForm({ date: new Date().toISOString().split('T')[0], amount: 0, vendorName: '', description: '', category: '' });
      onAdded();
    } catch {
      setError('Failed to add expense. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2 className="form-title">Add Expense</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Amount (₹) *</label>
          <input type="number" min="0" step="0.01" placeholder="0.00"
            value={form.amount || ''}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
        </div>
        <div className="form-group">
          <label>Vendor Name *</label>
          <input type="text" placeholder="e.g. Swiggy, Uber..."
            value={form.vendorName}
            onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Category <span className="hint">(auto-detected)</span></label>
          <select value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Auto-detect from vendor</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <input type="text" placeholder="Optional note..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>
      {error && <p className="msg error">{error}</p>}
      {success && <p className="msg success">{success}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving...' : '+ Add Expense'}
      </button>
    </form>
  );
}

// ─── CSV Upload ────────────────────────────────────────────────────────────────
function CsvUpload({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setResult(''); setError('');
    try {
      const res = await api.uploadCsv(file);
      setResult(`✓ Imported ${res.count} expenses successfully.`);
      setFile(null);
      onUploaded();
    } catch {
      setError('Upload failed. Check file format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">Upload CSV</h2>
      <p className="hint-text">CSV format: <code>date, amount, vendor_name, description</code></p>
      <div className="csv-drop-zone">
        <input type="file" accept=".csv" id="csv-file"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <label htmlFor="csv-file" className="csv-label">
          {file ? `📄 ${file.name}` : '📂 Choose CSV file'}
        </label>
      </div>
      {error && <p className="msg error">{error}</p>}
      {result && <p className="msg success">{result}</p>}
      <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Uploading...' : 'Upload CSV'}
      </button>
    </div>
  );
}

// ─── Expense Table ─────────────────────────────────────────────────────────────
function ExpenseTable({ expenses, onDelete }: { expenses: Expense[]; onDelete: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAnomaly, setFilterAnomaly] = useState(false);

  const filtered = expenses.filter(e => {
    const matchSearch = !search ||
      e.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || e.category === filterCat;
    const matchAnomaly = !filterAnomaly || e.anomaly;
    return matchSearch && matchCat && matchAnomaly;
  });

  return (
    <div className="table-card">
      <div className="table-filters">
        <input placeholder="🔍 Search vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="anomaly-filter">
          <input type="checkbox" checked={filterAnomaly} onChange={e => setFilterAnomaly(e.target.checked)} />
          Anomalies only
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Vendor</th><th>Category</th>
              <th>Amount</th><th>Description</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty">No expenses found.</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} className={e.anomaly ? 'anomaly-row' : ''}>
                <td>{fmtDate(e.date)}</td>
                <td><strong>{e.vendorName}</strong></td>
                <td>
                  <span className="category-badge" style={{ background: CATEGORY_COLORS[e.category] + '22', color: CATEGORY_COLORS[e.category] }}>
                    {e.category}
                  </span>
                </td>
                <td className="amount-cell">{fmt(e.amount)}</td>
                <td className="desc-cell">{e.description || '—'}</td>
                <td>{e.anomaly ? <span className="anomaly-badge">⚠️ Anomaly</span> : <span className="normal-badge">✓ Normal</span>}</td>
                <td>
                  <button className="delete-btn" onClick={() => onDelete(e.id)} title="Delete">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-count">{filtered.length} of {expenses.length} expenses</p>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ dashboard }: { dashboard: DashboardData | null }) {
  if (!dashboard) return <div className="loading-msg">Loading dashboard...</div>;

  const categoryData = Object.entries(dashboard.monthlyCategoryTotals).map(([name, value]) => ({ name, value }));
  const vendorData = dashboard.topVendors.map(v => ({ name: v.vendorName, amount: v.total }));
  const totalSpend = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="dashboard">
      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Monthly Spend</div>
          <div className="stat-value">{fmt(totalSpend)}</div>
          <div className="stat-sub">{new Date(dashboard.year, dashboard.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categoryData.length}</div>
          <div className="stat-sub">active this month</div>
        </div>
        <div className="stat-card anomaly-stat">
          <div className="stat-label">⚠️ Anomalies</div>
          <div className="stat-value">{dashboard.anomalyCount}</div>
          <div className="stat-sub">flagged expenses</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Spend by Category</h3>
          {categoryData.length === 0 ? <p className="empty">No data this month.</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Top 5 Vendors by Spend</h3>
          {vendorData.length === 0 ? <p className="empty">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vendorData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="chart-card">
        <h3>Category Breakdown — {new Date(dashboard.year, dashboard.month - 1).toLocaleString('default', { month: 'long' })}</h3>
        <table className="breakdown-table">
          <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead>
          <tbody>
            {categoryData.sort((a, b) => b.value - a.value).map(c => (
              <tr key={c.name}>
                <td><span className="category-badge" style={{ background: CATEGORY_COLORS[c.name] + '22', color: CATEGORY_COLORS[c.name] }}>{c.name}</span></td>
                <td>{fmt(c.value)}</td>
                <td>
                  <div className="bar-cell">
                    <div className="bar-fill" style={{ width: `${totalSpend ? (c.value / totalSpend) * 100 : 0}%`, background: CATEGORY_COLORS[c.name] }} />
                    <span>{totalSpend ? ((c.value / totalSpend) * 100).toFixed(1) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Anomalies */}
      {dashboard.anomalies.length > 0 && (
        <div className="anomalies-card">
          <h3>⚠️ Anomalous Expenses ({dashboard.anomalyCount})</h3>
          <p className="hint-text">These expenses are more than 3× the average for their category.</p>
          <table>
            <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
            <tbody>
              {dashboard.anomalies.map(e => (
                <tr key={e.id} className="anomaly-row">
                  <td>{fmtDate(e.date)}</td>
                  <td><strong>{e.vendorName}</strong></td>
                  <td><span className="category-badge" style={{ background: CATEGORY_COLORS[e.category] + '22', color: CATEGORY_COLORS[e.category] }}>{e.category}</span></td>
                  <td className="amount-cell">{fmt(e.amount)}</td>
                  <td>{e.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'expenses' | 'add' | 'upload';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashMonth, setDashMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const loadExpenses = useCallback(async () => {
    try { setExpenses(await api.getAll()); } catch { /* backend may not be running */ }
  }, []);

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await api.getDashboard(dashMonth.year, dashMonth.month)); } catch { /* */ }
  }, [dashMonth]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(id);
    loadExpenses();
    loadDashboard();
  };

  const handleChange = () => { loadExpenses(); loadDashboard(); };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <span>ExpenseManager</span>
          </div>
          <nav className="nav">
            {(['dashboard', 'expenses', 'add', 'upload'] as Tab[]).map(t => (
              <button key={t} className={`nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'dashboard' ? '📊 Dashboard' :
                  t === 'expenses' ? '📋 Expenses' :
                    t === 'add' ? '➕ Add' : '📂 CSV Upload'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="main">
        {tab === 'dashboard' && (
          <div>
            <div className="month-picker">
              <label>Month:</label>
              <select value={dashMonth.month} onChange={e => setDashMonth(d => ({ ...d, month: +e.target.value }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select value={dashMonth.year} onChange={e => setDashMonth(d => ({ ...d, year: +e.target.value }))}>
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Dashboard dashboard={dashboard} />
          </div>
        )}
        {tab === 'expenses' && <ExpenseTable expenses={expenses} onDelete={handleDelete} />}
        {tab === 'add' && <AddExpenseForm onAdded={handleChange} />}
        {tab === 'upload' && <CsvUpload onUploaded={handleChange} />}
      </main>
    </div>
  );
}
