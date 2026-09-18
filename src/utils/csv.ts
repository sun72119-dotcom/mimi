import { Student } from '../types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 's-1', seatNumber: '01', name: '陳建宏' },
  { id: 's-2', seatNumber: '02', name: '林郁婷' },
  { id: 's-3', seatNumber: '03', name: '黃冠宇' },
  { id: 's-4', seatNumber: '04', name: '張雅雯' },
  { id: 's-5', seatNumber: '05', name: '李宗翰' },
  { id: 's-6', seatNumber: '06', name: '王詩涵' },
  { id: 's-7', seatNumber: '07', name: '吳家豪' },
  { id: 's-8', seatNumber: '08', name: '蔡欣怡' },
  { id: 's-9', seatNumber: '09', name: '劉子豪' },
  { id: 's-10', seatNumber: '10', name: '楊佩蓉' },
  { id: 's-11', seatNumber: '11', name: '許文傑' },
  { id: 's-12', seatNumber: '12', name: '鄭巧涵' },
  { id: 's-13', seatNumber: '13', name: '謝政宏' },
  { id: 's-14', seatNumber: '14', name: '郭宜靜' },
  { id: 's-15', seatNumber: '15', name: '洪偉哲' },
  { id: 's-16', seatNumber: '16', name: '曾品妍' },
  { id: 's-17', seatNumber: '18', name: '彭聖凱' },
  { id: 's-18', seatNumber: '19', name: '蘇若晴' },
  { id: 's-19', seatNumber: '20', name: '潘俊賢' },
  { id: 's-20', seatNumber: '21', name: '葉佳穎' },
  { id: 's-21', seatNumber: '22', name: '宋承軒' },
  { id: 's-22', seatNumber: '23', name: '鐘曼庭' },
  { id: 's-23', seatNumber: '24', name: '朱庭威' },
  { id: 's-24', seatNumber: '25', name: '廖依涵' },
];

/**
 * Parses raw text pasted by the teacher (comma-separated, newline-separated, numbered lines)
 */
export function parsePastedNames(text: string): Student[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const students: Student[] = [];
  let autoIndex = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line contains commas or tabs for multiple entries
    const parts = line.split(/[,\t;，、]/).map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (!part) continue;

      // Check if item has prefix numbers like "1. 張小明" or "01-李小華" or "1 李小華"
      const match = part.match(/^(\d+)[\.\s、\-:]*(.+)$/);
      let seatNum = String(autoIndex).padStart(2, '0');
      let name = part;

      if (match) {
        seatNum = match[1].padStart(2, '0');
        name = match[2].trim();
      }

      if (name) {
        students.push({
          id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          seatNumber: seatNum,
          name,
        });
        autoIndex++;
      }
    }
  }

  return students;
}

/**
 * Parses uploaded CSV file content into Student list
 */
export function parseCSVContent(csvText: string): Student[] {
  if (!csvText || !csvText.trim()) return [];

  // Remove potential BOM header
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const rawLines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (rawLines.length === 0) return [];

  const students: Student[] = [];
  let nameColIndex = -1;
  let seatColIndex = -1;
  let startIndex = 0;

  // Split lines accounting for possible quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // Inspect first line for header keywords
  const firstRow = parseLine(rawLines[0]);
  firstRow.forEach((col, idx) => {
    const lower = col.toLowerCase();
    if (['姓名', 'name', '學生姓名', '學生', 'student', 'student name'].includes(lower)) {
      nameColIndex = idx;
    }
    if (['座號', '學號', '編號', 'no', 'number', 'seat', 'id'].includes(lower)) {
      seatColIndex = idx;
    }
  });

  if (nameColIndex !== -1) {
    // There is a valid header row
    startIndex = 1;
  } else {
    // If no header found, assume:
    // If 1 column -> col 0 is name
    // If 2 columns -> if first is number, col 1 is name, else col 0 is name
    startIndex = 0;
    if (firstRow.length === 1) {
      nameColIndex = 0;
    } else if (firstRow.length >= 2) {
      if (/^\d+$/.test(firstRow[0])) {
        seatColIndex = 0;
        nameColIndex = 1;
      } else {
        nameColIndex = 0;
        seatColIndex = 1;
      }
    }
  }

  let autoNumber = 1;
  for (let i = startIndex; i < rawLines.length; i++) {
    const cols = parseLine(rawLines[i]);
    if (cols.length === 0) continue;

    const rawName = cols[nameColIndex] || cols[0];
    if (!rawName || !rawName.trim()) continue;

    const rawSeat = seatColIndex !== -1 && cols[seatColIndex]
      ? cols[seatColIndex].trim()
      : String(autoNumber).padStart(2, '0');

    students.push({
      id: `s-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      seatNumber: rawSeat,
      name: rawName.trim(),
    });
    autoNumber++;
  }

  return students;
}

/**
 * Export student list as CSV string with UTF-8 BOM for Excel
 */
export function exportToCSV(students: Student[]): string {
  const header = '座號,姓名\r\n';
  const rows = students.map((s) => `"${s.seatNumber || ''}","${s.name}"`).join('\r\n');
  return '\uFEFF' + header + rows;
}
