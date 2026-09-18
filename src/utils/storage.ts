import { Student } from '../types';
import { SAMPLE_STUDENTS } from './csv';

const STORAGE_KEY_STUDENTS = 'classroom_picker_students_v1';
const STORAGE_KEY_ALLOW_REPEAT = 'classroom_picker_allow_repeat_v1';
const STORAGE_KEY_DRAWN_IDS = 'classroom_picker_drawn_ids_v1';

export function loadSavedStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  // Default to sample students on first visit for seamless experience
  return SAMPLE_STUDENTS;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch {
    // Ignore
  }
}

export function loadSavedAllowRepeat(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALLOW_REPEAT);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return false; // Default: non-repeat (不重複抽取) as teachers usually want everyone to get picked
}

export function saveAllowRepeat(val: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_ALLOW_REPEAT, JSON.stringify(val));
  } catch {
    // Ignore
  }
}

export function loadSavedDrawnIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAWN_IDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // Ignore
  }
  return new Set();
}

export function saveDrawnIds(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY_DRAWN_IDS, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
}
