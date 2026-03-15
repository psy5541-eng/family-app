// 가민 API 테스트 - 1회 로그인 후 세션 유지하며 데이터 확인
import { GarminConnect } from "garmin-connect";
import CryptoJS from "crypto-js";

// .env.local에서 값 가져오기
const ENCRYPTION_KEY = "Qdij8d1JISOC*1kcpzjq8omPCiw";

// DB에서 가져온 암호화된 패스워드 (wrangler로 조회 필요)
// 일단 직접 로그인 정보 사용
const GARMIN_EMAIL = "zzo777@naver.com";

// 암호화된 패스워드를 복호화하려면 DB에서 가져와야 함
// 여기서는 직접 wrangler D1로 조회
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
  console.log("=== 가민 API 테스트 (1회 로그인) ===\n");

  // 1. DB에서 암호화된 비밀번호 가져오기
  console.log("1) DB에서 암호화된 비밀번호 조회...");
  const encryptedPw = await getEncryptedPassword();
  const password = decryptPassword(encryptedPw);
  console.log("   복호화 성공\n");

  // 2. 가민 로그인 (1회만!)
  console.log("2) 가민 로그인 시도...");
  const GC = new GarminConnect({ username: GARMIN_EMAIL, password });
  try {
    await GC.login();
    console.log("   로그인 성공!\n");
  } catch (err) {
    console.error("   로그인 실패:", err.message);
    if (err.message?.includes("429") || err.message?.includes("rate")) {
      console.error("   → 레이트 리밋 아직 안 풀림. 나중에 다시 시도.");
    }
    return;
  }

  // 3. 활동 목록 가져오기
  console.log("3) getActivities(0, 3) - 최근 3개 활동...");
  const activities = await GC.getActivities(0, 3);
  for (const act of activities) {
    console.log(`   [${act.activityId}] ${act.activityName}`);
    console.log(`     distance: ${act.distance}m (${(act.distance/1000).toFixed(2)}km)`);
    console.log(`     duration: ${act.duration}s`);
    console.log(`     manualActivity: ${act.manualActivity}`);
    console.log(`     deviceId: ${act.deviceId}`);
    console.log(`     startTimeLocal: ${act.startTimeLocal}`);
    console.log(`     startTimeGMT: ${act.startTimeGMT}`);
    console.log(`     beginTimestamp: ${act.beginTimestamp}`);
    console.log();
  }

  // 4. 첫 번째 활동의 상세 데이터 (splitSummaries)
  const targetId = activities[0].activityId;
  console.log(`4) getActivity(${targetId}) - splitSummaries 확인...`);
  const detail = await GC.getActivity({ activityId: String(targetId) });

  if (detail.splitSummaries) {
    console.log("   splitSummaries:");
    for (const split of detail.splitSummaries) {
      console.log(`     [${split.splitType}] distance=${split.distance}m (${(split.distance/1000).toFixed(2)}km), duration=${split.duration}s`);
    }
  } else {
    console.log("   splitSummaries: 없음");
  }
  console.log();

  // 5. splits API 테스트 (km별 랩)
  console.log(`5) splits API 테스트 (activity ${targetId})...`);
  try {
    const splitsUrl = `https://connect.garmin.com/proxy/activity-service/activity/${targetId}/splits`;
    const splitsData = await GC.get(splitsUrl);
    console.log("   splits 응답 키:", Object.keys(splitsData || {}));

    if (splitsData?.lapDTOs) {
      console.log(`   lapDTOs: ${splitsData.lapDTOs.length}개`);
      for (const lap of splitsData.lapDTOs) {
        const distKm = ((lap.distance || 0) / 1000).toFixed(2);
        const dur = Math.round(lap.duration || 0);
        const pace = distKm > 0 ? Math.round(dur / distKm) : 0;
        console.log(`     Lap: ${distKm}km, ${dur}s, pace=${pace}s/km`);
      }
    } else {
      console.log("   lapDTOs 없음. 전체 응답:");
      console.log("  ", JSON.stringify(splitsData).substring(0, 500));
    }
  } catch (err) {
    console.log("   splits API 에러:", err.message);
  }
  console.log();

  // 6. 다른 splits 엔드포인트 시도
  console.log(`6) 대안 API 테스트...`);

  // activity-service/activity/{id} 직접 호출
  try {
    const url1 = `https://connect.garmin.com/proxy/activity-service/activity/${targetId}`;
    const data1 = await GC.get(url1);
    if (data1?.splitSummaries) {
      console.log("   activity-service splitSummaries:");
      for (const s of data1.splitSummaries) {
        console.log(`     [${s.splitType}] dist=${s.distance}, dur=${s.duration}, noOfSplits=${s.noOfSplits}`);
      }
    }
    // metadataDTO에 유용한 정보 있는지
    if (data1?.metadataDTO) {
      console.log("   metadataDTO.isOriginal:", data1.metadataDTO.isOriginal);
      console.log("   metadataDTO.isEdited:", data1.metadataDTO.isEdited);
    }
  } catch (err) {
    console.log("   activity-service 에러:", err.message);
  }

  // split_summaries 엔드포인트
  try {
    const url2 = `https://connect.garmin.com/proxy/activity-service/activity/${targetId}/split_summaries`;
    const data2 = await GC.get(url2);
    console.log("   split_summaries 응답 키:", Object.keys(data2 || {}));
    if (Array.isArray(data2)) {
      console.log("   배열 길이:", data2.length);
      if (data2.length > 0) console.log("   첫 항목:", JSON.stringify(data2[0]).substring(0, 300));
    } else {
      console.log("   응답:", JSON.stringify(data2).substring(0, 300));
    }
  } catch (err) {
    console.log("   split_summaries 에러:", err.message);
  }

  console.log("\n=== 테스트 완료 ===");
}

main().catch(console.error);
