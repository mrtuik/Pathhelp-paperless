package com.pathhelp.paperless;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MlkitOcrPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
