package com.lycan.stackshooter;

import android.content.pm.ActivityInfo;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceShell")
public class DeviceShellPlugin extends Plugin {

    @PluginMethod
    public void setOrientation(PluginCall call) {
        String orientation = call.getString("orientation", "portrait");
        int requestedOrientation = "landscape".equals(orientation)
            ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            : ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;

        getActivity().setRequestedOrientation(requestedOrientation);
        JSObject result = new JSObject();
        result.put("orientation", orientation);
        call.resolve(result);
    }
}
