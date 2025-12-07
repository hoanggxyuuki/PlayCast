
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface DownloadItem {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    platform: 'youtube' | 'soundcloud' | 'local';
    sourceUrl: string;
    localPath: string;
    fileSize: number;
    downloadedAt: Date;
    mimeType: string;
}

export interface DownloadProgress {
    id: string;
    progress: number;
    downloadedBytes: number;
    totalBytes: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    error?: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

const STORAGE_KEY = '@playcast_downloads';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`;

class DownloadServiceClass {
    private downloads: Map<string, DownloadItem> = new Map();
    private activeDownloads: Map<string, FileSystem.DownloadResumable> = new Map();
    private progressCallbacks: Map<string, ProgressCallback[]> = new Map();
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;

        // Ensure download directory exists
        const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
        }

        // Load saved downloads
        await this.loadDownloads();
        this.initialized = true;
        console.log('[Downloads] Initialized with', this.downloads.size, 'items');
    }

    private async loadDownloads(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const items: DownloadItem[] = JSON.parse(stored);
                for (const item of items) {
                    // Verify file still exists
                    const info = await FileSystem.getInfoAsync(item.localPath);
                    if (info.exists) {
                        this.downloads.set(item.id, {
                            ...item,
                            downloadedAt: new Date(item.downloadedAt),
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[Downloads] Failed to load:', error);
        }
    }

    private async saveDownloads(): Promise<void> {
        try {
            const items = Array.from(this.downloads.values());
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('[Downloads] Failed to save:', error);
        }
    }

    async startDownload(
        id: string,
        title: string,
        artist: string,
        thumbnail: string,
        duration: number,
        platform: 'youtube' | 'soundcloud' | 'local',
        sourceUrl: string,
        mimeType: string = 'video/mp4'
    ): Promise<string> {
        await this.init();

        // Generate filename
        const extension = mimeType.includes('audio') ? 'mp3' : 'mp4';
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const filename = `${safeTitle}_${Date.now()}.${extension}`;
        const localPath = `${DOWNLOAD_DIR}${filename}`;

        // Create download task
        const downloadResumable = FileSystem.createDownloadResumable(
            sourceUrl,
            localPath,
            {},
            (downloadProgress) => {
                const progress: DownloadProgress = {
                    id,
                    progress: downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite,
                    downloadedBytes: downloadProgress.totalBytesWritten,
                    totalBytes: downloadProgress.totalBytesExpectedToWrite,
                    status: 'downloading',
                };
                this.notifyProgress(id, progress);
            }
        );

        this.activeDownloads.set(id, downloadResumable);

        // Notify start
        this.notifyProgress(id, {
            id,
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            status: 'pending',
        });

        try {
            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                const fileInfo = await FileSystem.getInfoAsync(result.uri);

                const item: DownloadItem = {
                    id,
                    title,
                    artist,
                    thumbnail,
                    duration,
                    platform,
                    sourceUrl,
                    localPath: result.uri,
                    fileSize: (fileInfo as any).size || 0,
                    downloadedAt: new Date(),
                    mimeType,
                };

                this.downloads.set(id, item);
                await this.saveDownloads();

                this.notifyProgress(id, {
                    id,
                    progress: 1,
                    downloadedBytes: (fileInfo as any).size || 0,
                    totalBytes: (fileInfo as any).size || 0,
                    status: 'completed',
                });

                console.log('[Downloads] Completed:', title);
                return result.uri;
            } else {
                throw new Error('Download failed');
            }
        } catch (error: any) {
            this.notifyProgress(id, {
                id,
                progress: 0,
                downloadedBytes: 0,
                totalBytes: 0,
                status: 'failed',
                error: error.message,
            });
            throw error;
        } finally {
            this.activeDownloads.delete(id);
        }
    }

    async cancelDownload(id: string): Promise<void> {
        const download = this.activeDownloads.get(id);
        if (download) {
            await download.pauseAsync();
            this.activeDownloads.delete(id);
            this.notifyProgress(id, {
                id,
                progress: 0,
                downloadedBytes: 0,
                totalBytes: 0,
                status: 'cancelled',
            });
        }
    }

    async deleteDownload(id: string): Promise<void> {
        const item = this.downloads.get(id);
        if (item) {
            try {
                await FileSystem.deleteAsync(item.localPath, { idempotent: true });
            } catch (error) {
                console.error('[Downloads] Failed to delete file:', error);
            }
            this.downloads.delete(id);
            await this.saveDownloads();
            console.log('[Downloads] Deleted:', item.title);
        }
    }

    getDownload(id: string): DownloadItem | undefined {
        return this.downloads.get(id);
    }

    getAllDownloads(): DownloadItem[] {
        return Array.from(this.downloads.values()).sort(
            (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
        );
    }

    isDownloaded(id: string): boolean {
        return this.downloads.has(id);
    }

    isDownloading(id: string): boolean {
        return this.activeDownloads.has(id);
    }

    onProgress(id: string, callback: ProgressCallback): () => void {
        if (!this.progressCallbacks.has(id)) {
            this.progressCallbacks.set(id, []);
        }
        this.progressCallbacks.get(id)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.progressCallbacks.get(id);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    private notifyProgress(id: string, progress: DownloadProgress): void {
        const callbacks = this.progressCallbacks.get(id);
        if (callbacks) {
            callbacks.forEach((cb) => cb(progress));
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    async getStorageUsed(): Promise<number> {
        let total = 0;
        for (const item of this.downloads.values()) {
            total += item.fileSize;
        }
        return total;
    }

    async clearAllDownloads(): Promise<void> {
        for (const id of this.downloads.keys()) {
            await this.deleteDownload(id);
        }
    }
}

export const DownloadService = new DownloadServiceClass();
