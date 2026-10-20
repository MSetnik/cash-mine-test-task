import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "./session";
import { presentActivity } from "@/data/presentation";
export function useActivity() {
  const { api, request } = useSession();
  const query = useInfiniteQuery({
    queryKey: ["activity"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      request(() =>
        api.getActivity({ limit: 20, cursor: pageParam }, { signal }),
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const unique = new Map();
  for (const page of query.data?.pages ?? [])
    for (const item of page.items)
      if (!unique.has(item.id)) unique.set(item.id, presentActivity(item));
  return {
    ...query,
    items: [...unique.values()] as ReturnType<typeof presentActivity>[],
  };
}
