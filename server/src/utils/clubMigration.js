import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';

export async function migrateClubData() {
  console.log('[MIGRATION] Starting club data migration...');
  
  try {
    // 1. Reports에 clubId 추가
    const reportsNeedingClubId = await Report.find({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    console.log(`[MIGRATION] Found ${reportsNeedingClubId.length} reports needing clubId`);

    for (const report of reportsNeedingClubId) {
      try {
        // 작성자의 clubId 찾기
        const author = await User.findById(report.author);
        if (author && author.clubId) {
          await Report.updateOne(
            { _id: report._id },
            { $set: { clubId: author.clubId } }
          );
          console.log(`[MIGRATION] Updated report ${report._id} with clubId: ${author.clubId}`);
        } else {
          // 작성자의 clubId가 없으면 기본값 설정
          const defaultClubId = 'default';
          await Report.updateOne(
            { _id: report._id },
            { $set: { clubId: defaultClubId } }
          );
          console.log(`[MIGRATION] Updated report ${report._id} with default clubId: ${defaultClubId}`);
        }
      } catch (error) {
        console.error(`[MIGRATION] Failed to update report ${report._id}:`, error);
      }
    }

    // 2. Teams에 clubId 추가 (필요한 경우)
    const teamsNeedingClubId = await Team.find({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    console.log(`[MIGRATION] Found ${teamsNeedingClubId.length} teams needing clubId`);

    for (const team of teamsNeedingClubId) {
      try {
        // 팀 리더의 clubId 찾기
        const leader = await User.findById(team.leader);
        if (leader && leader.clubId) {
          await Team.updateOne(
            { _id: team._id },
            { $set: { clubId: leader.clubId } }
          );
          console.log(`[MIGRATION] Updated team ${team._id} with clubId: ${leader.clubId}`);
        } else {
          // 팀 멤버 중 clubId가 있는 사용자 찾기
          const members = await User.find({ 
            _id: { $in: team.members },
            clubId: { $exists: true, $ne: null, $ne: '' }
          });
          
          if (members.length > 0) {
            const clubId = members[0].clubId;
            await Team.updateOne(
              { _id: team._id },
              { $set: { clubId } }
            );
            console.log(`[MIGRATION] Updated team ${team._id} with member's clubId: ${clubId}`);
          } else {
            // 모든 멤버가 clubId가 없으면 기본값 설정
            const defaultClubId = 'default';
            await Team.updateOne(
              { _id: team._id },
              { $set: { clubId: defaultClubId } }
            );
            console.log(`[MIGRATION] Updated team ${team._id} with default clubId: ${defaultClubId}`);
          }
        }
      } catch (error) {
        console.error(`[MIGRATION] Failed to update team ${team._id}:`, error);
      }
    }

    // 3. Users에 기본 clubId 설정 (필요한 경우)
    const usersNeedingClubId = await User.find({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    console.log(`[MIGRATION] Found ${usersNeedingClubId.length} users needing clubId`);

    for (const user of usersNeedingClubId) {
      try {
        const defaultClubId = 'default';
        await User.updateOne(
          { _id: user._id },
          { $set: { clubId: defaultClubId } }
        );
        console.log(`[MIGRATION] Updated user ${user._id} with default clubId: ${defaultClubId}`);
      } catch (error) {
        console.error(`[MIGRATION] Failed to update user ${user._id}:`, error);
      }
    }

    console.log('[MIGRATION] Club data migration completed successfully');
    return { success: true };

  } catch (error) {
    console.error('[MIGRATION] Club data migration failed:', error);
    return { success: false, error: error.message };
  }
}

export async function validateClubSeparation() {
  console.log('[VALIDATION] Starting club separation validation...');
  
  try {
    // 1. clubId가 없는 Reports 확인
    const reportsWithoutClubId = await Report.countDocuments({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    // 2. clubId가 없는 Teams 확인
    const teamsWithoutClubId = await Team.countDocuments({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    // 3. clubId가 없는 Users 확인
    const usersWithoutClubId = await User.countDocuments({ 
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: '' }
      ]
    });

    // 4. 동아리별 데이터 분포 확인
    const clubDistribution = await User.aggregate([
      { $group: { _id: '$clubId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const validationResult = {
      reportsWithoutClubId,
      teamsWithoutClubId,
      usersWithoutClubId,
      clubDistribution,
      isValid: reportsWithoutClubId === 0 && teamsWithoutClubId === 0 && usersWithoutClubId === 0
    };

    console.log('[VALIDATION] Club separation validation result:', validationResult);
    return validationResult;

  } catch (error) {
    console.error('[VALIDATION] Club separation validation failed:', error);
    return { success: false, error: error.message };
  }
}