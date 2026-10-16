import { memo, useState } from 'react';

const STATUS_LABEL = { pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed' };

/**
 * Wrapped in React.memo: it re-renders only when ITS task (or handlers) change.
 * Without memo, typing in the search box re-rendered every task card - see README
 * ("React DevTools Profiler") for how to reproduce and document that.
 */
function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: task.title, description: task.description || '' });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      await onUpdate(task._id, { title: draft.title, description: draft.description });
      setEditing(false);
    } catch { /* error toast already shown by parent */ }
    finally { setBusy(false); }
  };

  const changeStatus = (e) => onUpdate(task._id, { status: e.target.value }).catch(() => {});
  const remove = () => {
    if (window.confirm(`Delete "${task.title}"?`)) onDelete(task._id).catch(() => {});
  };

  const created = new Date(task.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  if (editing) {
    return (
      <li className="task-item editing">
        <div className="task-main">
          <input value={draft.title} maxLength={100} autoFocus
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" />
          <input value={draft.description} maxLength={500}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description" />
        </div>
        <div className="task-actions">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.status}`}>
      <span className={`dot dot-${task.status}`} />
      <div className="task-main">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          <span className={`badge badge-${task.status}`}>{STATUS_LABEL[task.status]}</span>
          <span className="muted">Added {created}</span>
        </div>
      </div>
      <div className="task-actions">
        <select value={task.status} onChange={changeStatus} aria-label="Change status">
          <option value="pending">Pending</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
      </div>
    </li>
  );
}

export default memo(TaskItem);
