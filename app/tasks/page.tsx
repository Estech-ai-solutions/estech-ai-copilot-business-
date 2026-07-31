'use client';

import { useEffect, useState } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { CheckSquare, Plus, Trash2, Check, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { PageHeader, EmptyState, Section, Badge, Button, Input } from '@/components/ui';

type Task = { 
  id: number; 
  title: string; 
  status: 'Todo' | 'In Progress' | 'Done'; 
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string;
  created_at?: string;
};

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

function StatCardSimple({ 
  icon: Icon, 
  value, 
  label,
  iconColor,
  valueColor = 'text-text-heading'
}: { 
  icon: any; 
  value: string | number; 
  label: string;
  iconColor?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background-secondary/40 p-4 lg:p-5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <p className="text-xs text-text-muted">{label}</p>
      </div>
      <p className={cn('text-xl lg:text-2xl font-semibold', valueColor)}>{value}</p>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json();
      setTasks(json.tasks ?? []);
    } catch (e) {
      console.error(e);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask.trim() })
      });
      const json = await res.json();
      if (json.task) setTasks([json.task, ...tasks]);
      setNewTask('');
    } catch (e) {
      console.error(e);
      setError('Failed to add task');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function updateTaskStatus(id: number, status: Task['status']) {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    } catch (e) {
      console.error(e);
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'Todo');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <PageHeader 
            title="Task Manager"
            description="Organize and track your business priorities"
          />

          <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
            <StatCardSimple 
              icon={Clock} 
              value={todoTasks.length} 
              label="To Do" 
              iconColor="text-warning" 
            />
            <StatCardSimple 
              icon={ArrowUpRight} 
              value={inProgressTasks.length} 
              label="In Progress" 
              iconColor="text-primary" 
            />
            <StatCardSimple 
              icon={CheckSquare} 
              value={doneTasks.length} 
              label="Completed" 
              iconColor="text-success" 
              valueColor="text-success"
            />
          </div>

          <form onSubmit={handleAddTask} className="mb-6 flex flex-col sm:flex-row gap-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="w-full"
            />
            <Button 
              type="submit" 
              variant="primary"
              disabled={!newTask.trim()}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <Section title="All Tasks">
            <div className="space-y-2 max-h-[50vh] lg:max-h-[500px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="group flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3 text-sm transition hover:bg-surface/60"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => updateTaskStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition min-w-[44px] min-h-[44px] sm:min-w-5 sm:min-h-5 ${
                        task.status === 'Done' 
                          ? 'bg-success/20 border-success text-success' 
                          : 'border-border/60 hover:bg-surface/60'
                      }`}
                      title={task.status === 'Done' ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.status === 'Done' && <Check className="h-3 w-3" />}
                    </button>
                    <span className={cn('truncate flex-1', task.status === 'Done' ? 'text-text-muted line-through' : 'text-text-heading')}>
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{task.due_date}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(task.id)} 
                      className="rounded-lg p-1.5 text-text-muted hover:text-danger transition"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && !loading && (
                <EmptyState 
                  icon={CheckSquare}
                  title="No tasks yet"
                  description="Add your first task to get started"
                  action={
                    <Button variant="primary" onClick={() => {}} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add your first task
                    </Button>
                  }
                />
              )}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}