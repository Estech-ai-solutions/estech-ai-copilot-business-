'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SiteNav from '@/components/site-nav';

type Task = { id: number; title: string; status: string; priority?: string; due_date?: string | null };

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
      const json = await res.json();
      setTasks(json.tasks ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: newTask.trim() })
      });
      const json = await res.json();
      if (json.task) {
        setTasks((current) => [json.task, ...current]);
      }
      setNewTask('');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Task Management</p>
          <h1 className="mt-4 text-4xl font-bold text-white">Turn ideas into action items and stay on track.</h1>
          <p className="mt-4 text-slate-300 leading-8">
            Create tasks, set priorities, and use AI suggestions to keep your business moving forward.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <form onSubmit={handleAddTask} className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">New task title</label>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g. Prepare invoice for April clients"
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Add task'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Task backlog</h2>
            <div className="mt-5 space-y-4">
              {tasks.length === 0 && <p className="text-slate-400">No tasks yet.</p>}
              {tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-800/80 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-sm text-slate-400">Priority: {task.priority ?? 'Medium'}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {task.status}
                    </span>
                  </div>
                  {task.due_date && <p className="mt-3 text-slate-400">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
