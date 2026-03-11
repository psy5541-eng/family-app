package com.lifesync.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 뒤로가기 제스처/버튼 → JS에 커스텀 이벤트만 발송
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('nativeBack'))",
                    null
                );
            }
        });

        // WebView에서 intent://, nmap://, tmap:// 등 외부 앱 스킴 처리
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                if (url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (intent.resolveActivity(getPackageManager()) != null) {
                            startActivity(intent);
                        } else {
                            // 앱 미설치 시 fallback URL 또는 Play Store
                            String fallback = intent.getStringExtra("browser_fallback_url");
                            if (fallback != null) {
                                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)));
                            } else if (intent.getPackage() != null) {
                                startActivity(new Intent(Intent.ACTION_VIEW,
                                    Uri.parse("market://details?id=" + intent.getPackage())));
                            }
                        }
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                // nmap://, tmap:// 등 커스텀 스킴 직접 처리
                if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        if (intent.resolveActivity(getPackageManager()) != null) {
                            startActivity(intent);
                            return true;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }
}
