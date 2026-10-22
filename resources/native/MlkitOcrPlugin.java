package com.pathhelp.paperless;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "MlkitOcr")
public class MlkitOcrPlugin extends Plugin {

    @PluginMethod
    public void recognize(final PluginCall call) {
        String b64 = call.getString("image");
        if (b64 == null || b64.isEmpty()) {
            call.reject("No image given");
            return;
        }

        Bitmap bitmap = null;
        try {
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception e) {
            bitmap = null;
        }
        if (bitmap == null) {
            call.reject("Could not decode the image");
            return;
        }

        final TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        InputImage image = InputImage.fromBitmap(bitmap, 0);
        recognizer
            .process(image)
            .addOnSuccessListener(result -> {
                JSObject ret = new JSObject();
                ret.put("text", result.getText());
                call.resolve(ret);
                recognizer.close();
            })
            .addOnFailureListener(e -> {
                call.reject("Text recognition failed: " + e.getMessage());
                recognizer.close();
            });
    }
}
