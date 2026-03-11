// Firebase Cloud Messaging Service Worker
// 이 파일은 빌드 시 자동으로 번들되지 않으므로 직접 firebase SDK를 importScripts로 로드합니다.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Firebase 설정은 환경변수로 관리할 수 없으므로 빌드 시 치환 또는 공개 config 사용
// 실제 배포 시 이 값들을 Firebase Console > 프로젝트 설정 > 일반에서 확인하여 입력하세요.
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || "",
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || "",
  projectId: self.__FIREBASE_PROJECT_ID__ || "",
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || "",
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || "",
  appId: self.__FIREBASE_APP_ID__ || "",
};

// config가 설정된 경우에만 초기화
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // 백그라운드 메시지 수신
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon, data } = payload.notification ?? {};
    self.registration.showNotification(title ?? "LifeSync", {
      body: body ?? "",
      icon: icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: data ?? payload.data,
      vibrate: [100, 50, 100],
    });
  });

  // 알림 클릭 시 앱으로 이동
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? "/";
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return clients.openWindow(url);
      })
    );
  });
}
