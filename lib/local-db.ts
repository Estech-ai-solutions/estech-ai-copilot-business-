import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'db');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage_logs.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile(filePath: string, defaultValue: any = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || JSON.stringify(defaultValue));
  } catch {
    return defaultValue;
  }
}

function writeFile(filePath: string, data: any) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const localDb = {
  users: () => readFile(USERS_FILE, []),
  profiles: () => readFile(PROFILES_FILE, []),
  knowledge: (businessProfileId?: number) => {
    const all = readFile(KNOWLEDGE_FILE, []);
    if (businessProfileId) {
      return all.filter((k: any) => k.business_profile_id === businessProfileId);
    }
    return all;
  },
  tasks: (businessProfileId?: number) => {
    const all = readFile(TASKS_FILE, []);
    if (businessProfileId) {
      return all.filter((t: any) => t.business_profile_id === businessProfileId);
    }
    return all;
  },
  documents: (businessProfileId?: number) => {
    const all = readFile(DOCUMENTS_FILE, []);
    if (businessProfileId) {
      return all.filter((d: any) => d.business_profile_id === businessProfileId);
    }
    return all;
  },
  usageLogs: (businessProfileId?: number) => {
    const all = readFile(USAGE_FILE, []);
    if (businessProfileId) {
      return all.filter((l: any) => l.business_profile_id === businessProfileId);
    }
    return all;
  },
  saveUsers: (data: any[]) => writeFile(USERS_FILE, data),
  saveProfiles: (data: any[]) => writeFile(PROFILES_FILE, data),
  saveKnowledge: (data: any[]) => writeFile(KNOWLEDGE_FILE, data),
  saveTasks: (data: any[]) => writeFile(TASKS_FILE, data),
  saveDocuments: (data: any[]) => writeFile(DOCUMENTS_FILE, data),
  saveUsageLogs: (data: any[]) => writeFile(USAGE_FILE, data)
};