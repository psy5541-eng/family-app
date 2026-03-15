// 가민 랩 데이터 엔드포인트 탐색 - 세션 재사용
import { GarminConnect } from "garmin-connect";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "Qdij8d1JISOC*1kcpzjq8omPCiw";
const GARMIN_EMAIL = "zzo777@naver.com";

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
  const GC = new GarminConnect({ username: GARMIN_EMAIL, password });
  await GC.login();
  console.log("로그인 성공!\n");

  const activityId = 22148619721;

  // 1) activity detail - laps in summaryDTO?
  console.log("=== 1) getActivity detail ===");
  const detail = await GC.getActivity({ activityId: String(activityId) });

  // summaryDTO 체크
  if (detail.summaryDTO) {
    console.log("summaryDTO keys:", Object.keys(detail.summaryDTO));
  }

  // laps 키 직접 확인
  if (detail.laps) {
    console.log("detail.laps 발견!", JSON.stringify(detail.laps).substring(0, 500));
  }

  // detailMetrics 확인
  if (detail.detailMetrics) {
    console.log("detail.detailMetrics 발견! keys:", Object.keys(detail.detailMetrics));
  }

  // 전체 키 출력
  console.log("detail top-level keys:", Object.keys(detail));
  console.log();

  // 2) activity-service laps 엔드포인트들
  const endpoints = [
    `/proxy/activity-service/activity/${activityId}/laps`,
    `/proxy/activity-service/activity/${activityId}/details`,
    `/proxy/activity-service/activity/${activityId}/split_summaries?splitType=KILOMETER`,
  ];

  for (const ep of endpoints) {
    console.log(`=== ${ep} ===`);
    try {
      const url = `https://connect.garmin.com${ep}`;
      const data = await GC.get(url);
      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        console.log("응답 키:", keys);
        if (Array.isArray(data)) {
          console.log(`배열 길이: ${data.length}`);
          if (data.length > 0) {
            console.log("첫 항목:", JSON.stringify(data[0]).substring(0, 400));
          }
        } else {
          for (const k of keys.slice(0, 5)) {
            const val = data[k];
            if (Array.isArray(val)) {
              console.log(`  ${k}: 배열[${val.length}]`);
              if (val.length > 0) console.log(`    첫 항목:`, JSON.stringify(val[0]).substring(0, 300));
            } else {
              console.log(`  ${k}:`, JSON.stringify(val).substring(0, 200));
            }
          }
        }
      } else {
        console.log("응답:", JSON.stringify(data).substring(0, 300));
      }
    } catch (err) {
      console.log("에러:", err.message?.substring(0, 100));
    }
    console.log();
  }

  console.log("=== 완료 ===");
}

main().catch(console.error);
