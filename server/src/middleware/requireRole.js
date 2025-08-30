/**
 * 특정 역할(들)을 요구하는 미들웨어
 * @param {string|string[]} roles - 필요한 역할(들)
 * @returns {Function} Express 미들웨어 함수
 */
export function requireRole(roles) {
  // roles가 문자열이면 배열로 변환
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // requireAuth 미들웨어를 통과했다면 req.user가 존재해야 함
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;
    
    // 사용자의 역할이 허용된 역할 목록에 있는지 확인
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    // 권한이 있으면 다음 미들웨어로 진행
    next();
  };
}