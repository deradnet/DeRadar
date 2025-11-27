package network.derad.deradar;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable WebView performance optimizations
        WebView webView = getBridge().getWebView();

        // Enable hardware acceleration for smoother rendering
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

        // WebView settings for better performance
        webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);

        // Enable aggressive caching for static resources
        webView.getSettings().setLoadsImagesAutomatically(true);

        // Disable unnecessary features for performance
        webView.getSettings().setSaveFormData(false);
        webView.getSettings().setSupportZoom(false);

        // Enable JavaScript optimization
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
    }
}
