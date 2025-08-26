import { Club } from '../models/Club.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';

export async function cleanupClubData() {
  console.log('[CLEANUP] Starting club data cleanup...');
  
  try {
    // 1. 'default' clubId를 'Aunae'로 변경
    console.log('[CLEANUP] Converting default clubId to Aunae...');
    
    await User.updateMany(
      { clubId: 'default' },
      { $set: { clubId: 'Aunae' } }
    );
    
    await Team.updateMany(
      { clubId: 'default' },
      { $set: { clubId: 'Aunae' } }
    );
    
    await Report.updateMany(
      { clubId: 'default' },
      { $set: { clubId: 'Aunae' } }
    );
    
    // 2. 'CLUB_A' clubId를 'Aunae'로 변경
    console.log('[CLEANUP] Converting CLUB_A clubId to Aunae...');
    
    await User.updateMany(
      { clubId: 'CLUB_A' },
      { $set: { clubId: 'Aunae' } }
    );
    
    await Team.updateMany(
      { clubId: 'CLUB_A' },
      { $set: { clubId: 'Aunae' } }
    );
    
    await Report.updateMany(
      { clubId: 'CLUB_A' },
      { $set: { clubId: 'Aunae' } }
    );
    
    // 3. 'CLUB_B' clubId를 'KIS'로 변경
    console.log('[CLEANUP] Converting CLUB_B clubId to KIS...');
    
    await User.updateMany(
      { clubId: 'CLUB_B' },
      { $set: { clubId: 'KIS' } }
    );
    
    await Team.updateMany(
      { clubId: 'CLUB_B' },
      { $set: { clubId: 'KIS' } }
    );
    
    await Report.updateMany(
      { clubId: 'CLUB_B' },
      { $set: { clubId: 'KIS' } }
    );
    
    // 4. Club 컬렉션 정리
    console.log('[CLEANUP] Cleaning up Club collection...');
    
    // 기존의 잘못된 클럽 데이터 삭제
    await Club.deleteMany({ 
      $or: [
        { key: 'default' },
        { key: 'CLUB_A' },
        { key: 'CLUB_B' }
      ]
    });
    
    // 새로운 클럽 데이터 삽입 (이미 존재하지 않는 경우만)
    const existingClubs = await Club.find();
    if (existingClubs.length === 0) {
      await Club.insertMany([
        { key: 'Aunae', name: 'Aunae' },
        { key: 'KIS', name: 'KIS' }
      ]);
      console.log('[CLEANUP] Inserted new club records');
    }
    
    // 5. 통계 출력
    const stats = {
      aunaeUsers: await User.countDocuments({ clubId: 'Aunae' }),
      kisUsers: await User.countDocuments({ clubId: 'KIS' }),
      aunaeTeams: await Team.countDocuments({ clubId: 'Aunae' }),
      kisTeams: await Team.countDocuments({ clubId: 'KIS' }),
      aunaeReports: await Report.countDocuments({ clubId: 'Aunae' }),
      kisReports: await Report.countDocuments({ clubId: 'KIS' })
    };
    
    console.log('[CLEANUP] Final statistics:', stats);
    console.log('[CLEANUP] Club data cleanup completed successfully');
    return { success: true, stats };

  } catch (error) {
    console.error('[CLEANUP] Club data cleanup failed:', error);
    return { success: false, error: error.message };
  }
}