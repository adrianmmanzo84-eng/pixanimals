package com.pixanimals.juego;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/** PIXANIMALS en Android (D245): pantalla completa inmersiva; las barras del sistema aparecen al deslizar. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ocultarBarras();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) ocultarBarras();
    }

    private void ocultarBarras() {
        WindowInsetsControllerCompat control = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        control.hide(WindowInsetsCompat.Type.systemBars());
        control.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
