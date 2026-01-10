import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook để tối ưu hóa việc load và render messages
 * - Lazy loading: Load messages theo batch
 * - Infinite scroll: Load more khi scroll lên
 * - Virtualization: Chỉ render messages trong viewport
 */
export const useMessageOptimization = (allMessages, initialBatchSize = 30) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lastScrollHeight = useRef(0);

  // Initialize visible messages
  useEffect(() => {
    if (allMessages.length > 0) {
      const latest = allMessages.slice(-initialBatchSize);
      setVisibleMessages(latest);
      setHasMore(allMessages.length > initialBatchSize);
    }
  }, [allMessages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    // Only scroll if user is near bottom (within 200px)
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [visibleMessages.length]);

  // Load more messages (when scrolling up)
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Save current scroll position
    if (scrollContainerRef.current) {
      lastScrollHeight.current = scrollContainerRef.current.scrollHeight;
    }

    setTimeout(() => {
      const currentCount = visibleMessages.length;
      const totalCount = allMessages.length;

      if (currentCount >= totalCount) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
      }

      // Load next batch (30 messages)
      const nextBatchSize = Math.min(30, totalCount - currentCount);
      const startIndex = totalCount - currentCount - nextBatchSize;
      const endIndex = totalCount - currentCount;

      const olderMessages = allMessages.slice(startIndex, endIndex);
      setVisibleMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(startIndex > 0);
      setIsLoadingMore(false);

      // Restore scroll position after loading
      if (scrollContainerRef.current) {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        const scrollDiff = newScrollHeight - lastScrollHeight.current;
        scrollContainerRef.current.scrollTop = scrollDiff;
      }
    }, 300);
  }, [allMessages, visibleMessages, hasMore, isLoadingMore]);

  // Scroll to specific message (for search)
  const scrollToMessage = useCallback((messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight message briefly
      messageElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100');
      }, 2000);
    }
  }, []);

  // Detect scroll to top
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop } = scrollContainerRef.current;

    // If scrolled near top (within 100px), load more
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    visibleMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    scrollToMessage,
    handleScroll,
    messagesEndRef,
    scrollContainerRef,
  };
};
