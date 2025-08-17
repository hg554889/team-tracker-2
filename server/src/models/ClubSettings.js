import { Schema, model } from 'mongoose';

const ClubSettingsSchema = new Schema({
  clubId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  settings: {
    // 보고서 설정
    reportSettings: {
      defaultDueDays: { type: Number, default: 7 },
      allowLateSubmission: { type: Boolean, default: true },
      requireWeeklyReports: { type: Boolean, default: true },
      maxTeamSize: { type: Number, default: 10 }
    },
    // 팀 설정
    teamSettings: {
      allowMemberCreateTeam: { type: Boolean, default: false },
      requireLeaderApproval: { type: Boolean, default: true },
      maxTeamsPerUser: { type: Number, default: 3 }
    },
    // 알림 설정
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      dueDateReminders: { type: Boolean, default: true },
      reminderDaysBefore: { type: Number, default: 2 }
    }
  },
  customFields: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [String] // select 타입일 때 사용
  }],
  theme: {
    primaryColor: { type: String, default: '#007bff' },
    secondaryColor: { type: String, default: '#6c757d' },
    logo: { type: String, default: '' }
  }
}, { timestamps: true });

export const ClubSettings = model('ClubSettings', ClubSettingsSchema);