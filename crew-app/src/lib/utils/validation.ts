/**
 * 이메일 유효성 검사
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 비밀번호 강도 검사 (최소 8자, 대/소문자·숫자·특수문자 중 2가지 이상)
 */
export function isValidPassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "비밀번호는 최소 8자리 이상이어야 합니다." };
  }

  const checks = [
    /[A-Z]/.test(password),   // 대문자
    /[a-z]/.test(password),   // 소문자
    /[0-9]/.test(password),   // 숫자
    /[^A-Za-z0-9]/.test(password), // 특수문자
  ];

  const passed = checks.filter(Boolean).length;
  if (passed < 2) {
    return {
      valid: false,
      message: "대문자, 소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다.",
    };
  }

  return { valid: true, message: "" };
}

/**
 * 닉네임 유효성 검사 (2~20자)
 */
export function isValidNickname(nickname: string): {
  valid: boolean;
  message: string;
} {
  if (nickname.length < 2 || nickname.length > 20) {
    return { valid: false, message: "닉네임은 2~20자 사이여야 합니다." };
  }
  if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
    return {
      valid: false,
      message: "닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.",
    };
  }
  return { valid: true, message: "" };
}

/**
 * 파일 크기 검사 (bytes)
 */
export function isValidFileSize(size: number, maxMB: number): boolean {
  return size <= maxMB * 1024 * 1024;
}

/**
 * 이미지 MIME 타입 검사
 */
export function isValidImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType);
}

/**
 * 영상 MIME 타입 검사
 */
export function isValidVideoType(mimeType: string): boolean {
  return ["video/mp4", "video/webm", "video/quicktime"].includes(mimeType);
}
