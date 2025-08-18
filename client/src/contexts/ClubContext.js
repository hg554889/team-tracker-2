import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import client from '../api/client';

const ClubContext = createContext();

export const ClubProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentClub, setCurrentClub] = useState(null);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [clubSettings, setClubSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // 사용자의 기본 동아리 설정
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // ADMIN은 기본적으로 currentClub을 null로 설정 (전체 보기)
    if (user.role === 'ADMIN') {
      setCurrentClub(null);
      loadAvailableClubs();
    } else if (user.clubId) {
      setCurrentClub(user.clubId);
      loadClubData(user.clubId, user);
    }
    
    setLoading(false);
  }, [user]);

  const loadClubData = async (clubId, currentUser = user) => {
    try {
      // ADMIN은 모든 clubId, EXECUTIVE는 자신의 clubId만 허용
      if (currentUser?.role === 'ADMIN' || 
          (currentUser?.role === 'EXECUTIVE' && clubId === currentUser?.clubId)) {
        const response = await client.get(`/club-settings/${clubId}`);
        setClubSettings(prev => ({
          ...prev,
          [clubId]: response.data
        }));
      } else {
        // 권한이 없는 경우 기본 설정 사용
        setClubSettings(prev => ({
          ...prev,
          [clubId]: getDefaultClubSettings()
        }));
      }
    } catch (error) {
      console.error('Failed to load club data:', error);
      // 에러인 경우 기본 설정 사용
      setClubSettings(prev => ({
        ...prev,
        [clubId]: getDefaultClubSettings()
      }));
    }
  };

  const loadAvailableClubs = async () => {
    try {
      const response = await client.get('/clubs');
      setAvailableClubs(response.data);
    } catch (error) {
      console.error('Failed to load available clubs:', error);
    }
  };

  const switchClub = async (clubId) => {
    if (user?.role !== 'ADMIN') {
      throw new Error('Only admins can switch clubs');
    }
    
    setCurrentClub(clubId);
    
    if (!clubSettings[clubId]) {
      await loadClubData(clubId);
    }
    
    // 대시보드 등 데이터 갱신을 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('clubChanged', { detail: { clubId } }));
  };

  const getCurrentClubSettings = () => {
    return clubSettings[currentClub] || getDefaultClubSettings();
  };

  const getDefaultClubSettings = () => ({
    reportSettings: {
      defaultDueDays: 7,
      allowLateSubmission: true,
      requireWeeklyReports: true,
      maxTeamSize: 10
    },
    teamSettings: {
      allowMemberCreateTeam: false,
      requireLeaderApproval: true,
      maxTeamsPerUser: 3
    },
    notificationSettings: {
      emailNotifications: true,
      dueDateReminders: true,
      reminderDaysBefore: 2
    },
    theme: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      logo: ''
    }
  });

  const updateClubSettings = async (clubId, newSettings) => {
    try {
      // ADMIN과 EXECUTIVE만 club settings 업데이트 허용
      if (!['ADMIN', 'EXECUTIVE'].includes(user?.role)) {
        throw new Error('Insufficient permissions to update club settings');
      }
      
      const response = await client.put(`/club-settings/${clubId}`, newSettings);
      setClubSettings(prev => ({
        ...prev,
        [clubId]: response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update club settings:', error);
      throw error;
    }
  };

  const isClubAccessible = (clubId) => {
    if (user?.role === 'ADMIN') return true;
    return user?.clubId === clubId;
  };

  const getClubDisplayName = (clubId) => {
    const club = availableClubs.find(c => c.key === clubId || c._id === clubId);
    return club?.name || clubId;
  };

  // 동아리별 권한 확인
  const hasClubPermission = (permission) => {
    const settings = getCurrentClubSettings();
    switch (permission) {
      case 'CREATE_TEAM':
        return user?.role !== 'MEMBER' || settings.teamSettings?.allowMemberCreateTeam;
      case 'MANAGE_USERS':
        return ['ADMIN', 'EXECUTIVE'].includes(user?.role);
      case 'VIEW_ALL_REPORTS':
        return ['ADMIN', 'EXECUTIVE', 'LEADER'].includes(user?.role);
      case 'EDIT_CLUB_SETTINGS':
        return ['ADMIN', 'EXECUTIVE'].includes(user?.role);
      default:
        return false;
    }
  };

  const value = {
    currentClub,
    availableClubs,
    clubSettings: getCurrentClubSettings(),
    loading,
    switchClub,
    updateClubSettings,
    isClubAccessible,
    getClubDisplayName,
    hasClubPermission,
    loadClubData,
    
    // 유틸리티 함수들
    isAdmin: user?.role === 'ADMIN',
    isExecutive: user?.role === 'EXECUTIVE',
    isLeader: user?.role === 'LEADER',
    isMember: user?.role === 'MEMBER',
    canSwitchClubs: user?.role === 'ADMIN'
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};