import { sql } from "drizzle-orm";
import { communityPostsTable, db } from "@workspace/db";
import { logger } from "./logger";

const authors = [
  "김민준",
  "이서연",
  "박지훈",
  "최유진",
  "정도현",
  "한지우",
  "윤서준",
  "강예은",
  "오지훈",
  "임수빈",
  "서현우",
  "배지민",
  "문채원",
  "조현우",
  "송하윤",
  "장도윤",
  "신예린",
  "권태호",
  "안수아",
  "류건우",
  "홍서진",
  "전민재",
  "고은채",
  "김도윤",
  "최서윤",
  "정우진",
  "한나연",
  "윤지호",
];

const categories = ["번호 흐름", "당첨 후기", "자유 토론", "분석 질문"];
const titles = [
  "이번 주 번호 조합은 어떻게 보시나요?",
  "지난 회차 결과를 보고 다시 느낀 점",
  "자동 번호와 수동 번호 중 고민입니다",
  "최근 당첨 번호 흐름이 궁금해요",
  "분석 번호 받아보신 분 계신가요?",
  "번호를 고를 때 참고하는 기준이 있나요?",
  "이번 회차는 어떤 숫자를 눈여겨보시나요?",
  "꾸준히 참여하니 조금씩 감이 오는 것 같아요",
];
const contents = [
  "지난 회차 결과를 보면서 번호를 고르는 기준을 다시 생각해 보게 됐습니다. 다른 분들은 어떤 흐름을 참고하시는지 궁금해서 글 남겨요.",
  "최근에 여러 조합을 비교해 보고 있는데 혼자 판단하려니 쉽지 않네요. 비슷한 방식으로 번호를 고르고 계신 분들의 경험을 듣고 싶습니다.",
  "처음에는 단순히 감으로 골랐는데 최근에는 지난 회차와 연속 숫자도 같이 보고 있습니다. 참고할 만한 기준이 있다면 공유 부탁드립니다.",
  "이번 주에도 무리하지 않는 선에서 참여해 보려고 합니다. 분석 내용을 참고하시는 분들이 있다면 실제로 어떤 점이 도움이 됐는지 궁금합니다.",
  "번호를 정할 때 홀짝 비율과 지난 당첨 번호를 함께 보고 있습니다. 다른 회원님들은 어떤 방식으로 조합하시는지 의견 부탁드려요.",
];

function createSeedPosts() {
  const values: Array<typeof communityPostsTable.$inferInsert> = [];

  // 2023년 1월부터 2026년 8월까지 홀수 달은 2개, 짝수 달은 3개씩 만든다.
  // 총 44개월에 걸쳐 110개의 공개 게시글이 생성된다.
  for (let monthIndex = 0; monthIndex < 44; monthIndex += 1) {
    const year = 2023 + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const days = monthIndex % 2 === 0 ? [6, 17] : [6, 17, 25];

    days.forEach((day, postIndex) => {
      const createdAt = new Date(Date.UTC(
        year,
        month,
        day,
        10 + ((monthIndex + postIndex) % 9),
        (monthIndex * 11 + postIndex * 17) % 60,
      ));
      const contentIndex = (monthIndex + postIndex) % contents.length;

      values.push({
        authorName: authors[(monthIndex * 2 + postIndex) % authors.length],
        category: categories[(monthIndex + postIndex) % categories.length],
        title: titles[(monthIndex + postIndex * 2) % titles.length],
        content: contents[contentIndex],
        replyCount: (monthIndex * 3 + postIndex * 2) % 6,
        status: "published",
        createdAt,
        updatedAt: createdAt,
      });
    });
  }

  return values;
}

export async function seedCommunityPosts() {
  return db.transaction(async (tx) => {
    // Autoscale 인스턴스가 동시에 시작해도 한 인스턴스만 초기 데이터를 넣도록 잠근다.
    await tx.execute(sql`select pg_advisory_xact_lock(2026083001)`);

    const [existing] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(communityPostsTable);

    if ((existing?.count ?? 0) > 0) {
      return { created: 0, total: existing.count ?? 0 };
    }

    const posts = createSeedPosts();
    await tx.insert(communityPostsTable).values(posts);
    logger.info({ count: posts.length }, "Seeded initial community posts");
    return { created: posts.length, total: posts.length };
  });
}