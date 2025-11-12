// Subtitle Manager Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export interface Subtitle {
  id: string;
  language: string;
  label: string;
  url: string;
  type: 'srt' | 'vtt' | 'ass';
}

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

interface SubtitleManagerProps {
  currentTime: number;
  subtitle: Subtitle | null;
  fontSize?: number;
  position?: 'bottom' | 'top';
}

export const SubtitleManager: React.FC<SubtitleManagerProps> = ({
  currentTime,
  subtitle,
  fontSize = FontSizes.md,
  position = 'bottom',
}) => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);

  useEffect(() => {
    if (subtitle) {
      loadSubtitle(subtitle);
    } else {
      setCues([]);
      setCurrentCue(null);
    }
  }, [subtitle]);

  useEffect(() => {
    if (cues.length > 0) {
      const cue = cues.find(c => currentTime >= c.start && currentTime < c.end);
      setCurrentCue(cue || null);
    }
  }, [currentTime, cues]);

  const loadSubtitle = async (sub: Subtitle) => {
    try {
      const response = await fetch(sub.url);
      const content = await response.text();

      let parsedCues: SubtitleCue[];
      switch (sub.type) {
        case 'srt':
          parsedCues = parseSRT(content);
          break;
        case 'vtt':
          parsedCues = parseVTT(content);
          break;
        default:
          parsedCues = [];
      }

      setCues(parsedCues);
    } catch (error) {
      console.error('Failed to load subtitle:', error);
    }
  };

  const parseSRT = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const blocks = content.trim().split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const timeLine = lines[1];
      const textLines = lines.slice(2);

      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;

      const start = parseTime(timeMatch[1].replace(',', '.'));
      const end = parseTime(timeMatch[2].replace(',', '.'));
      const text = textLines.join('\n');

      cues.push({ start, end, text });
    }

    return cues;
  };

  const parseVTT = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    let i = 0;

    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }

    while (i < lines.length) {
      const line = lines[i];
      if (line.includes('-->')) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          const start = parseTime(timeMatch[1]);
          const end = parseTime(timeMatch[2]);

          i++;
          const textLines = [];
          while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i]);
            i++;
          }

          if (textLines.length > 0) {
            cues.push({ start, end, text: textLines.join('\n') });
          }
        }
      }
      i++;
    }

    return cues;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsParts = parts[2].split(/[.,]/);
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]);

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  if (!currentCue) return null;

  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <View style={styles.textContainer}>
        <Text style={[styles.text, { fontSize }]}>{currentCue.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  top: {
    top: Spacing.xl,
  },
  bottom: {
    bottom: Spacing.xl + 60, // Above controls
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 4,
    maxWidth: '90%',
  },
  text: {
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
