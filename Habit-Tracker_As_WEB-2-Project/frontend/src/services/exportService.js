import * as XLSX from 'xlsx';
import api from './api';

export const exportAllData = async () => {
  try {
    const res = await api.get('/export/all');
    if (!res.data.success) throw new Error('Failed to fetch export data');
    
    const { user, workSessions, todoTasks } = res.data.data;

    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['HabitFlow User Report'],
      ['Generated On', new Date().toLocaleDateString()],
      ['Name', user.name],
      ['Email', user.email],
      [''],
      ['Total Work Sessions', workSessions?.length || 0],
      ['Total Tasks', todoTasks?.length || 0],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // 2. Deep Work
    const workRows = (workSessions || []).map(w => ({
      Type: 'Deep Work',
      Date: new Date(w.startTime).toLocaleDateString(),
      DurationMins: Math.round(w.duration / 60),
      TaskId: w.taskId || 'None'
    }));
    const prodWs = XLSX.utils.json_to_sheet(workRows.sort((a,b) => new Date(a.Date) - new Date(b.Date)));
    XLSX.utils.book_append_sheet(wb, prodWs, 'Deep Work');

    // 3. Tasks
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

    // Save
    XLSX.writeFile(wb, `HabitFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export Error:', error);
    return false;
  }
};
