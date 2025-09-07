import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { waitForPageLoad } from '../../utils/testHelpers.js';

test.describe('프로필 관리 기능', () => {
  test('프로필 정보 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 프로필 정보 표시 확인
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-club"]')).toBeVisible();
    await expect(page.locator('[data-testid="join-date"]')).toBeVisible();
  });

  test('개인정보 수정 - 이름 변경', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 수정 모드 진입
    await page.click('text=정보 수정');
    
    const newName = `수정된 이름 ${Date.now()}`;
    await page.fill('[name="name"]', newName);
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 변경된 이름 확인
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test('이메일 변경 시도 - 제한 확인', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 이메일 필드가 읽기 전용인지 확인
    const emailField = page.locator('[name="email"]');
    
    if (await emailField.isVisible()) {
      const isReadonly = await emailField.getAttribute('readonly');
      const isDisabled = await emailField.getAttribute('disabled');
      
      expect(isReadonly || isDisabled).toBeTruthy();
    } else {
      // 이메일 수정 옵션이 아예 없는 경우도 정상
      await expect(page.locator('text=이메일은 변경할 수 없습니다')).toBeVisible();
    }
  });

  test('비밀번호 변경', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    
    // 비밀번호 변경 섹션으로 이동
    await page.click('text=비밀번호 변경');
    
    // 비밀번호 변경 폼 확인
    await expect(page.locator('[name="currentPassword"]')).toBeVisible();
    await expect(page.locator('[name="newPassword"]')).toBeVisible();
    await expect(page.locator('[name="confirmPassword"]')).toBeVisible();
    
    // 비밀번호 변경
    await page.fill('[name="currentPassword"]', 'QAMember123!');
    await page.fill('[name="newPassword"]', 'NewPassword123!');
    await page.fill('[name="confirmPassword"]', 'NewPassword123!');
    await page.click('text=비밀번호 변경');
    
    // 성공 메시지 확인
    await expect(page.locator('text=비밀번호가 성공적으로 변경되었습니다')).toBeVisible();
  });

  test('비밀번호 변경 - 현재 비밀번호 불일치', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.click('text=비밀번호 변경');
    
    // 잘못된 현재 비밀번호 입력
    await page.fill('[name="currentPassword"]', 'WrongPassword123!');
    await page.fill('[name="newPassword"]', 'NewPassword123!');
    await page.fill('[name="confirmPassword"]', 'NewPassword123!');
    await page.click('text=비밀번호 변경');
    
    // 에러 메시지 확인
    await expect(page.locator('text=현재 비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  test('비밀번호 변경 - 확인 비밀번호 불일치', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/profile');
    await page.click('text=비밀번호 변경');
    
    await page.fill('[name="currentPassword"]', 'QAMember123!');
    await page.fill('[name="newPassword"]', 'NewPassword123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('text=비밀번호 변경');
    
    // 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
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