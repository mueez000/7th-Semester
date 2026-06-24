import { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Clock, Calendar, 
  Trash2, Edit2, Play, Circle, CheckCircle2,
  X, AlertTriangle, Layers, Target, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TodoPage = () => {
  const { refreshGamification } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [showListModal, setShowListModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // For Detail Panel

  // Forms
  const [listForm, setListForm] = useState({ name: '', color: '#4F46E5' });
  const [taskForm, setTaskForm] = useState({ 
    title: '', description: '', dueDate: '', priority: 'medium', estimatedTime: '' 
  });

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [activeListId, lists]);

  const fetchLists = async () => {
    try {
      const res = await api.get('/todo/lists');
      if (res.data.success) {
        setLists(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load lists');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let endpoint = '/todo/tasks';
      if (activeListId !== 'all') {
        endpoint += `?listId=${activeListId}`;
      }
      const res = await api.get(endpoint);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/todo/lists', listForm);
      if (res.data.success) {
        toast.success('List created');
        setLists([...lists, res.data.data]);
        setShowListModal(false);
        setListForm({ name: '', color: '#4F46E5' });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error creating list');
      console.error('List creation error:', error.response?.data);
    }
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete list and all its tasks?')) return;
    try {
      await api.delete(`/todo/lists/${id}`);
      setLists(lists.filter(l => l._id !== id));
      if (activeListId === id) setActiveListId('all');
      toast.success('List deleted');
      refreshGamification();
    } catch (error) {
      toast.error('Error deleting list');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (activeListId === 'all' && !taskForm.listId) {
      toast.error('Please select a list first or from the form');
      return;
    }
    
    try {
      const payload = {
        ...taskForm,
        listId: taskForm.listId || (activeListId !== 'all' ? activeListId : lists[0]._id),
        estimatedTime: taskForm.estimatedTime ? Number(taskForm.estimatedTime) * 60 : null // Store as minutes in db
      };

      const res = await api.post('/todo/tasks', payload);
      if (res.data.success) {
        toast.success('Task created');
        setShowTaskModal(false);
        setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', estimatedTime: '' });
        fetchTasks();
        fetchLists(); // Update counts
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error creating task');
      console.error('Task creation error:', error.response?.data);
    }
  };

  const toggleTaskStatus = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic
    setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/todo/tasks/${task._id}`, { status: newStatus });
      refreshGamification();
    } catch (error) {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/todo/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      setActiveTask(null);
      toast.success('Task deleted');
      fetchLists();
      refreshGamification();
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] -mt-2 -mx-2">
      {/* LEFT SIDEBAR: LISTS */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full rounded-l-xl">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-tl-xl">
          <h2 className="font-bold text-gray-800 flex items-center">
            <Layers className="mr-2 text-indigo-600" size={20} /> My Lists
          </h2>
          <button onClick={() => setShowListModal(true)} className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <Plus size={18} />
          </button>
        </div>
        
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          <button 
            onClick={() => setActiveListId('all')}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors ${activeListId === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center"><Target size={16} className="mr-2" /> All Tasks</div>
            <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">
              {lists.reduce((acc, curr) => acc + (curr.pendingCount || 0), 0)}
            </span>
          </button>

          {lists.map(list => (
            <button 
              key={list._id}
              onClick={() => setActiveListId(list._id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors group ${activeListId === list._id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center truncate">
                <span className="w-3 h-3 rounded-full mr-3 border border-gray-200" style={{ backgroundColor: list.color }}></span>
                <span className="truncate max-w-[120px] text-left">{list.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 text-xs mr-2 opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteList(list._id, e)}>
                  <Trash2 size={14} className="hover:text-red-500" />
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                  {list.pendingCount || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT: TASKS */}
      <div className="flex-1 flex flex-col bg-gray-50 h-full relative">
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeListId === 'all' ? 'All Tasks' : lists.find(l => l._id === activeListId)?.name || 'List'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your professional tasks efficiently</p>
          </div>
          <button 
            onClick={() => setShowTaskModal(true)}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
          >
            <Plus size={18} className="mr-1" /> New Task
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center mt-10"><span className="text-gray-500">Loading tasks...</span></div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <CheckSquare size={48} className="opacity-20 mb-4" />
              <p className="text-lg font-medium text-gray-500">No tasks found</p>
              <p className="text-sm">Enjoy your zero inbox or create a new task!</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {/* Group by Pending / Completed ideally, simplified to one list sorted by date/priority */}
              {tasks.sort((a,b) => (a.status === 'completed' ? 1 : -1)).map((task) => (
                <div 
                  key={task._id} 
                  onClick={() => setActiveTask(task)}
                  className={`bg-white border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md ${task.status === 'completed' ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div className="flex items-start flex-1 min-w-0">
                    <button onClick={(e) => toggleTaskStatus(task, e)} className="mt-0.5 focus:outline-none flex-shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      ) : (
                        <Circle size={24} className="text-gray-300 hover:text-indigo-400 transition" />
                      )}
                    </button>
                    <div className="ml-4 truncate">
                      <h3 className={`text-base font-semibold truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1 text-xs font-medium text-gray-500">
                        {task.dueDate && (
                          <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs"><Calendar size={12} className="mr-1"/> {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs capitalize ${getPriorityColor(task.priority)}`}>
                          {task.priority || 'Medium'}
                        </span>
                        {task.estimatedTime > 0 && (
                          <span className="flex items-center text-indigo-600"><Clock size={12} className="mr-1"/> {(task.estimatedTime / 60).toFixed(1).replace(/\.0$/, '')}h est</span>
                        )}
                        {task.actualTime > 0 && (
                          <span className="flex items-center text-blue-600"><Play size={12} className="mr-1"/> {(task.actualTime / 60).toFixed(1).replace(/\.0$/, '')}h logged</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 ml-4 hidden sm:block" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TASK DETAIL PANEL (Right Sliding Drawer / Inline space) */}
      {activeTask && (
        <div className="w-full md:w-80 bg-white border-l border-gray-200 flex flex-col h-full absolute md:relative right-0 shadow-2xl md:shadow-none z-20 transition-transform">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Task Details</h3>
            <button onClick={() => setActiveTask(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><X size={18}/></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{activeTask.title}</h2>
              <div className="flex items-center space-x-2 mt-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${getPriorityColor(activeTask.priority)}`}>
                  {activeTask.priority} Priority
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${activeTask.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                  {activeTask.status}
                </span>
              </div>
            </div>

            {activeTask.description && (
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                {activeTask.description}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 flex items-center"><Calendar size={16} className="mr-2"/> Due Date</span>
                <span className="text-sm font-medium text-gray-800">{activeTask.dueDate ? format(new Date(activeTask.dueDate), 'MMM d, yyyy') : 'No Date'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 flex items-center"><Layers size={16} className="mr-2"/> List</span>
                <span className="text-sm font-medium text-gray-800">{lists.find(l => l._id === activeTask.listId)?.name || 'General'}</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl mt-4">
              <h4 className="font-semibold text-indigo-900 flex items-center mb-4"><Clock size={18} className="mr-2"/> Time Tracking</h4>
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <p className="text-xs text-indigo-500 mb-1 uppercase font-bold tracking-wider">Estimated</p>
                  <p className="text-xl font-bold text-indigo-900">{activeTask.estimatedTime ? `${(activeTask.estimatedTime / 60).toFixed(1).replace(/\.0$/, '')}h` : '--'}</p>
                </div>
                <div className="w-px bg-indigo-200"></div>
                <div className="text-center">
                  <p className="text-xs text-indigo-500 mb-1 uppercase font-bold tracking-wider">Actual Time</p>
                  <p className="text-xl font-bold text-indigo-900">{(activeTask.actualTime / 60).toFixed(1).replace(/\.0$/, '')}h</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/work?taskId=${activeTask._id}`)}
                className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-sm shadow-sm transition-all"
              >
                <Play fill="currentColor" size={16} className="mr-2"/> Start Timer
              </button>
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex justify-end">
               <button onClick={() => handleDeleteTask(activeTask._id)} className="text-sm text-red-600 hover:text-red-700 flex items-center font-medium">
                 <Trash2 size={16} className="mr-1"/> Delete Task
               </button>
            </div>
          </div>
        </div>
      )}

      {/* LIST MODAL */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New List</h2>
            <form onSubmit={handleCreateList}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                <input type="text" required value={listForm.name} onChange={(e) => setListForm({...listForm, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Work Projects" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Color / Tag</label>
                <input type="color" value={listForm.color} onChange={(e) => setListForm({...listForm, color: e.target.value})} className="w-full h-10 p-1 border border-gray-300 rounded-lg cursor-pointer" />
              </div>
              <div className="flex space-x-3 justify-end">
                <button type="button" onClick={() => setShowListModal(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm">Save List</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Target className="text-indigo-600 mr-2"/> Create Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input type="text" required value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="What needs to be done?" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea rows="3" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select List</label>
                  <select value={taskForm.listId || (activeListId !== 'all' ? activeListId : '')} onChange={(e) => setTaskForm({...taskForm, listId: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required>
                    {lists.length === 0 && <option value="">Create a list first</option>}
                    {activeListId === 'all' && !taskForm.listId && <option value="" disabled>Select...</option>}
                    {lists.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Est. Time <span className="text-gray-400 font-normal">(Hours)</span></label>
                  <input type="number" step="0.5" min="0.5" value={taskForm.estimatedTime} onChange={(e) => setTaskForm({...taskForm, estimatedTime: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="e.g. 1.5" />
                </div>
              </div>

              <div className="flex space-x-3 justify-end pt-4 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={lists.length === 0} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition disabled:opacity-50">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TodoPage;
