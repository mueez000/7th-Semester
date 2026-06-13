import * as XLSX from 'xlsx';
import api from './api';

export const exportAllData = async () => {
  try {
    const res = await api.get('/export/all');
    if (!res.data.success) throw new Error('Failed to fetch export data');
    
    const { user, namazLogs, workSessions, exerciseLogs, todoTasks } = res.data.data;

    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['HabitFlow User Report'],
      ['Generated On', new Date().toLocaleDateString()],
      ['Name', user.name],
      ['Email', user.email],
      ['Current Level', user.level],
      ['Total XP', user.xp],
      [''],
      ['Total Namaz Logs', namazLogs?.length || 0],
      ['Total Work Sessions', workSessions?.length || 0],
      ['Total Exercise Logs', exerciseLogs?.length || 0]
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // 2. Namaz
    const namazRows = (namazLogs || []).map(l => ({
      Date: new Date(l.date).toLocaleDateString(),
      Fajr: l.fajr ? 'Yes' : 'No',
      Zuhr: l.zuhr ? 'Yes' : 'No',
      Asr: l.asr ? 'Yes' : 'No',
      Maghrib: l.maghrib ? 'Yes' : 'No',
      Isha: l.isha ? 'Yes' : 'No',
      Total: [l.fajr, l.zuhr, l.asr, l.maghrib, l.isha].filter(Boolean).length
    }));
    const namazWs = XLSX.utils.json_to_sheet(namazRows);
    XLSX.utils.book_append_sheet(wb, namazWs, 'Namaz');

    // 3. Productivity (Work)
    const workRows = (workSessions || []).map(w => ({
      Type: 'Deep Work',
      Date: new Date(w.startTime).toLocaleDateString(),
      DurationMins: Math.round(w.duration / 60),
      TaskId: w.taskId || 'None'
    }));
    const prodWs = XLSX.utils.json_to_sheet(workRows.sort((a,b) => new Date(a.Date) - new Date(b.Date)));
    XLSX.utils.book_append_sheet(wb, prodWs, 'Productivity');

    // 4. Tasks
    const taskRows = (todoTasks || []).map(t => ({
      Title: t.title,
      Priority: t.priority,
      Status: t.status,
      EstimatedTimeMins: t.estimatedTime || 0,
      ActualTimeMins: t.actualTime || 0,
      Created: new Date(t.createdAt).toLocaleDateString(),
      CompletedDate: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'N/A'
    }));
    const taskWs = XLSX.utils.json_to_sheet(taskRows);
    XLSX.utils.book_append_sheet(wb, taskWs, 'Tasks');

    // 5. Exercise
    const exerciseRows = (exerciseLogs || []).map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Activity: e.activityType,
      DurationMins: e.duration,
      DistanceKm: e.distance || 0,
      Calories: e.calories || 0
    }));
    const exWs = XLSX.utils.json_to_sheet(exerciseRows);
    XLSX.utils.book_append_sheet(wb, exWs, 'Exercise');

    // Save
    XLSX.writeFile(wb, `HabitFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export Error:', error);
    return false;
  }
};
