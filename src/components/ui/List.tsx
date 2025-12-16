
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    FlatListProps,
    ListRenderItem,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

export interface ListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyState?: {
    icon?: string;
    title: string;
    description?: string;
    action?: {
      title: string;
      onPress: () => void;
    };
  };
  loadingText?: string;
  contentContainerStyle?: any;
  showSeparator?: boolean;
  estimatedItemSize?: number;
  numColumns?: number;
}

export function List<T>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  refreshing = false,
  onRefresh,
  emptyState,
  loadingText = 'Loading...',
  contentContainerStyle,
  showSeparator = false,
  estimatedItemSize,
  numColumns = 1,
  ...flatListProps
}: ListProps<T>) {
  const renderEmptyState = () => {
    if (loading) {
      return <LoadingSpinner text={loadingText} />;
    }

    if (emptyState && data.length === 0) {
      return (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      );
    }

    return null;
  };

  const renderSeparator = () => {
    if (!showSeparator) return null;

    return (
      <View style={styles.separator} />
    );
  };

  const renderFooter = () => {
    if (loading && data.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
      ]}
      style={styles.container}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      getItemLayout={
        estimatedItemSize
          ? (data, index) => ({
              length: estimatedItemSize,
              offset: estimatedItemSize * index,
              index,
            })
          : undefined
      }
      numColumns={numColumns}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});