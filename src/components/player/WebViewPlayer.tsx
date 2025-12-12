import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface WebViewPlayerProps {
    visible: boolean;
    url: string;
    title?: string;
    onClose: () => void;
}

export const WebViewPlayer: React.FC<WebViewPlayerProps> = ({
    visible,
    url,
    title,
    onClose,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title || 'Loading...');
    const webViewRef = useRef<WebView>(null);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        if (navState.title) {
            setCurrentTitle(navState.title.substring(0, 40) + (navState.title.length > 40 ? '...' : ''));
        }
    };

    const getPlatformIcon = (url: string): keyof typeof Ionicons.glyphMap => {
        if (url.includes('facebook.com') || url.includes('fb.watch')) return 'logo-facebook';
        if (url.includes('tiktok.com')) return 'logo-tiktok';
        if (url.includes('zingmp3.vn')) return 'musical-notes';
        if (url.includes('nhaccuatui.com')) return 'musical-notes';
        if (url.includes('spotify.com')) return 'musical-notes';
        return 'globe-outline';
    };

    const getPlatformColor = (url: string): string => {
        if (url.includes('facebook.com') || url.includes('fb.watch')) return '#1877F2';
        if (url.includes('tiktok.com')) return '#000000';
        if (url.includes('zingmp3.vn')) return '#9B4DCA';
        if (url.includes('nhaccuatui.com')) return '#F7A700';
        if (url.includes('spotify.com')) return '#1DB954';
        return Colors.primary;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Ionicons
                            name={getPlatformIcon(url)}
                            size={18}
                            color={getPlatformColor(url)}
                        />
                        <Text style={styles.title} numberOfLines={1}>
                            {currentTitle}
                        </Text>
                    </View>

                    <View style={styles.navButtons}>
                        <TouchableOpacity
                            style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
                            onPress={() => webViewRef.current?.goBack()}
                            disabled={!canGoBack}
                        >
                            <Ionicons name="arrow-back" size={20} color={canGoBack ? Colors.text : Colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
                            onPress={() => webViewRef.current?.goForward()}
                            disabled={!canGoForward}
                        >
                            <Ionicons name="arrow-forward" size={20} color={canGoForward ? Colors.text : Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    style={styles.webview}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onNavigationStateChange={handleNavigationStateChange}
                    allowsFullscreenVideo={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    allowsInlineMediaPlayback={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.backgroundCard,
    },
    backBtn: {
        padding: Spacing.xs,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
    },
    title: {
        flex: 1,
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    navButtons: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    navBtn: {
        padding: Spacing.xs,
    },
    navBtnDisabled: {
        opacity: 0.5,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
});

export default WebViewPlayer;
