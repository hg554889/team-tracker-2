import React, { useState } from 'react';
import { useClub } from '../contexts/ClubContext';

export default function ClubSwitcher() {
  const { 
    currentClub, 
    availableClubs, 
    canSwitchClubs, 
    switchClub, 
    getClubDisplayName,
    loading 
  } = useClub();
  
  const [switching, setSwitching] = useState(false);

  if (!canSwitchClubs || loading) {
    return null;
  }

  const handleClubSwitch = async (clubId) => {
    if (clubId === currentClub) return;
    
    setSwitching(true);
    try {
      await switchClub(clubId);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: `${getClubDisplayName(clubId)}로 전환되었습니다.` } 
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '동아리 전환에 실패했습니다.' } 
      }));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      border: '1px solid #e9ecef'
    }}>
      <span style={{ fontSize: '12px', color: '#636e72' }}>
        동아리:
      </span>
      <select
        value={currentClub || ''}
        onChange={(e) => handleClubSwitch(e.target.value)}
        disabled={switching}
        style={{
          padding: '4px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: 'white',
          cursor: switching ? 'not-allowed' : 'pointer'
        }}
      >
        <option value="">전체</option>
        {availableClubs.map(club => (
          <option key={club.key || club._id} value={club.key || club._id}>
            {club.name}
          </option>
        ))}
      </select>
      {switching && (
        <span style={{ fontSize: '12px', color: '#636e72' }}>
          전환 중...
        </span>
      )}
    </div>
  );
}