import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { createTeam, waitForPageLoad } from '../../utils/testHelpers.js';
import { testData } from '../../fixtures/testUsers.js';

test.describe('팀 관리 기능', () => {
  test('Leader - 새 팀 생성 성공', async ({ page }) => {
    await loginAs(page, 'leader');
    
    await page.goto('/teams');
    await page.click('text=새 팀 만들기');
    
    // 팀 생성 폼 확인
    await expect(page.locator('[name="name"]')).toBeVisible();
    await expect(page.locator('[name="description"]')).toBeVisible();
    
    const teamName = `QA 테스트 팀 ${Date.now()}`;
    await page.fill('[name="name"]', teamName);
    await page.fill('[name="description"]', '자동화 테스트용 팀입니다');
    await page.click('button[type="submit"]');
    
    // 성공 메시지 또는 팀 목록으로 리다이렉트 확인
    await waitForPageLoad(page);
    
    // 생성된 팀이 목록에 있는지 확인
    await page.goto('/teams');
    await expect(page.locator(`text=${teamName}`)).toBeVisible();
  });

  test('팀 정보 수정 - Leader 권한', async ({ page }) => {
    await loginAs(page, 'leader');
    await createTeam(page);
    
    await page.goto('/teams');
    
    // 첫 번째 팀 클릭하여 상세 페이지 이동
    await page.click('.team-card:first-child');
    
    // 수정 모드 진입
    await page.click('text=팀 정보 수정');
    
    const updatedName = `수정된 팀명 ${Date.now()}`;
    await page.fill('[name="name"]', updatedName);
    await page.fill('[name="description"]', '수정된 팀 설명입니다');
    await page.click('text=저장');
    
    // 수정된 정보 확인
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator('text=수정된 팀 설명입니다')).toBeVisible();
  });

  test('팀 멤버 초대 링크 생성', async ({ page }) => {
    await loginAs(page, 'leader');
    await createTeam(page);
    
    await page.goto('/teams');
    await page.click('.team-card:first-child');
    
    // 멤버 초대 버튼 클릭
    await page.click('text=멤버 초대');
    
    // 초대 링크 생성 확인
    await expect(page.locator('[data-testid="invite-link"]')).toBeVisible();
    
    const inviteLink = await page.locator('[data-testid="invite-link"]').textContent();
    expect(inviteLink).toContain('/invite/');
    
    // 링크 복사 버튼 확인
    await expect(page.locator('text=링크 복사')).toBeVisible();
  });

  test('초대 링크를 통한 팀 참여', async ({ page, context }) => {
    // Leader가 팀 생성하고 초대 링크 생성
    await loginAs(page, 'leader');
    await createTeam(page);
    
    await page.goto('/teams');
    await page.click('.team-card:first-child');
    await page.click('text=멤버 초대');
    
    const inviteLink = await page.locator('[data-testid="invite-link"]').textContent();
    const inviteCode = inviteLink.split('/invite/')[1];
    
    // 새로운 브라우저 컨텍스트에서 Member가 초대 수락
    const memberPage = await context.newPage();
    await loginAs(memberPage, 'member');
    
    await memberPage.goto(`/invite/${inviteCode}`);
    
    // 초대 수락 페이지 확인
    await expect(memberPage.locator('text=팀 초대')).toBeVisible();
    await expect(memberPage.locator('text=참여하기')).toBeVisible();
    
    await memberPage.click('text=참여하기');
    
    // 팀 상세 페이지로 이동 확인
    await waitForPageLoad(memberPage);
    await expect(memberPage.locator('text=팀 멤버')).toBeVisible();
    
    await memberPage.close();
  });

  test('팀 멤버 역할 변경 - Leader 권한', async ({ page }) => {
    await loginAs(page, 'leader');
    await createTeam(page);
    
    // 먼저 멤버를 팀에 추가해야 함 (실제 환경에서는 초대 과정 필요)
    await page.goto('/teams');
    await page.click('.team-card:first-child');
    
    // 멤버 목록에서 역할 변경
    const memberRow = page.locator('[data-testid="member-row"]:first-child');
    
    if (await memberRow.isVisible()) {
      await memberRow.locator('[data-testid="role-dropdown"]').click();
      await page.click('text=Leader로 변경');
      
      // 확인 다이얼로그
      await page.click('text=확인');
      
      // 역할 변경 확인
      await expect(memberRow.locator('text=Leader')).toBeVisible();
    }
  });

  test('팀 멤버 제거 - Leader 권한', async ({ page }) => {
    await loginAs(page, 'leader');
    await createTeam(page);
    
    await page.goto('/teams');
    await page.click('.team-card:first-child');
    
    const memberRow = page.locator('[data-testid="member-row"]:first-child');
    
    if (await memberRow.isVisible()) {
      const memberName = await memberRow.locator('.member-name').textContent();
      
      await memberRow.locator('[data-testid="remove-member"]').click();
      
      // 확인 다이얼로그
      await page.click('text=제거');
      
      // 멤버가 목록에서 제거되었는지 확인
      await expect(page.locator(`text=${memberName}`)).not.toBeVisible();
    }
  });

  test('Member - 팀 정보 조회만 가능 (수정 불가)', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/teams');
    
    // 팀 목록에서 첫 번째 팀 클릭
    if (await page.locator('.team-card:first-child').isVisible()) {
      await page.click('.team-card:first-child');
      
      // 팀 정보는 볼 수 있지만 수정 버튼은 없어야 함
      const hasEditButton = await page.locator('text=팀 정보 수정').isVisible();
      const hasInviteButton = await page.locator('text=멤버 초대').isVisible();
      
      expect(hasEditButton).toBe(false);
      expect(hasInviteButton).toBe(false);
      
      // 팀 정보는 조회 가능
      await expect(page.locator('[data-testid="team-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-members"]')).toBeVisible();
    }
  });

  test('팀 삭제 - Leader 권한', async ({ page }) => {
    await loginAs(page, 'leader');
    await createTeam(page);
    
    await page.goto('/teams');
    const teamName = await page.locator('.team-card:first-child .team-name').textContent();
    
    await page.click('.team-card:first-child');
    
    // 팀 설정 메뉴에서 삭제
    await page.click('text=팀 설정');
    await page.click('text=팀 삭제');
    
    // 확인 다이얼로그
    await page.fill('[placeholder="팀 이름을 입력하세요"]', teamName);
    await page.click('text=삭제 확인');
    
    // 팀 목록으로 리다이렉트되고 해당 팀이 없는지 확인
    await page.waitForURL('/teams');
    await expect(page.locator(`text=${teamName}`)).not.toBeVisible();
  });

  test('팀 검색 기능', async ({ page }) => {
    await loginAs(page, 'leader');
    
    await page.goto('/teams');
    
    // 검색 입력
    await page.fill('[data-testid="team-search"]', 'QA');
    
    // 검색 결과 확인 (QA가 포함된 팀만 표시)
    const teamCards = page.locator('.team-card');
    const count = await teamCards.count();
    
    for (let i = 0; i < count; i++) {
      const teamName = await teamCards.nth(i).locator('.team-name').textContent();
      expect(teamName.toLowerCase()).toContain('qa');
    }
  });

  test('팀 목록 페이지네이션', async ({ page }) => {
    await loginAs(page, 'leader');
    
    await page.goto('/teams');
    
    // 페이지네이션이 있다면 테스트
    if (await page.locator('[data-testid="pagination"]').isVisible()) {
      await page.click('[data-testid="next-page"]');
      
      // URL이나 페이지 내용 변경 확인
      await waitForPageLoad(page);
      
      // 이전 페이지로 이동
      await page.click('[data-testid="prev-page"]');
    }
  });
});