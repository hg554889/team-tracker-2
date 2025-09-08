export const testUsers = {
  admin: {
    name: 'QA Admin',
    email: process.env.TEST_ADMIN_EMAIL || 'qa-admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'QAAdmin123!',
    role: 'ADMIN'
  },
  executive: {
    name: 'QA Executive', 
    email: process.env.TEST_EXECUTIVE_EMAIL || 'qa-executive@test.com',
    password: process.env.TEST_EXECUTIVE_PASSWORD || 'QAExecutive123!',
    role: 'EXECUTIVE'
  },
  leader: {
    name: 'QA Leader',
    email: process.env.TEST_LEADER_EMAIL || 'qa-leader@test.com', 
    password: process.env.TEST_LEADER_PASSWORD || 'QALeader123!',
    role: 'LEADER'
  },
  member: {
    name: 'QA Member',
    email: process.env.TEST_MEMBER_EMAIL || 'qa-member@test.com',
    password: process.env.TEST_MEMBER_PASSWORD || 'QAMember123!', 
    role: 'MEMBER'
  }
};

export const testData = {
  club: {
    name: process.env.TEST_CLUB_NAME || 'QA 테스트 클럽',
    description: '자동화 테스트용 클럽입니다'
  },
  team: {
    name: process.env.TEST_TEAM_NAME || 'QA 테스트 팀',
    description: '자동화 테스트용 팀입니다'
  },
  report: {
    title: 'QA 테스트 보고서',
    progress: 75,
    goals: '자동화 테스트 구현 완료',
    issues: '특별한 이슈 없음',
    deadline: '2024-12-31'
  }
};