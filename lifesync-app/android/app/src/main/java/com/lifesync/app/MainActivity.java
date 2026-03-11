package com.lifesync.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 뒤로가기 제스처/버튼 → JS에 커스텀 이벤트만 발송
        // 모든 백 로직(모달 닫기, 홈 이동, 앱 종료)은 JS에서 처리
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('nativeBack'))",
                    null
                );
            }
        });
    }
}
