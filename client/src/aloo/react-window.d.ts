declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps<T = any> {
    index: number;
    style: React.CSSProperties;
    data: T;
  }

  export interface FixedSizeListProps {
    children: React.ComponentType<ListChildComponentProps>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    height: number;
    innerElementType?: React.ReactType;
    innerRef?: React.Ref<any>;
    innerTagName?: string;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => string | number;
    itemSize: number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerElementType?: React.ReactType;
    outerRef?: React.Ref<any>;
    outerTagName?: string;
    overscanCount?: number;
    style?: React.CSSProperties;
    width: string | number;
  }

  export class FixedSizeList<T = any> extends React.Component<FixedSizeListProps> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
  }

  export { FixedSizeList as List };
}
