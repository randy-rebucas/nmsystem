'use client';

import { useEffect, useState } from 'react';

interface GenealogyUser {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActivated: boolean;
  };
  level: number;
}

interface DownlineUser {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActivated: boolean;
  };
  level: number;
}

export default function GenealogyPage() {
  const [upline, setUpline] = useState<GenealogyUser[]>([]);
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [directReferrals, setDirectReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upline' | 'downline' | 'journey'>('upline');
  const [journey, setJourney] = useState<GenealogyUser[] | null>(null);
  const [selectedDownlineUserId, setSelectedDownlineUserId] = useState<string>('');
  const [journeyLoading, setJourneyLoading] = useState(false);

  useEffect(() => {
    fetchGenealogy();
  }, []);

  const fetchGenealogy = async () => {
    try {
      const [uplineRes, downlineRes] = await Promise.all([
        fetch('/api/genealogy?type=upline'),
        fetch('/api/genealogy?type=downline'),
      ]);

      if (uplineRes.ok) {
        const uplineData = await uplineRes.json();
        setUpline(uplineData.genealogy || []);
      }

      if (downlineRes.ok) {
        const downlineData = await downlineRes.json();
        setDownline(downlineData.downline || []);
        setDirectReferrals(downlineData.directReferrals || []);
      }
    } catch (error) {
      console.error('Error fetching genealogy:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJourney = async (targetUserId: string) => {
    if (!targetUserId) {
      setJourney(null);
      return;
    }

    setJourneyLoading(true);
    try {
      const response = await fetch(
        `/api/genealogy?type=journey&journeyUserId=${targetUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey || null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to fetch journey');
        setJourney(null);
      }
    } catch (error) {
      console.error('Error fetching journey:', error);
      setJourney(null);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleJourneySearch = () => {
    if (selectedDownlineUserId) {
      fetchJourney(selectedDownlineUserId);
      setActiveTab('journey');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading genealogy...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Genealogy Tree</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upline ({upline.length})
            </button>
            <button
              onClick={() => setActiveTab('downline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'downline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Downline ({downline.length})
            </button>
            <button
              onClick={() => setActiveTab('journey')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'journey'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Journey to Downline
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'journey' ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Journey to Become Downline</h2>
          <p className="text-gray-600 mb-4">
            Select a downline member to see the path showing how they became part of your network.
          </p>

          <div className="mb-6 flex gap-4">
            <select
              value={selectedDownlineUserId}
              onChange={(e) => setSelectedDownlineUserId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a downline member...</option>
              {downline.map((item) => (
                <option key={item.user._id} value={item.user._id}>
                  {item.user.firstName} {item.user.lastName} ({item.user.email}) - Level {item.level}
                </option>
              ))}
            </select>
            <button
              onClick={handleJourneySearch}
              disabled={!selectedDownlineUserId || journeyLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {journeyLoading ? 'Loading...' : 'Show Journey'}
            </button>
          </div>

          {journeyLoading ? (
            <div className="text-center py-8">Loading journey...</div>
          ) : journey && journey.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-blue-800">
                  This shows the path from you to the selected downline member, showing how they became part of your network.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Journey Path Visualization */}
                {journey.map((item, index) => (
                  <div key={item.user._id}>
                    <div className="flex items-start gap-4">
                      {/* Level Indicator */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-white ${
                        item.level === 0 
                          ? 'bg-blue-600' 
                          : index === journey.length - 1
                          ? 'bg-green-600'
                          : 'bg-gray-500'
                      }`}>
                        {item.level === 0 ? 'You' : item.level}
                      </div>
                      
                      {/* User Card */}
                      <div className={`flex-1 border-2 rounded-lg p-4 shadow-md ${
                        item.level === 0 
                          ? 'border-blue-500 bg-blue-50' 
                          : index === journey.length - 1
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-white'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg mb-1">
                              {item.user.firstName} {item.user.lastName}
                              {item.level === 0 && (
                                <span className="ml-2 text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
                                  (You - Starting Point)
                                </span>
                              )}
                              {index === journey.length - 1 && item.level !== 0 && (
                                <span className="ml-2 text-xs bg-green-200 text-green-900 px-2 py-1 rounded">
                                  (Target Downline)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {item.user.email}
                            </div>
                            <div className="flex items-center gap-4">
                              <div
                                className={`text-sm font-medium ${
                                  item.user.isActivated
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {item.user.isActivated ? '✓ Activated' : '✗ Not Activated'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Level {item.level} in your network
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow between levels */}
                    {index < journey.length - 1 && (
                      <div className="flex justify-center my-3">
                        <div className="flex flex-col items-center">
                          <div className="text-blue-500 text-3xl font-bold">↓</div>
                          <div className="text-xs text-gray-500 mt-1 bg-blue-100 px-3 py-1 rounded">
                            Sponsored by {item.user.firstName} {item.user.lastName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Journey Summary:</strong> This path shows {journey.length - 1} level(s) of sponsorship 
                  from you to the selected downline member. Each level represents a direct referral relationship.
                </p>
              </div>
            </div>
          ) : journey === null && selectedDownlineUserId ? (
            <div className="text-center py-8 text-gray-600">
              No journey found. Please select a valid downline member.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a downline member above to view their journey.
            </div>
          )}
        </div>
      ) : activeTab === 'upline' ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Upline (Sponsors)</h2>
          {upline.length === 0 ? (
            <p className="text-gray-600">No upline found.</p>
          ) : (
            <div className="space-y-4">
              {upline.map((item, index) => (
                <div
                  key={item.user._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {item.user.firstName} {item.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.user.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-500">
                        Level {item.level === 0 ? '0 (You)' : item.level}
                      </div>
                      <div
                        className={`text-sm ${
                          item.user.isActivated
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.user.isActivated ? 'Activated' : 'Not Activated'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Direct Referrals ({directReferrals.length})
            </h2>
            {directReferrals.length === 0 ? (
              <p className="text-gray-600">No direct referrals yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {directReferrals.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => {
                      setSelectedDownlineUserId(user._id);
                      fetchJourney(user._id);
                      setActiveTab('journey');
                    }}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div
                      className={`text-sm mt-2 ${
                        user.isActivated
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {user.isActivated ? 'Activated' : 'Not Activated'}
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      Click to view journey →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Complete Downline ({downline.length})
            </h2>
            {downline.length === 0 ? (
              <p className="text-gray-600">No downline members yet.</p>
            ) : (
              <div className="space-y-2">
                {downline.map((item) => (
                  <div
                    key={item.user._id}
                    onClick={() => {
                      setSelectedDownlineUserId(item.user._id);
                      fetchJourney(item.user._id);
                      setActiveTab('journey');
                    }}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {item.user.firstName} {item.user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.user.email}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Click to view journey →
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500">
                          Level {item.level}
                        </div>
                        <div
                          className={`text-sm ${
                            item.user.isActivated
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.user.isActivated
                            ? 'Activated'
                            : 'Not Activated'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

