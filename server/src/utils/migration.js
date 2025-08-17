import { User } from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flagPath = path.join(__dirname, '..', '..', 'migration-flag.json');

export async function migrateExistingUsers() {
  try {
    // Check if migration already completed
    let migrationFlag;
    try {
      migrationFlag = JSON.parse(fs.readFileSync(flagPath, 'utf8'));
      if (migrationFlag.migrated) {
        console.log('Migration already completed, skipping...');
        return;
      }
    } catch (err) {
      migrationFlag = { migrated: false };
    }
    
    console.log('Starting user migration...');
    
    // Find users without studentId or approval status, or with lowercase roles
    const usersToUpdate = await User.find({
      $or: [
        { studentId: { $exists: false } },
        { approvalStatus: { $exists: false } },
        { isApproved: { $exists: false } },
        { role: { $in: ['member', 'leader', 'executive', 'admin'] } }
      ]
    });
    
    console.log(`Found ${usersToUpdate.length} users to migrate`);
    
    for (const user of usersToUpdate) {
      // Set default studentId if missing (using a timestamp-based approach)
      if (!user.studentId) {
        const timestamp = new Date(user.createdAt || new Date()).getFullYear();
        const randomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        user.studentId = parseInt(`${timestamp}${randomId}`);
      }
      
      // Fix role values (convert lowercase to uppercase)
      const roleMapping = {
        'member': 'MEMBER',
        'leader': 'LEADER', 
        'executive': 'EXECUTIVE',
        'admin': 'ADMIN'
      };
      
      if (user.role && roleMapping[user.role.toLowerCase()]) {
        user.role = roleMapping[user.role.toLowerCase()];
      }
      
      // Set approval status for existing users
      user.isApproved = true;
      user.approvalStatus = 'approved';
      user.approvedAt = user.createdAt || new Date();
      
      await user.save();
      console.log(`Migrated user: ${user.email} (role: ${user.role})`);
    }
    
    // Mark migration as completed
    fs.writeFileSync(flagPath, JSON.stringify({ migrated: true }, null, 2));
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}