"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isValidPassword } from "@/lib/utils/validation";

type PasswordStrength = "weak" | "fair" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";
  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  if (checks >= 3) return "strong";
  if (checks >= 2) return "fair";
  return "weak";
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  weak:   { label: "약함",   color: "bg-red-500",    width: "w-1/3" },
  fair:   { label: "보통",   color: "bg-yellow-500", width: "w-2/3" },
  strong: { label: "강함",   color: "bg-green-500",  width: "w-full" },
};

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", nickname: "" });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCheck, setEmailCheck] = useState<{ checking: boolean; available: boolean | null }>({ checking: false, available: null });
  const [nicknameCheck, setNicknameCheck] = useState<{ checking: boolean; available: boolean | null }>({ checking: false, available: null });
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nicknameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passwordStrength = form.password ? getPasswordStrength(form.password) : null;
  const strengthConfig = passwordStrength ? STRENGTH_CONFIG[passwordStrength] : null;

  async function checkDuplicate(field: "email" | "nickname", value: string) {
    try {
      const res = await fetch(`/api/auth/check?${field}=${encodeURIComponent(value)}`);
      const json = await res.json();
      if (json.success) {
        if (field === "email") setEmailCheck({ checking: false, available: json.data.available });
        else setNicknameCheck({ checking: false, available: json.data.available });
      }
    } catch {
      if (field === "email") setEmailCheck({ checking: false, available: null });
      else setNicknameCheck({ checking: false, available: null });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);

    // 이메일 실시간 중복체크 (debounce 500ms)
    if (name === "email") {
      setEmailCheck({ checking: false, available: null });
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
      if (value.includes("@") && value.includes(".")) {
        setEmailCheck({ checking: true, available: null });
        emailTimerRef.current = setTimeout(() => checkDuplicate("email", value), 500);
      }
    }

    // 닉네임 실시간 중복체크 (debounce 500ms)
    if (name === "nickname") {
      setNicknameCheck({ checking: false, available: null });
      if (nicknameTimerRef.current) clearTimeout(nicknameTimerRef.current);
      if (value.length >= 2) {
        setNicknameCheck({ checking: true, available: null });
        nicknameTimerRef.current = setTimeout(() => checkDuplicate("nickname", value), 500);
      }
    }
  }

  function handleProfileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 선택 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지는 최대 10MB까지 가능합니다.");
      return;
    }
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeProfile() {
    setProfileFile(null);
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const pwCheck = isValidPassword(form.password);
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. 프로필 이미지 업로드 (있는 경우)
      let profileImageUrl: string | undefined;
      if (profileFile) {
        const formData = new FormData();
        formData.append("files", profileFile);
        formData.append("purpose", "profile");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.data.files.length > 0) {
          profileImageUrl = uploadJson.data.files[0].url;
        }
      }

      // 2. 회원가입
      const result = await register(form.email.trim(), form.password, form.nickname.trim(), profileImageUrl);

      if (result.success) {
        router.replace("/dashboard");
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">회원가입</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          LifeSync와 함께 시작하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 프로필 사진 */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors"
          >
            {profilePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            )}
            {profilePreview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeProfile(); }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow"
              >
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfileSelect}
            className="hidden"
          />
          <span className="text-xs text-gray-400">프로필 사진 (선택)</span>
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">이메일</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            autoComplete="email"
            required
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
              emailCheck.available === false ? "border-red-400" :
              emailCheck.available === true ? "border-green-400" :
              "border-gray-200 dark:border-gray-700"
            }`}
          />
          {emailCheck.checking && (
            <p className="text-xs text-gray-400 mt-1">확인 중...</p>
          )}
          {emailCheck.available === true && (
            <p className="text-xs text-green-500 mt-1">사용 가능한 이메일입니다.</p>
          )}
          {emailCheck.available === false && (
            <p className="text-xs text-red-500 mt-1">이미 사용 중인 이메일입니다.</p>
          )}
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">닉네임 (2~20자)</label>
          <input
            type="text"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="사용할 닉네임"
            autoComplete="username"
            required
            minLength={2}
            maxLength={20}
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
              nicknameCheck.available === false ? "border-red-400" :
              nicknameCheck.available === true ? "border-green-400" :
              "border-gray-200 dark:border-gray-700"
            }`}
          />
          {nicknameCheck.checking && (
            <p className="text-xs text-gray-400 mt-1">확인 중...</p>
          )}
          {nicknameCheck.available === true && (
            <p className="text-xs text-green-500 mt-1">사용 가능한 닉네임입니다.</p>
          )}
          {nicknameCheck.available === false && (
            <p className="text-xs text-red-500 mt-1">이미 사용 중인 닉네임입니다.</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="최소 8자, 2가지 이상 조합"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              tabIndex={-1}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>

          {form.password && strengthConfig && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strengthConfig.color} ${strengthConfig.width}`} />
              </div>
              <p className={`text-xs mt-1 font-medium ${
                passwordStrength === "strong" ? "text-green-600" :
                passwordStrength === "fair" ? "text-yellow-600" : "text-red-600"
              }`}>
                비밀번호 강도: {strengthConfig.label}
              </p>
            </div>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">비밀번호 확인</label>
          <input
            type={showPassword ? "text" : "password"}
            name="passwordConfirm"
            value={form.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            required
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
              form.passwordConfirm && form.password !== form.passwordConfirm
                ? "border-red-400"
                : "border-gray-200 dark:border-gray-700"
            }`}
          />
          {form.passwordConfirm && form.password !== form.passwordConfirm && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !form.email || !form.password || !form.nickname || form.password !== form.passwordConfirm}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              가입 중...
            </span>
          ) : (
            "회원가입"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
