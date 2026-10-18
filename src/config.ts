// 公開する GitHub リポジトリの URL。.env の VITE_REPO_URL で設定します(.env.example を参照)。
// 未設定のときは、「情報を直す」などの GitHub へのリンクを出しません。
const raw = import.meta.env.VITE_REPO_URL as string | undefined;

export const REPO_URL = (raw ?? '').replace(/\/+$/, '');

/** データ提案フォーム(Issue)を、内容を入れた状態で開く URL */
export function dataIssueUrl(params: { title: string; game?: string; item?: string }): string | undefined {
  if (!REPO_URL) return undefined;
  const q = new URLSearchParams({
    template: 'data_contribution.yml',
    title: `[データ] ${params.title}`,
  });
  if (params.game) q.set('game', params.game);
  if (params.item) q.set('item', params.item);
  return `${REPO_URL}/issues/new?${q.toString()}`;
}

export const CONTRIBUTING_URL = REPO_URL ? `${REPO_URL}/blob/main/CONTRIBUTING.md` : undefined;
