import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../constants/api";
import { useEffect } from "react";

const ITEMS_PER_PAGE = 30;

export const useChatMessages = (chatId, socket) => {
    const queryClient = useQueryClient();
    const queryKey = ["messages", Number(chatId)];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = null }) => {
            // pageParam chính là beforeId (cursor)
            const token = localStorage.getItem("token");
            const params = { limit: ITEMS_PER_PAGE };
            if (pageParam) {
                params.beforeId = pageParam;
            }
            const response = await axios.get(`${API_URL}/chat/messages/${chatId}`, {
                params,
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            return response.data; // Mong đợi trả về array messages
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < ITEMS_PER_PAGE) return undefined;
            // return id của tin nhắn cũ nhất (tin đầu tiên trong mảng trả về vì mảng đã reverse chronological)
            // Backend trả về: oldest -> newest.
            // Nhưng khi phân trang cursor 'beforeId', ta muốn fetch tin cũ hơn tin cũ nhất hiện tại.
            // Backend should return list sorted such that we can easily pick the cursor.
            // Logic backend hiện tại: reverse() -> oldest first.
            // Vậy tin đầu tiên [0] là tin cũ nhất.
            return lastPage[0]?.id;
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity, // Cache forever until manual invalidation
        enabled: !!chatId,
    });

    // Flatten pages to single array
    // data.pages là mảng các mảng messages.
    // Page 0: tin mới nhất (top query). Page 1: tin cũ hơn...
    // Nhưng wait, React Query Infinite Query thường append page mới vào cuối mảng pages.
    // Logic hiển thị chat: Tin cũ ở trên, mới ở dưới.
    // Khi load more (scroll up), ta fetch tin cũ hơn -> Page mới (kết quả tin cũ) được append vào data.pages.
    // Vậy data.pages = [ [Newest Messages], [Older Messages], [Oldest Messages] ]
    // Khi render cần flat và sort lại hoặc đơn giản là reverse mảng pages?
    // Để Virtuoso render đúng, ta cần 1 mảng support index.
    // Tốt nhất là flatMap và đảm bảo thứ tự store là Chronological (Old -> New).

    // Tuy nhiên, InfiniteQuery append page vào cuối.
    // Page 1 (Newest) -> Page 2 (Older).
    // Nếu display flex-col thì [Page 1, Page 2] sẽ hiển thị Newest ở trên, Older ở dưới. SAI.
    // Chat hiển thị: Older ở trên, Newest ở dưới.
    // Nên ta cần: [...Page 2, ...Page 1].

    const messages = data?.pages
        ? data.pages.slice().reverse().flatMap((page) => page)
        : [];

    // Helper function to optimistic update
    const addMessage = (newMessage) => {
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return { pages: [[newMessage]], pageParams: [null] };

            // Tin nhắn mới luôn append vào Main Page (Page đầu tiên trong cấu trúc dữ liệu nếu fetch mới nhất trước)
            // Nhưng structure hiện tại của React Query: Pages[0] là lượt fetch đầu tiên (Latest).
            // Nên ta append vào Pages[0].
            const newPages = [...oldData.pages];
            newPages[0] = [...newPages[0], newMessage];
            return {
                ...oldData,
                pages: newPages,
            };
        });
    };

    return {
        messages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        addMessage,
        queryClient,
        queryKey
    };
};
