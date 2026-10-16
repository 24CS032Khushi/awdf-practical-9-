import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = { Pending: '#f59e0b', 'In progress': '#3b82f6', Completed: '#22c55e' };

// MUST be a default export so React.lazy() can load it
export default function TaskChart({ tasks }) {
  const byStatus = useMemo(() => {
    const count = { Pending: 0, 'In progress': 0, Completed: 0 };
    tasks.forEach((t) => {
      if (t.status === 'pending') count.Pending++;
      else if (t.status === 'in-progress') count['In progress']++;
      else if (t.status === 'completed') count.Completed++;
    });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const byDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const d = new Date(t.createdAt).toISOString().slice(0, 10);
      map[d] = (map[d] || 0) + 1;
    });
    return Object.keys(map).sort().slice(-7).map((d) => ({ day: d.slice(5), tasks: map[d] }));
  }, [tasks]);

  if (!tasks.length) return <p className="muted">Add a few tasks to see your analytics.</p>;

  return (
    <div className="chart-grid">
      <div className="chart-box">
        <h4>Tasks by status</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {byStatus.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-box">
        <h4>Tasks added (last 7 active days)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
