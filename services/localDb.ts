import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface LocalDbData {
  pets: any[];
  reports: any[];
  report_items: any[];
  appointments: any[];
  users: any[];
}

function readDb(): LocalDbData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: LocalDbData = {
        pets: [],
        reports: [],
        report_items: [],
        appointments: [],
        users: [
          { id: "admin-default-id-000000000000000000", username: "admin", password: "admin", role: "admin", createdAt: new Date().toISOString() }
        ]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading local JSON db:', e);
    return { pets: [], reports: [], report_items: [], appointments: [], users: [] };
  }
}

function writeDb(data: LocalDbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local JSON db:', e);
  }
}

export async function executeLocalQuery(sql: string, params: any[] = []): Promise<[any[], any]> {
  const db = readDb();
  const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT * FROM pets ORDER BY createdAt DESC
  if (normalizedSql.startsWith('select * from pets order by') || normalizedSql === 'select * from pets') {
    const sorted = [...db.pets].map(p => ({
      ...p,
      age: Number(p.age) || 0,
      ageMonths: Number(p.ageMonths) || 0
    })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return [sorted, null];
  }

  // 2. INSERT INTO pets
  if (normalizedSql.startsWith('insert into pets')) {
    let id, name, type, breed, age, ageMonths, clinicName, skullType;
    if (params.length === 8) {
      [id, name, type, breed, age, ageMonths, clinicName, skullType] = params;
    } else {
      [id, name, type, breed, age, clinicName, skullType] = params;
      ageMonths = 0;
    }
    const newPet = {
      id,
      name,
      type,
      breed,
      age: Number(age) || 0,
      ageMonths: Number(ageMonths) || 0,
      clinicName,
      skullType,
      createdAt: new Date().toISOString()
    };
    db.pets = db.pets.filter(p => p.id !== id);
    db.pets.push(newPet);
    writeDb(db);
    return [[newPet], null];
  }

  // 3. UPDATE pets
  if (normalizedSql.startsWith('update pets set')) {
    let name, type, breed, age, ageMonths, clinicName, skullType, id;
    if (params.length === 8) {
      [name, type, breed, age, ageMonths, clinicName, skullType, id] = params;
    } else {
      [name, type, breed, age, clinicName, skullType, id] = params;
      ageMonths = 0;
    }
    const pet = db.pets.find(p => p.id === id);
    if (pet) {
      pet.name = name;
      pet.type = type;
      pet.breed = breed;
      pet.age = Number(age) || 0;
      pet.ageMonths = Number(ageMonths) || 0;
      pet.clinicName = clinicName;
      pet.skullType = skullType;
      writeDb(db);
    }
    return [[pet || null], null];
  }

  // 4. DELETE FROM pets
  if (normalizedSql.startsWith('delete from pets where id = ?')) {
    const [id] = params;
    db.pets = db.pets.filter(p => p.id !== id);
    const reportIds = db.reports.filter(r => r.petId === id).map(r => r.id);
    db.reports = db.reports.filter(r => r.petId !== id);
    db.report_items = db.report_items.filter(item => !reportIds.includes(item.reportId));
    db.appointments = db.appointments.filter(a => a.petId !== id);
    writeDb(db);
    return [[{ affectedRows: 1 }], null];
  }

  // 5. SELECT * FROM reports ORDER BY date DESC
  if (normalizedSql.startsWith('select * from reports order by date desc')) {
    const sorted = [...db.reports].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return [sorted, null];
  }

  // 6. SELECT * FROM reports WHERE id = ?
  if (normalizedSql.startsWith('select * from reports where id = ?')) {
    const [id] = params;
    const report = db.reports.find(r => r.id === id);
    return [report ? [report] : [], null];
  }

  // 7. SELECT * FROM reports WHERE petId = ? ORDER BY date DESC
  if (normalizedSql.startsWith('select * from reports where petid = ?')) {
    const [petId] = params;
    const filtered = db.reports
      .filter(r => r.petId === petId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return [filtered, null];
  }

  // 8. INSERT INTO reports
  if (normalizedSql.startsWith('insert into reports')) {
    const [id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes] = params;
    const existingIndex = db.reports.findIndex(r => r.id === id);
    const reportObj = {
      id,
      petId,
      date,
      clinicalHistory,
      recommendedTreatment,
      otherComments,
      notes,
      createdAt: existingIndex >= 0 ? db.reports[existingIndex].createdAt : new Date().toISOString()
    };
    if (existingIndex >= 0) {
      db.reports[existingIndex] = reportObj;
    } else {
      db.reports.push(reportObj);
    }
    writeDb(db);
    return [[reportObj], null];
  }

  // 9. SELECT * FROM report_items
  if (normalizedSql.startsWith('select * from report_items where reportid = ?')) {
    const [reportId] = params;
    const filtered = db.report_items
      .filter(item => item.reportId === reportId)
      .sort((a, b) => {
        const posA = a.position !== undefined ? a.position : 0;
        const posB = b.position !== undefined ? b.position : 0;
        if (posA !== posB) return posA - posB;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
    return [filtered, null];
  }

  // 10. INSERT INTO report_items
  if (normalizedSql.startsWith('insert into report_items')) {
    const [id, reportId, imageData, description, rotation, isMirrored, position] = params;
    const existingIndex = db.report_items.findIndex(item => item.id === id);
    const itemObj = {
      id,
      reportId,
      imageData,
      description,
      rotation,
      isMirrored: isMirrored === 1 || isMirrored === true,
      position: position !== undefined ? position : 0,
      createdAt: existingIndex >= 0 ? db.report_items[existingIndex].createdAt : new Date().toISOString()
    };
    if (existingIndex >= 0) {
      db.report_items[existingIndex] = itemObj;
    } else {
      db.report_items.push(itemObj);
    }
    writeDb(db);
    return [[itemObj], null];
  }

  // 11. UPDATE report_items position
  if (normalizedSql.startsWith('update report_items set position = ?')) {
    const [position, id] = params;
    const item = db.report_items.find(item => item.id === id);
    if (item) {
      item.position = position;
      writeDb(db);
    }
    return [[item || null], null];
  }

  // 12. DELETE FROM report_items
  if (normalizedSql.startsWith('delete from report_items where id = ?')) {
    const [id] = params;
    db.report_items = db.report_items.filter(item => item.id !== id);
    writeDb(db);
    return [[{ affectedRows: 1 }], null];
  }

  // 13. SELECT * FROM appointments
  if (normalizedSql.startsWith('select * from appointments order by')) {
    const sorted = [...db.appointments].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    return [sorted, null];
  }

  // 14. INSERT INTO appointments
  if (normalizedSql.startsWith('insert into appointments')) {
    const [id, petId, petName, clinicName, date, time, service, status] = params;
    const existingIndex = db.appointments.findIndex(a => a.id === id);
    const appObj = {
      id,
      petId,
      petName,
      clinicName,
      date,
      time,
      service,
      status,
      createdAt: existingIndex >= 0 ? db.appointments[existingIndex].createdAt : new Date().toISOString()
    };
    if (existingIndex >= 0) {
      db.appointments[existingIndex] = appObj;
    } else {
      db.appointments.push(appObj);
    }
    writeDb(db);
    return [[appObj], null];
  }

  // 15. DELETE FROM appointments
  if (normalizedSql.startsWith('delete from appointments where id = ?')) {
    const [id] = params;
    db.appointments = db.appointments.filter(a => a.id !== id);
    writeDb(db);
    return [[{ affectedRows: 1 }], null];
  }

  // 16. SELECT * FROM users WHERE username = ? AND password = ?
  if (normalizedSql.startsWith('select * from users where username = ? and password = ?')) {
    const [username, password] = params;
    const matched = db.users.find(u => u.username === username && u.password === password);
    return [matched ? [matched] : [], null];
  }

  // 17. UPDATE users SET password = ? WHERE username = ?
  if (normalizedSql.startsWith('update users set password = ? where username = ?')) {
    const [password, username] = params;
    const user = db.users.find(u => u.username === username);
    if (user) {
      user.password = password;
      writeDb(db);
    }
    return [[user || null], null];
  }

  // 18. SELECT Assistants
  if (normalizedSql.includes('where role = "assistant"') || normalizedSql.includes("where role = 'assistant'")) {
    const filtered = db.users
      .filter(u => u.role === 'assistant')
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return [filtered, null];
  }

  // 19. SELECT id FROM users WHERE username = ?
  if (normalizedSql.startsWith('select id from users where username = ?')) {
    const [username] = params;
    const user = db.users.find(u => u.username === username);
    return [user ? [{ id: user.id }] : [], null];
  }

  // 20. INSERT INTO users
  if (normalizedSql.startsWith('insert into users')) {
    const [id, username, password, role] = params;
    const existingIndex = db.users.findIndex(u => u.username === username);
    const userObj = {
      id,
      username,
      password,
      role: role || 'assistant',
      createdAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      db.users[existingIndex] = userObj;
    } else {
      db.users.push(userObj);
    }
    writeDb(db);
    return [[userObj], null];
  }

  // 21. UPDATE users SET password = ? WHERE id = ?
  if (normalizedSql.startsWith('update users set password = ? where id = ?')) {
    const [password, id] = params;
    const user = db.users.find(u => u.id === id);
    if (user) {
      user.password = password;
      writeDb(db);
    }
    return [[user || null], null];
  }

  // 22. DELETE FROM users
  if (normalizedSql.startsWith('delete from users where id = ?')) {
    const [id] = params;
    db.users = db.users.filter(u => u.id !== id);
    writeDb(db);
    return [[{ affectedRows: 1 }], null];
  }

  if (normalizedSql.startsWith('create table')) {
    return [[], null];
  }

  console.warn('Unhandled local fallback SQL query:', sql, params);
  return [[], null];
}
