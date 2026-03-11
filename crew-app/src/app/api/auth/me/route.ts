import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    return Response.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
        role: user.role,
        biometricEnabled: user.biometricEnabled,
      },
    },
  });
}
