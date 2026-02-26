import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useThreadList({ teamId, perPage = 20 }: { teamId: string; perPage?: number }) {
	const { data } = useSuspenseQuery(
		orpc.chat.listThreads.queryOptions({
			input: { teamId, page: 0, perPage },
		}),
	);
	return data.threads;
}
