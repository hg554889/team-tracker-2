// 임시 디버깅 스크립트
import mongoose from 'mongoose';
import { User } from './server/src/models/User.js';
import { Team } from './server/src/models/Team.js';
import { Report } from './server/src/models/Report.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/team-tracker';

async function debugExecutive() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. EXECUTIVE 권한을 가진 사용자들 확인
    const executives = await User.find({ role: 'EXECUTIVE' });
    console.log('\n=== EXECUTIVE 사용자들 ===');
    executives.forEach(user => {
      console.log(`- ${user.username} (${user.email})`);
      console.log(`  clubId: ${user.clubId}`);
      console.log(`  isApproved: ${user.isApproved}`);
      console.log(`  approvalStatus: ${user.approvalStatus}`);
      console.log('');
    });

    // 2. 모든 동아리 목록 확인
    const clubs = await User.distinct('clubId', { clubId: { $ne: null } });
    console.log('=== 동아리 목록 ===');
    for (const clubId of clubs) {
      const userCount = await User.countDocuments({ clubId, isApproved: true });
      const teamCount = await Team.countDocuments({ clubId });
      console.log(`- ${clubId}: ${userCount}명, ${teamCount}팀`);
    }

    // 3. 샘플 EXECUTIVE 사용자의 접근 가능한 데이터 확인
    if (executives.length > 0) {
      const executive = executives[0];
      console.log(`\n=== ${executive.username}의 접근 가능한 데이터 ===`);
      
      const clubUsers = await User.find({ 
        clubId: executive.clubId,
        isApproved: true 
      }).select('username email role');
      
      const clubTeams = await Team.find({ clubId: executive.clubId });
      
      console.log(`같은 동아리 사용자 (${executive.clubId}):`);
      clubUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`);
      });
      
      console.log(`같은 동아리 팀:`);
      clubTeams.forEach(team => {
        console.log(`  - ${team.name}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugExecutive();