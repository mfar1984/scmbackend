export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export type UserRecord = {
  id: number; name: string; email: string; phone: string;
  role: string; status: UserStatus; lastLogin: string;
  department?: string; position?: string; joinDate?: string;
};

export const ROLES_LIST = ['Super Admin', 'HR Manager', 'Web Editor', 'HR Staff', 'Tender Officer', 'Viewer'];

export const ADMIN_USERS: UserRecord[] = [
  { id: 1, name: 'Ahmad Faris',  email: 'ahmad.faris@atline.com.my',  phone: '012-345 6789', role: 'Super Admin', status: 'Active',   lastLogin: '15 Jan 2026, 09:12 am', department: 'Management', position: 'System Administrator', joinDate: '01 Jan 2024' },
  { id: 2, name: 'Nurul Izzati', email: 'nurul.izzati@atline.com.my', phone: '011-234 5678', role: 'Super Admin', status: 'Active',   lastLogin: '14 Jan 2026, 04:45 pm', department: 'Management', position: 'IT Manager',           joinDate: '15 Mar 2024' },
  { id: 3, name: 'Razif Hakim',  email: 'razif.hakim@atline.com.my',  phone: '019-876 5432', role: 'Super Admin', status: 'Inactive', lastLogin: '01 Dec 2025, 11:00 am', department: 'Management', position: 'System Administrator', joinDate: '01 Jun 2024' },
];

export const STAFF_USERS: UserRecord[] = [
  { id: 4, name: 'Siti Nabilah',    email: 'siti.nabilah@atline.com.my',  phone: '013-456 7890', role: 'HR Manager', status: 'Active',    lastLogin: '15 Jan 2026, 08:30 am', department: 'Human Resources', position: 'HR Manager',   joinDate: '01 Feb 2024' },
  { id: 5, name: 'Hafizuddin',      email: 'hafizuddin@atline.com.my',    phone: '017-654 3210', role: 'Web Editor', status: 'Active',    lastLogin: '13 Jan 2026, 02:15 pm', department: 'Marketing',       position: 'Web Editor',   joinDate: '15 Apr 2024' },
  { id: 6, name: 'Amirah Zulaikha', email: 'amirah.z@atline.com.my',      phone: '016-789 0123', role: 'HR Staff',   status: 'Active',    lastLogin: '12 Jan 2026, 10:00 am', department: 'Human Resources', position: 'HR Executive', joinDate: '01 May 2024' },
  { id: 7, name: 'Khairul Anwar',   email: 'khairul.anwar@atline.com.my', phone: '018-321 0987', role: 'HR Staff',   status: 'Suspended', lastLogin: '05 Nov 2025, 09:00 am', department: 'Human Resources', position: 'HR Assistant', joinDate: '01 Jul 2024' },
];

export const CLIENT_USERS: UserRecord[] = [
  { id: 8,  name: 'Politeknik KL',     email: 'ict@politeknik.edu.my',  phone: '03-1234 5678', role: 'Viewer', status: 'Active',   lastLogin: '10 Jan 2026, 03:00 pm' },
  { id: 9,  name: 'Kolej Komuniti SJ', email: 'admin@kksj.edu.my',      phone: '03-8765 4321', role: 'Viewer', status: 'Active',   lastLogin: '08 Jan 2026, 11:30 am' },
  { id: 10, name: 'Syarikat ABC Sdn',  email: 'procurement@abc.com.my', phone: '03-5678 9012', role: 'Viewer', status: 'Inactive', lastLogin: '20 Dec 2025, 09:45 am' },
];

export const TAB_COUNTS = {
  administrator: ADMIN_USERS.length,
  staff:         STAFF_USERS.length,
  client:        CLIENT_USERS.length,
};
