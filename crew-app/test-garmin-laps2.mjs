// 가민 랩 데이터 - 라이브러리 메서드 + URL 패턴 탐색
import { GarminConnect } from "garmin-connect";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "Qdij8d1JISOC*1kcpzjq8omPCiw";

async function getEncryptedPassword() {
  const result = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/9f988c671c3dd6cdec6bcd8d6f70d328/d1/database/70a2554e-9c09-41e9-baee-a07837837987/query`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer w2Z3q-Iv1KW6i3463JEvrGHjNgSJmj3e-t8aJQZF",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: "SELECT encrypted_password FROM garmin_accounts WHERE garmin_email = ?",
        params: ["zzo777@naver.com"],
      }),
    }
  );
  const data = await result.json();
  return data.result[0].results[0].encrypted_password;
}

function decryptPassword(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

async function main() {
  const encryptedPw = await getEncryptedPassword();
  const password = decryptPassword(encryptedPw);

  console.log("로그인 중...");
  const GC = new GarminConnect({ username: "zzo777@naver.com", password });
  await GC.login();
  console.log("로그인 성공!\n");

  const activityId = 22148619721;

  // GarminConnect 인스턴스의 메서드 확인
  console.log("=== GC 메서드 목록 ===");
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(GC)).filter(m => m !== 'constructor');
  console.log(methods.join(', '));
  console.log();

  // getActivityDetails 시도
  if (typeof GC.getActivityDetails === 'function') {
    console.log("=== getActivityDetails ===");
    try {
      const details = await GC.getActivityDetails(activityId);
      console.log("keys:", Object.keys(details));
      if (details.lapDTOs) console.log("lapDTOs:", JSON.stringify(details.lapDTOs).substring(0, 500));
      if (details.activityDetailMetrics) console.log("detailMetrics 길이:", details.activityDetailMetrics.length);
    } catch (e) { console.log("에러:", e.message?.substring(0, 100)); }
    console.log();
  }

  // getSplits 시도
  if (typeof GC.getSplits === 'function') {
    console.log("=== getSplits ===");
    try {
      const splits = await GC.getSplits(activityId);
      console.log("결과:", JSON.stringify(splits).substring(0, 500));
    } catch (e) { console.log("에러:", e.message?.substring(0, 100)); }
    console.log();
  }

  // URL 기반 직접 호출 - connectapi 도메인
  const urls = [
    `https://connectapi.garmin.com/activity-service/activity/${activityId}/splits`,
    `https://connectapi.garmin.com/activity-service/activity/${activityId}/laps`,
    `https://connectapi.garmin.com/activity-service/activity/${activityId}/details`,
  ];

  for (const url of urls) {
    console.log(`=== GET ${url} ===`);
    try {
      const data = await GC.get(url);
      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        console.log("응답 키:", keys);
        if (Array.isArray(data) && data.length > 0) {
          console.log("배열 길이:", data.length);
          console.log("첫 항목:", JSON.stringify(data[0]).substring(0, 400));
        } else {
          const str = JSON.stringify(data);
          console.log("응답:", str.substring(0, 500));
        }
      } else {
        console.log("응답:", data);
      }
    } catch (e) { console.log("에러:", e.message?.substring(0, 150)); }
    console.log();
  }

  // splitSummaries에서 noOfSplits 확인
  console.log("=== splitSummaries 상세 ===");
  const detail = await GC.getActivity({ activityId: String(activityId) });
  if (detail.splitSummaries) {
    for (const s of detail.splitSummaries) {
      console.log(JSON.stringify(s));
    }
  }

  console.log("\n=== 완료 ===");
}

main().catch(console.error);
