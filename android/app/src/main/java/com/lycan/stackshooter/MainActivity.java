package com.lycan.stackshooter;

import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final Handler backHandler = new Handler();
    private int backPressStage = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceShellPlugin.class);
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveMode();
    }

    private void applyImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public void onBackPressed() {
        if (bridge == null) {
            super.onBackPressed();
            return;
        }

        if (backPressStage == 0) {
            backPressStage = 1;
            bridge.triggerDocumentJSEvent("backbutton");
            backHandler.postDelayed(() -> backPressStage = 0, 2500);
        } else if (backPressStage == 1) {
            backPressStage = 2;
            bridge.triggerDocumentJSEvent("backbuttonsecond");
            backHandler.postDelayed(() -> backPressStage = 0, 2500);
        } else {
            backPressStage = 0;
            super.onBackPressed();
        }
    }
}
