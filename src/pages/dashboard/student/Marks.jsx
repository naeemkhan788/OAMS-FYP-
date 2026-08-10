import { useState, useEffect } from 'react';
import { getMyMarks } from '../../../utils/api';

const flattenMarks = (groupedMarks = []) => {
  const rows = [];
  const excludedTypes = ['final', 'practical', 'projects', 'mid term', 'midterm'];
  
  groupedMarks.forEach((classGroup) => {
    Object.entries(classGroup.subjects || {}).forEach(([subjectName, assessments]) => {
      assessments.forEach((mark) => {
        const assessmentType = (mark.assessmentType || 'quiz').toLowerCase();
        // Skip excluded assessment types
        if (excludedTypes.includes(assessmentType)) {
          return;
        }
        rows.push({
          subject: subjectName,
          assessmentType: mark.assessmentType || 'quiz',
          title: mark.title || 'Assessment',
          marksObtained: mark.marksObtained || 0,
          maxMarks: mark.maxMarks || 100,
          percentage: mark.percentage || 0,
          grade: mark.grade || 'N/A',
          status: mark.isPublished ? 'completed' : 'pending',
          date: mark.assessmentDate ? new Date(mark.assessmentDate).toLocaleDateString() : 'N/A'
        });
      });
    });
  });
  return rows;
};

export default function Marks() {
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setLoading(true);
        const data = await getMyMarks();
        if (data.success) {
          setMarksData(flattenMarks(data.data?.marks || []));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-600 bg-green-50';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600 bg-blue-50';
    if (grade === 'C+' || grade === 'C') return 'text-yellow-600 bg-yellow-50';
    if (grade === 'D+' || grade === 'D') return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const completedMarks = marksData.filter(m => m.status === 'completed');
  const averagePercentage = completedMarks.length > 0
    ? completedMarks.reduce((acc, curr) => acc + curr.percentage, 0) / completedMarks.length
    : 0;
  const highestMark = completedMarks.length > 0
    ? Math.max(...completedMarks.map(m => m.percentage))
    : 0;

  // Calculate GPA from grades
  const gpa = completedMarks.length > 0
    ? completedMarks.reduce((acc, curr) => {
        let points = 0;
        if (curr.grade === 'A+') points = 4.0;
        else if (curr.grade === 'A') points = 4.0;
        else if (curr.grade === 'B+') points = 3.5;
        else if (curr.grade === 'B') points = 3.0;
        else if (curr.grade === 'C+') points = 2.5;
        else if (curr.grade === 'C') points = 2.0;
        else if (curr.grade === 'D+') points = 1.5;
        else if (curr.grade === 'D') points = 1.0;
        return acc + points;
      }, 0) / completedMarks.length
    : 0;

  // Grade distribution
  const gradeDistribution = {};
  completedMarks.forEach(m => {
    gradeDistribution[m.grade] = (gradeDistribution[m.grade] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Academic Performance</h1>
        <p className="text-gray-600">Track your marks and academic progress (Live Data)</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Marks</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{averagePercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Overall average</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">GPA</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{gpa.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Out of 4.0</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assessments</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{marksData.length}</p>
              <p className="text-sm text-gray-500 mt-1">{completedMarks.length} completed</p>
            </div>
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Highest Score</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{highestMark.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Best performance</p>
            </div>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Assessment Results</h2>
        {marksData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No marks available yet.</p>
            <p className="text-sm mt-1">Your assessment results will appear here once published.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marksData.map((mark, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">{mark.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{mark.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getScoreColor(mark.percentage)}`}>
                        {mark.marksObtained}/{mark.maxMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                mark.percentage >= 90 ? 'bg-green-500' :
                                mark.percentage >= 80 ? 'bg-blue-500' :
                                mark.percentage >= 70 ? 'bg-yellow-500' :
                                mark.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${mark.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(mark.percentage)}`}>
                          {mark.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(mark.grade)}`}>
                        {mark.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mark.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mark.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mark.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Distribution */}
      {completedMarks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Grade Distribution</h2>
          <div className="space-y-3">
            {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'].map((grade) => {
              const count = gradeDistribution[grade] || 0;
              const percentage = completedMarks.length > 0 ? (count / completedMarks.length) * 100 : 0;
              if (count === 0) return null;
              return (
                <div key={grade} className="flex items-center">
                  <div className="w-16 text-sm font-medium text-gray-700">{grade}</div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          grade.startsWith('A') ? 'bg-green-500' :
                          grade.startsWith('B') ? 'bg-blue-500' :
                          grade.startsWith('C') ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
