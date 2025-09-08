/**
 * 애플리케이션 라우트 정의
 */
export const routes = {
  // 공개 라우트
  public: {
    landing: '/',
    login: '/login',
    signup: '/signup',
  },

  // 인증 필요 라우트
  protected: {
    home: '/', // Dashboard가 아닌 home으로 정정
    selectClub: '/select-club',
    profile: '/profile',
    teams: '/teams',
    teamDetail: '/teams/:id',
    teamInvite: '/teams/invite',
    teamJoin: '/teams/join',
    reportsNew: '/reports/new',
    reportsList: '/reports',
    reportDetail: '/reports/:id',
    approvalPending: '/approval-pending',
    notifications: '/notifications',
    activity: '/activity',
    tasks: '/tasks',
    reviews: '/reviews',
    acceptInvite: '/invite/:code',
    userProfile: '/users/:id',
  },

  // Admin 전용 라우트
  admin: {
    users: '/admin/users',
    clubs: '/admin/clubs', 
    settings: '/admin/settings',
    analytics: '/admin/analytics',
    approvals: '/admin/approvals',
    inquiries: '/admin/inquiries',
  },

  // Executive 전용 라우트 
  executive: {
    users: '/executive/users',
    approvals: '/admin/approvals',  // Executive도 승인 관리 가능
    inquiries: '/admin/inquiries',   // Executive도 문의 관리 가능
  },

  // Leader 전용 라우트
  leader: {
    teamInvite: '/teams/invite',
  }
};

/**
 * 역할별 접근 가능한 라우트 정의
 */
export const roleAccessMap = {
  ADMIN: [
    ...Object.values(routes.protected),
    ...Object.values(routes.admin),
    ...Object.values(routes.executive),
    ...Object.values(routes.leader),
  ],
  EXECUTIVE: [
    ...Object.values(routes.protected),
    ...Object.values(routes.executive),
  ],
  LEADER: [
    ...Object.values(routes.protected),
    ...Object.values(routes.leader),
  ],
  MEMBER: [
    ...Object.values(routes.protected),
  ]
};