"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isInMyList, addToMyList, removeFromMyList } from "@/api/my-list";

export function useMyList(contentId: string) {
  const queryClient = useQueryClient();

  const { data: isInList = false, isLoading } = useQuery({
    queryKey: ["my-list", contentId],
    queryFn: () => isInMyList(contentId),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: () => {
      return isInList
        ? removeFromMyList(contentId)
        : addToMyList(contentId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["my-list", contentId] });
      const previous = queryClient.getQueryData<boolean>(["my-list", contentId]);
      queryClient.setQueryData(["my-list", contentId], !isInList);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["my-list", contentId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-list"] });
    },
  });

  return { isInList, toggle, isLoading };
}
