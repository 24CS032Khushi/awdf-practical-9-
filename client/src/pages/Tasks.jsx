import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskItem from '../components/TaskItem';
import Field from '../components/Field';
import ChartEntry from '@chart'; // lazy in normal build, eager in baseline build (see vite.config.js)

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

export default function Tasks() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [formError, setFormError] = useState('');
  const [adding, setAdding] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setTasks(await api('/tasks'));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ---- handlers are stable (useCallback + functional setState) so memo(TaskItem) works ----
  const handleUpdate = useCallback(async (id, patch) => {
    try {
      const updated = await api(`/tasks/${id}`, { method: 'PUT', body: patch });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [toast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [toast]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return setFormError('Please enter a task title');
    if (title.length > 100) return setFormError('Title must be at most 100 characters');
    setFormError('');
    setAdding(true);
    try {
      const created = await api('/tasks', { method: 'POST', body: { title, description: form.description.trim() } });
      setTasks((prev) => [created, ...prev]);
      setForm({ title: '', description: '' });
      toast.success('Task added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const counts = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    progress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'completed').length,
  }), [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (filter === 'all' || t.status === filter) &&
        (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
    );
  }, [tasks, filter, query]);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0];
  const percent = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <>
      <header className="page-head">
        <h1>Hi, {firstName} 👋</h1>
        <p className="muted">
          {counts.total === 0 ? 'Add your first task to get started.' : `You have completed ${percent}% of your tasks.`}
        </p>
      </header>

      <section className="grid grid-4 stats">
        <div className="card stat"><span className="stat-num">{counts.total}</span><span className="muted">Total</span></div>
        <div className="card stat stat-pending"><span className="stat-num">{counts.pending}</span><span className="muted">Pending</span></div>
        <div className="card stat stat-progress"><span className="stat-num">{counts.progress}</span><span className="muted">In progress</span></div>
        <div className="card stat stat-done"><span className="stat-num">{counts.done}</span><span className="muted">Completed</span></div>
      </section>

      <div className="progress" aria-label={`${percent}% completed`}><div className="progress-bar" style={{ width: `${percent}%` }} /></div>

      <form className="card add-form" onSubmit={handleAdd} noValidate>
        <Field label="New task" name="title" value={form.title} maxLength={100}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={formError} placeholder="e.g. Finish Practical 8 report" />
        <Field label="Description (optional)" name="description" value={form.description} maxLength={500}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Add some details" />
        <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : '+ Add task'}</button>
      </form>

      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Search tasks..." value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
      </div>

      {loading ? (
        <div className="skeleton-stack" aria-busy="true">
          <div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" />
        </div>
      ) : loadError ? (
        <div className="card empty">
          <div className="empty-icon">⚠️</div>
          <p>{loadError}</p>
          <button className="btn btn-primary btn-sm" onClick={loadTasks}>Try again</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📭</div>
          <p>{tasks.length === 0 ? 'No tasks yet. Add one above!' : 'No tasks match your filters.'}</p>
        </div>
      ) : (
        <ul className="task-list">
          {visible.map((t) => (
            <TaskItem key={t._id} task={t} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}

      <section className="card analytics">
        <div className="analytics-head">
          <div>
            <h3>Analytics</h3>
            <p className="muted">Charts are downloaded only when you open this panel.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAnalytics((s) => !s)}>
            {showAnalytics ? 'Hide analytics' : 'Show analytics'}
          </button>
        </div>
        {showAnalytics && <ChartEntry tasks={tasks} />}
      </section>
    </>
  );
}
