import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
