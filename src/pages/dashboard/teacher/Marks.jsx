import { useState, useEffect } from 'react';
import offlineService from '../../../services/offlineService';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const ASSESSMENTS = [
  { key: 'quiz', label: 'Quiz', max: 5 },
  { key: 'assignment', label: 'Assignment', max: 5 },
  { key: 'presentation', label: 'Presentation', max: 5 },
  { key: 'attendance', label: 'Attendance', max: 5 },
  { key: 'paper', label: 'Paper', max: 20 }
];
const MAX_MARKS = Object.fromEntries(ASSESSMENTS.map(a => [a.key, a.max]));
const TOTAL_MAX_MARKS = ASSESSMENTS.reduce((sum, a) => sum + a.max, 0);

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Marks() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentMarks, setStudentMarks] = useState({ quiz: '', assignment: '', presentation: '', attendance: '', paper: '' });
  const [markErrors, setMarkErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ status: '', count: 0 });

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync status changes
    const unsubscribe = offlineService.onSyncStatusChange((statusInfo) => {
      setSyncStatus(statusInfo);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Fetch teacher's classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        if (!isOnline) {
          const cachedClasses = await offlineService.getOfflineData('teacher_classes');
          if (cachedClasses && cachedClasses.data) {
            setClasses(cachedClasses.data);
            if (cachedClasses.data.length > 0) {
              setSelectedClass(cachedClasses.data[0]._id);
            }
          } else {
            setError('No internet connection and no cached class lists found.');
          }
          return;
        }

        const res = await fetch(`${API_BASE}/classes/teacher/my-classes`, { headers: authHeaders() });
        const data = await res.json();
        console.log('Classes API response:', data);
        if (data.success && data.data) {
          const classList = data.data.classes || data.data || [];
          setClasses(classList);
          await offlineService.saveOfflineData('teacher_classes', classList);
          if (classList.length > 0) {
            setSelectedClass(classList[0]._id);
          }
        } else {
          console.error('Failed to fetch classes:', data.message);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [isOnline]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      try {
        if (!isOnline) {
          const cachedStudents = await offlineService.getOfflineData(`class_students_${selectedClass}`);
          if (cachedStudents && cachedStudents.data) {
            setStudents(cachedStudents.data);
          } else {
            setStudents([]);
          }
          return;
        }

        const res = await fetch(`${API_BASE}/classes/${selectedClass}/students`, { headers: authHeaders() });
        const data = await res.json();
        console.log('Students API response:', data);
        if (data.success && data.data) {
          const studentsList = data.data.students || data.data || [];
          setStudents(studentsList);
          await offlineService.saveOfflineData(`class_students_${selectedClass}`, studentsList);
        } else {
          console.error('Failed to fetch students:', data.message);
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      }
    };
    fetchStudents();
    setSelectedStudent('');
    setStudentMarks({ quiz: '', assignment: '', presentation: '', attendance: '', paper: '' });
    setMarkErrors({});
  }, [selectedClass, isOnline]);

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    setStudentMarks({ quiz: '', assignment: '', presentation: '', attendance: '', paper: '' });
    setMarkErrors({});
  };

  const handleMarkChange = (assessment, value) => {
    if (value === '') {
      setStudentMarks(prev => ({ ...prev, [assessment]: '' }));
      setMarkErrors(prev => ({ ...prev, [assessment]: '' }));
      return;
    }

    const max = MAX_MARKS[assessment];
    const parsed = parseInt(value, 10) || 0;
    const numValue = Math.max(0, Math.min(max, parsed));
    setStudentMarks(prev => ({ ...prev, [assessment]: numValue.toString() }));
    setMarkErrors(prev => ({
      ...prev,
      [assessment]: parsed > max ? `Maximum allowed is ${max}` : ''
    }));
  };

  const saveStudentMarks = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    const student = students.find(s => s._id === selectedStudent);
    const classInfo = classes.find(c => c._id === selectedClass);
    const subject = classInfo?.subjects?.[0]?.name || classInfo?.name || 'General';

    // Check if offline
    if (!isOnline) {
      try {
        setSaving(true);
        // Save each assessment type as a mark entry offline
        const assessments = ASSESSMENTS.map(a => ({
          type: a.key,
          marks: parseInt(studentMarks[a.key]) || 0,
          max: a.max,
          title: `${subject} ${a.label}`
        }));

        let savedCount = 0;
        for (const assess of assessments) {
          if (assess.marks > 0) {
            const uniqueId = `${selectedClass}_${selectedStudent}_${assess.type}_${Date.now()}`;
            const record = {
              uniqueId,
              classId: selectedClass,
              studentId: selectedStudent,
              subject,
              assessmentType: assess.type,
              title: assess.title,
              marksObtained: assess.marks,
              maxMarks: assess.max,
              remarks: '',
              timestamp: Date.now()
            };
            await offlineService.saveOfflineMarks(record);
            savedCount++;
          }
        }

        if (savedCount > 0) {
          alert(`💾 Saved ${savedCount} marks record(s) offline! They will sync automatically when you're back online.`);
        } else {
          alert('No marks to save. Please enter marks for at least one assessment.');
        }
      } catch (err) {
        alert(`Error saving offline: ${err.message}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Online mode - save directly to backend
    try {
      setSaving(true);
      // Save each assessment type as a mark entry
      const assessments = ASSESSMENTS.map(a => ({
        type: a.key,
        marks: parseInt(studentMarks[a.key]) || 0,
        max: a.max,
        title: `${subject} ${a.label}`
      }));

      for (const assess of assessments) {
        if (assess.marks > 0) {
          const res = await fetch(`${API_BASE}/marks/add`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              classId: selectedClass,
              subject,
              assessmentType: assess.type,
              title: assess.title,
              marksData: [{
                studentId: selectedStudent,
                marksObtained: assess.marks,
                maxMarks: assess.max,
                remarks: ''
              }]
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || `Failed to save ${assess.type} marks`);
          }
        }
      }

      alert(`✅ Marks saved successfully for ${student.name}!`);
    } catch (err) {
      alert(`Error saving marks: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getTotalContinuousMarks = () =>
    ASSESSMENTS.reduce((sum, a) => sum + (parseInt(studentMarks[a.key]) || 0), 0);

  const getGrade = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    return 'F';
  };

  const selectedStudentData = students.find(s => s._id === selectedStudent);
  const totalMarks = getTotalContinuousMarks();
  const overallGrade = totalMarks > 0 ? getGrade(totalMarks, TOTAL_MAX_MARKS) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Marks Management</h1>
        <p className="text-gray-600">Upload and manage student assessment marks ({isOnline ? 'Live Mode' : 'Offline Cache'})</p>
      </div>

      {/* Network & Sync Status Header Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">You are currently offline</p>
              <p className="text-xs text-amber-700">Marks will be saved locally and synced automatically when you reconnect.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
            Offline Mode
          </span>
        </div>
      )}

      {syncStatus.status && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all duration-300 ${
          syncStatus.status === 'syncing' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          syncStatus.status === 'completed' ? 'bg-green-50 border-green-200 text-green-800' :
          syncStatus.status === 'failed' ? 'bg-red-50 border-red-200 text-red-800' :
          syncStatus.status === 'partial' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          syncStatus.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-lg">
              {syncStatus.status === 'syncing' ? '🔄' :
               syncStatus.status === 'completed' ? '✅' :
               syncStatus.status === 'failed' ? '❌' :
               syncStatus.status === 'partial' ? '⚠️' : '⏳'}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {syncStatus.status === 'syncing' ? 'Syncing local marks data...' :
                 syncStatus.status === 'completed' ? 'All local marks data synced!' :
                 syncStatus.status === 'failed' ? `Sync failed: ${syncStatus.error}` :
                 syncStatus.status === 'partial' ? `Partial sync: ${syncStatus.success} synced, ${syncStatus.failed} failed` :
                 syncStatus.status === 'pending' ? 'Offline marks records queued' : 'Local storage status'}
              </p>
              <p className="text-xs opacity-90">
                {syncStatus.status === 'syncing' ? `Uploading ${syncStatus.count} records...` :
                 syncStatus.status === 'completed' ? `Successfully synced ${syncStatus.count} records.` :
                 syncStatus.status === 'failed' ? 'Will retry when connection stabilizes.' :
                 syncStatus.status === 'partial' ? 'Failed records will retry automatically.' :
                 syncStatus.status === 'pending' ? `${syncStatus.count} unsynced record(s) waiting to sync.` : ''}
              </p>
            </div>
          </div>
          {syncStatus.status === 'syncing' && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">-- Select a Class --</option>
              {classes.length === 0 && <option value="" disabled>No classes available</option>}
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} {cls.code ? `(${cls.code})` : ''}
                </option>
              ))}
            </select>
            {classes.length === 0 && !loading && (
              <p className="text-xs text-red-500 mt-1">No classes found. Please contact admin to assign you to a class.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => handleStudentSelect(e.target.value)}
              disabled={!selectedClass || students.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Select a Student --</option>
              {students.length === 0 && selectedClass && <option value="" disabled>No students in this class</option>}
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.name} {student.studentId ? `(${student.studentId})` : student.email ? `(${student.email})` : ''}
                </option>
              ))}
            </select>
            {selectedClass && students.length === 0 && !loading && (
              <p className="text-xs text-orange-500 mt-1">No students found in this class. Please assign students first.</p>
            )}
          </div>
        </div>

        {selectedStudent && selectedStudentData && (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span> {selectedStudentData.name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">ID:</span> {selectedStudentData.studentId || 'N/A'}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span> {selectedStudentData.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Continuous Assessment Marks */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Continuous Assessment Marks</h4>
                <div className="space-y-4">
                  {ASSESSMENTS.map(item => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">{item.label} (Max: {item.max})</label>
                        <input
                          type="number" min="0" max={item.max}
                          value={studentMarks[item.key]}
                          onChange={(e) => handleMarkChange(item.key, e.target.value)}
                          className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${markErrors[item.key] ? 'border-red-400' : 'border-gray-300'}`}
                          placeholder="0"
                        />
                      </div>
                      {markErrors[item.key] && (
                        <p className="text-xs text-red-500 mt-1 text-right">{markErrors[item.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Marks Summary */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Marks Summary</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  {ASSESSMENTS.map(item => (
                    <div key={item.key} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{item.label}:</span>
                      <span className="text-sm text-gray-900">{studentMarks[item.key] || 0}/{item.max}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total:</span>
                      <span className="text-sm font-bold text-gray-900">{totalMarks}/{TOTAL_MAX_MARKS}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium text-gray-700">Grade:</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        overallGrade === 'A+' || overallGrade === 'A' ? 'bg-green-100 text-green-800' :
                        overallGrade === 'B+' || overallGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                        overallGrade === 'C+' || overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {overallGrade || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={saveStudentMarks}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Final Grade Calculation Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Final Grade Calculation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Continuous Assessment ({TOTAL_MAX_MARKS}%)</h3>
            <div className="space-y-1 text-sm">
              {ASSESSMENTS.map(item => (
                <div key={item.key} className="flex justify-between"><span>{item.label}:</span><span>{item.max} marks</span></div>
              ))}
              <div className="border-t border-blue-300 pt-1 mt-2">
                <div className="flex justify-between font-medium"><span>Total:</span><span>{TOTAL_MAX_MARKS} marks</span></div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Final Exams ({100 - TOTAL_MAX_MARKS}%)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Mid Term Exam:</span><span>100 marks</span></div>
              <div className="flex justify-between"><span>Final Term Exam:</span><span>100 marks</span></div>
              <div className="border-t border-green-300 pt-1 mt-2">
                <div className="flex justify-between font-medium"><span>Combined:</span><span>200 marks</span></div>
                <div className="flex justify-between font-medium"><span>Weight:</span><span>{100 - TOTAL_MAX_MARKS}%</span></div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">Overall Total</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Continuous Assessment:</span><span>{TOTAL_MAX_MARKS} marks</span></div>
              <div className="flex justify-between"><span>Final Exams:</span><span>{100 - TOTAL_MAX_MARKS} marks</span></div>
              <div className="border-t border-purple-300 pt-1 mt-2">
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>100 marks</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
