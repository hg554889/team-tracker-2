import { Schema, model, Types } from 'mongoose';

const CommentSchema = new Schema({
  author: { type: Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true }
}, { timestamps: true });

const ReportSchema = new Schema({
  team: { type: Types.ObjectId, ref: 'Team', required: true, index: true },
  author: { type: Types.ObjectId, ref: 'User', required: true },
  clubId: { type: String, required: true, index: true },
  weekOf: { type: Date, required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },

  // 새로운 보고서 형식 필드들
  goals: { type: String, default: '' }, // 주간 목표 및 기간
  progressDetails: { type: String, default: '' }, // 진행 내역
  achievements: { type: String, default: '' }, // 주요 성과
  completedTasks: { type: String, default: '' }, // 완료된 업무
  incompleteTasks: { type: String, default: '' }, // 미완료 업무
  nextWeekPlans: { type: String, default: '' }, // 다음주 계획
  issues: { type: String, default: '' }, // 이슈 및 고민사항

  // 하위 호환성을 위한 기존 필드들
  shortTermGoals: { type: String, default: '' },
  longTermGoals: { type: String, default: '' },
  actionPlans: { type: String, default: '' },
  milestones: { type: String, default: '' },

  dueAt: { type: Date },
  submittedAt: { type: Date }, // 보고서 제출 시간 (실제 제출된 시각)
  title: { type: String, default: '' },
  comments: { type: [CommentSchema], default: [] }
}, { timestamps: true });

// 복합 인덱스 추가 - 검색 성능 최적화 (unique 제약조건 제거)
ReportSchema.index({ team: 1, author: 1, weekOf: 1 });
ReportSchema.index({ clubId: 1, weekOf: 1 });
ReportSchema.index({ clubId: 1, author: 1 });
ReportSchema.index({ clubId: 1, dueAt: 1 });
ReportSchema.index({ createdAt: -1 }); // 생성 시간으로 정렬용

export const Report = model('Report', ReportSchema);
