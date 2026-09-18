export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
  drawn?: boolean;
}

export interface DrawRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: string;
  members: Student[];
}

export type GroupingMethod = 'byMembers' | 'byGroupCount';
export type RemainderHandling = 'distribute' | 'separate';
