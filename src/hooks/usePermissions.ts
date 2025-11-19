// src/hooks/usePermissions.ts
import { useAuth } from '../contexts/AuthContext';

/**
 * 권한 확인 로직을 간편하게 사용하기 위한 커스텀 훅입니다.
 * 이 훅은 UI 요소(버튼, 메뉴 등)를 조건부로 렌더링할 때 사용됩니다.
 * 
 * @example
 * const { hasPermission } = usePermissions();
 * 
 * return (
 *   <>
 *     {hasPermission('EDIT_POST') && <button>수정</button>}
 *   </>
 * )
 */
export const usePermissions = () => {
  const { hasRole, hasPermission } = useAuth();

  return { hasRole, hasPermission };
};
