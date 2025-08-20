import 'dotenv/config';
import { User } from './src/models/User.js';

(async () => {
  try {
    const users = await User.find({});
    console.log('모든 사용자:');
    users.forEach(u => console.log(`${u.username} (${u.email}) - ${u.role} - clubId: ${u.clubId} - approved: ${u.isApproved}`));
    
    console.log('\nAunae 동아리 사용자:');
    const aunaeUsers = users.filter(u => u.clubId === 'Aunae');
    console.log(`총 ${aunaeUsers.length}명`);
    aunaeUsers.forEach(u => console.log(`${u.username} (${u.email}) - ${u.role} - approved: ${u.isApproved}`));

    console.log('\nEXECUTIVE 사용자:');
    const executives = users.filter(u => u.role === 'EXECUTIVE');
    executives.forEach(u => console.log(`${u.username} (${u.email}) - clubId: ${u.clubId} - approved: ${u.isApproved}`));
    
  } catch (e) {
    console.error(e);
  }
  process.exit();
})();