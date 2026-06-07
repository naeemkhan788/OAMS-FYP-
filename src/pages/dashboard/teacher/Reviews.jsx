import { useState } from 'react';

export default function Reviews() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  const reviews = [
    {
      id: 1,
      studentName: 'Alice Johnson',
      studentId: 'STU001',
      subject: 'Computer Science 101',
      rating: 5,
      comment: 'Dr. Doe is an exceptional professor! His teaching style is very clear and engaging. He always takes time to explain complex concepts and is very approachable for doubts.',
      date: '2024-03-07',
      helpful: 12,
      verified: true,
      semester: 'Spring 2024'
    },
    {
      id: 2,
      studentName: 'Bob Smith',
      studentId: 'STU002',
      subject: 'Data Structures 201',
      rating: 4,
      comment: 'Good professor with deep knowledge of the subject. Sometimes the pace is a bit fast, but overall very effective teaching. Provides good study materials.',
      date: '2024-03-06',
      helpful: 8,
      verified: true,
      semester: 'Spring 2024'
    },
    {
      id: 3,
      studentName: 'Carol White',
      studentId: 'STU003',
      subject: 'Algorithm Design 301',
      rating: 5,
      comment: 'Amazing professor! Very patient and always willing to help students. The practical examples and real-world applications make the subject very interesting.',
      date: '2024-03-06',
      helpful: 15,
      verified: true,
      semester: 'Spring 2024'
    },
    {
      id: 4,
      studentName: 'David Brown',
      studentId: 'STU004',
      subject: 'Web Development 401',
      rating: 3,
      comment: 'Professor knows the subject well but sometimes goes off-topic. Could be more structured in teaching approach. Grading is fair though.',
      date: '2024-03-05',
      helpful: 5,
      verified: true,
      semester: 'Fall 2023'
    },
    {
      id: 5,
      studentName: 'Emma Davis',
      studentId: 'STU005',
      subject: 'Computer Science 101',
      rating: 5,
      comment: 'Best professor I\'ve had! Makes programming so much fun and easy to understand. Always available for extra help and responds to emails quickly.',
      date: '2024-03-04',
      helpful: 18,
      verified: true,
      semester: 'Spring 2024'
    },
    {
      id: 6,
      studentName: 'Frank Miller',
      studentId: 'STU006',
      subject: 'Data Structures 201',
      rating: 4,
      comment: 'Very knowledgeable and experienced. The assignments are challenging but help in learning. Could improve on providing more feedback.',
      date: '2024-03-03',
      helpful: 7,
      verified: true,
      semester: 'Spring 2024'
    },
  ];

  const filteredReviews = reviews.filter(review => {
    const ratingMatch = selectedRating === 'all' || review.rating.toString() === selectedRating;
    const filterMatch = selectedFilter === 'all' || 
      (selectedFilter === 'recent' && new Date(review.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (selectedFilter === 'verified' && review.verified);
    return ratingMatch && filterMatch;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const getAverageRating = () => {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const distribution = getRatingDistribution();
  const averageRating = getAverageRating();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Student Reviews</h1>
        <p className="text-gray-600">View and manage student feedback and ratings</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{averageRating}</p>
              <div className="flex mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{reviews.length}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">5 Star Reviews</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{distribution[5]}</p>
              <p className="text-sm text-gray-500 mt-1">{((distribution[5] / reviews.length) * 100).toFixed(0)}%</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">87%</p>
              <p className="text-sm text-gray-500 mt-1">Good engagement</p>
            </div>
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = distribution[rating];
              const percentage = (count / reviews.length) * 100;
              return (
                <div key={rating} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <span className="text-yellow-400 ml-1">★</span>
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rating === 5 ? 'bg-green-500' :
                          rating === 4 ? 'bg-blue-500' :
                          rating === 3 ? 'bg-yellow-500' :
                          rating === 2 ? 'bg-orange-500' : 'bg-red-500'
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

        {/* Recent Reviews */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Reviews</h2>
            <div className="flex space-x-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Reviews</option>
                <option value="recent">Recent</option>
                <option value="verified">Verified</option>
              </select>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-primary-900">{review.studentName}</h3>
                      {review.verified && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{review.subject} • {review.date}</p>
                  </div>
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👍 {review.helpful} helpful</span>
                    <span>ID: {review.studentId}</span>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Review Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👍</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Strengths</h3>
            <p className="text-xs text-gray-600">Clear explanations, approachable, knowledgeable</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Teaching Style</h3>
            <p className="text-xs text-gray-600">Interactive, practical examples, engaging</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Areas to Improve</h3>
            <p className="text-xs text-gray-600">Pacing, more feedback, structure</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Reviews
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics Report
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Survey
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
}
