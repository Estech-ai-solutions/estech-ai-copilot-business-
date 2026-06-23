'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { CheckSquare, Plus } from 'lucide-react';

type Task = { id: number; title: string; status: string; priority?: string; due_date?: string | null };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
      const json = await res.json();
      setTasks(json.tasks ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => { loadTasks(); }, []);

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
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Task Manager</h1>
            </div>
            <p className="mt-2 text-slate-400">
              Turn ideas into action items and stay on track.
            </p>
          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Task List */}
            <div className="lg:col-span-2">
              <form onSubmit={handleAddTask} className="mb-6 flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                  placeholder="New task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {tasks.length === 0 && <p className="text-slate-400">No tasks yet. Add one above.</p>}
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-400">Priority: {task.priority ?? 'Medium'}</p>
                    </div>
                    <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Overview</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <span className="text-2xl font-semibold text-white">{tasks.length}</span>
                  <span className="ml-2 text-sm text-slate-400">Total tasks</span>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-white">{tasks.filter(t => t.status === 'Pending').length}</span>
                  <span className="ml-2 text-sm text-slate-400">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}