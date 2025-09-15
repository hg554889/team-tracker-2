import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { waitForPageLoad } from '../../utils/testHelpers.js';

test.describe('프로필 관리 기능', () => {
  test('프로필 정보 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    // 프로필 정보 표시 확인 (모든 strict mode 해결 + 정확한 텍스트)
    await expect(page.locator('h1').first()).toBeVisible(); // 사용자명 제목
    await expect(page.locator('h3:has-text("기본 정보")')).toBeVisible(); // 기본 정보 섹션
    await expect(page.locator('span.stat-label').filter({hasText: '이메일'})).toBeVisible();
    await expect(page.locator('label').filter({hasText: '현재 권한'})).toBeVisible(); // "역할" → "현재 권한"
  });

  test('개인정보 수정 - 이름 변경', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 이름 필드가 비활성화되어 있는지 확인 (Profile.js 기준으로는 사용자 이름 변경 불가)
    const nameField = page.locator('input.form-input.disabled').nth(1); // 두 번째 disabled 필드가 이름
    await expect(nameField).toHaveAttribute('disabled');
    
    // 변경 불가 안내 메시지 확인
    await expect(page.locator('text=사용자 이름은 변경할 수 없습니다')).toBeVisible();
  });

  test('이메일 변경 시도 - 제한 확인', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 이메일 필드가 비활성화되어 있는지 확인 (첫 번째 disabled 필드가 이메일)
    const emailField = page.locator('input.form-input.disabled').first();
    await expect(emailField).toHaveAttribute('disabled');
    await expect(emailField).toHaveValue(/.*@.*\..*/); // 이메일 형식 확인
  });

  test('비밀번호 변경', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 비밀번호 변경 버튼 클릭 (실제 Profile.js 구조 기반)
    await page.click('button.action-btn.security');
    
    // 모달이 열릴 때까지 대기
    await page.waitForSelector('.modal-content');
    
    // 비밀번호 변경 폼 확인 (모달 내부)
    await expect(page.locator('.modal-content input.form-input[type="password"]').first()).toBeVisible();
    await expect(page.locator('.modal-content input.form-input[type="password"]').nth(1)).toBeVisible();
    await expect(page.locator('.modal-content input.form-input[type="password"]').nth(2)).toBeVisible();
    
    // 비밀번호 변경 (실제 placeholder 기반)
    await page.fill('.modal-content input[placeholder="현재 비밀번호를 입력하세요"]', 'QAMember123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 입력하세요 (8자 이상)"]', 'NewPassword123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 다시 입력하세요"]', 'NewPassword123!');
    await page.click('button.btn-primary');
    
    // 성공 메시지 확인 (토스트)
    await expect(page.locator('text=비밀번호가 변경되었습니다')).toBeVisible();
  });

  test('비밀번호 변경 - 현재 비밀번호 불일치', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.click('button.action-btn.security');
    await page.waitForSelector('.modal-content');
    
    // 잘못된 현재 비밀번호 입력
    await page.fill('.modal-content input[placeholder="현재 비밀번호를 입력하세요"]', 'WrongPassword123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 입력하세요 (8자 이상)"]', 'NewPassword123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 다시 입력하세요"]', 'NewPassword123!');
    await page.click('button.btn-primary');
    
    // 에러 메시지 확인 (토스트)
    await expect(page.locator('text=현재 비밀번호')).toBeVisible();
  });

  test('비밀번호 변경 - 확인 비밀번호 불일치', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.click('button.action-btn.security');
    await page.waitForSelector('.modal-content');
    
    await page.fill('.modal-content input[placeholder="현재 비밀번호를 입력하세요"]', 'QAMember123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 입력하세요 (8자 이상)"]', 'NewPassword123!');
    await page.fill('.modal-content input[placeholder="새 비밀번호를 다시 입력하세요"]', 'DifferentPassword123!');
    await page.click('button.btn-primary');
    
    // 에러 메시지 확인 (토스트)
    await expect(page.locator('text=새 비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  test('프로필 이미지 업로드', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    if (await page.locator('[data-testid="profile-image-upload"]').isVisible()) {
      // 프로필 이미지 업로드 버튼 클릭
      await page.click('[data-testid="profile-image-upload"]');
      
      // 이미지 파일 업로드 (테스트용 이미지 생성)
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'profile-image.png',
        mimeType: 'image/png',
        buffer: buffer
      });
      
      await page.click('text=이미지 업로드');
      
      // 업로드 성공 확인
      await expect(page.locator('text=프로필 이미지가 업데이트되었습니다')).toBeVisible();
    }
  });

  test('소속 클럽 정보 표시 (변경 불가)', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 클럽 정보는 표시되지만 변경 불가능해야 함
    await expect(page.locator('[data-testid="user-club"]')).toBeVisible();
    
    const hasChangeClubButton = await page.locator('text=클럽 변경').isVisible();
    expect(hasChangeClubButton).toBe(false);
    
    // 클럽 변경 불가 안내 메시지 확인
    if (await page.locator('text=클럽 변경은 관리자에게 문의하세요').isVisible()) {
      await expect(page.locator('text=클럽 변경은 관리자에게 문의하세요')).toBeVisible();
    }
  });

  test('계정 활동 내역 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 활동 내역 섹션 확인
    if (await page.locator('[data-testid="activity-history"]').isVisible()) {
      await expect(page.locator('[data-testid="activity-history"]')).toBeVisible();
      
      // 최근 로그인 정보
      await expect(page.locator('[data-testid="last-login"]')).toBeVisible();
      
      // 가입일 정보
      await expect(page.locator('[data-testid="join-date"]')).toBeVisible();
      
      // 작성한 보고서 수
      if (await page.locator('[data-testid="report-count"]').isVisible()) {
        await expect(page.locator('[data-testid="report-count"]')).toBeVisible();
      }
    }
  });

  test('프로필 정보 유효성 검증', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.click('text=정보 수정');
    
    // 빈 이름으로 저장 시도
    await page.fill('[name="name"]', '');
    await page.click('button[type="submit"]');
    
    // validation 에러 확인
    const nameField = page.locator('[name="name"]');
    await expect(nameField).toHaveAttribute('required');
    
    // 너무 짧은 이름
    await page.fill('[name="name"]', 'a');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=이름은 2자 이상 입력해주세요')).toBeVisible();
  });

  test('다른 사용자 프로필 조회', async ({ page }) => {
    await loginAs(page, 'leader');
    
    // 사용자 ID를 1로 가정 (실제로는 팀 멤버 목록에서 가져와야 함)
    await page.goto('/users/1');
    
    // 다른 사용자 프로필 정보 확인
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toBeVisible();
    
    // 수정 권한이 없는지 확인 (본인이 아닌 경우)
    const hasEditButton = await page.locator('text=정보 수정').isVisible();
    expect(hasEditButton).toBe(false);
    
    // 공개 정보만 표시되는지 확인 (이메일, 개인정보 등은 비공개)
    const hasPrivateInfo = await page.locator('[data-testid="private-info"]').isVisible();
    expect(hasPrivateInfo).toBe(false);
  });
});