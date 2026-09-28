import { Badge, Button, Card, Container, DateSpan } from "@/components/atoms";
import { PublicFooter, PublicHeader } from "@/components/templates/PublicChrome";
import { faMoney } from "@/lib/format";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FadeIn, StaggerList } from "@/motion";

export default async function HomePage() {
  const [session, building, news, bills, plans] = await Promise.all([
    auth(),
    prisma.building.findFirst(),
    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.utilityBill.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.futurePlan.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const name = building?.name ?? "سامانه مدیریت ساختمان";
  const currency = building?.currency ?? "تومان";

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader buildingName={name} loggedIn={Boolean(session?.user)} />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(160deg,var(--accent-soft),var(--canvas)_45%,var(--canvas-deep))]">
          <Container variant="landing" className="py-16 sm:py-24">
            <FadeIn>
              <Badge variant="accent">اطلاع‌رسانی مجتمع</Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl 3xl:text-6xl">
                {name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-ink-muted">
                اخبار ساختمان، قبض‌های مشاع و برنامه‌های پیش رو — شفاف و همیشه در دسترس ساکنین.
              </p>
              {building?.address ? (
                <p className="mt-2 text-sm text-ink-faint">{building.address}</p>
              ) : null}
              <div className="mt-8">
                <Button href={session?.user ? "/panel" : "/login"} size="lg">
                  {session?.user ? "ورود به پنل" : "ورود ساکنین"}
                </Button>
              </div>
            </FadeIn>
          </Container>
        </section>

        <Container variant="landing" className="grid gap-12 py-12 sm:py-16">
          <section>
            <h2 className="mb-6 text-2xl font-bold">آخرین اخبار</h2>
            {news.length ? (
              <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {news.map((item) => (
                  <Card key={item.id} hover>
                    <DateSpan value={item.createdAt} className="text-xs text-ink-faint" />
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-7 text-ink-muted">{item.body}</p>
                  </Card>
                ))}
              </StaggerList>
            ) : (
              <p className="text-ink-muted">هنوز خبری منتشر نشده است.</p>
            )}
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-bold">قبض‌های مشاع</h2>
            {bills.length ? (
              <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {bills.map((bill) => (
                  <Card key={bill.id} hover>
                    <Badge>{bill.type}</Badge>
                    <h3 className="mt-3 font-semibold">
                      <DateSpan value={bill.periodLabel} />
                    </h3>
                    {bill.amount ? (
                      <p className="mt-2 text-accent-deep">{faMoney(bill.amount, currency)}</p>
                    ) : null}
                    {bill.filePath ? (
                      <a
                        className="mt-3 inline-block text-sm text-accent hover:underline"
                        href={`/api/files?path=${encodeURIComponent(bill.filePath)}`}
                      >
                        دانلود قبض
                      </a>
                    ) : null}
                  </Card>
                ))}
              </StaggerList>
            ) : (
              <p className="text-ink-muted">قبض جدیدی ثبت نشده است.</p>
            )}
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-bold">برنامه‌های آینده</h2>
            {plans.length ? (
              <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <Card key={plan.id} hover>
                    {plan.targetDate ? (
                      <DateSpan value={plan.targetDate} className="text-xs text-ink-faint" />
                    ) : null}
                    <h3 className="mt-2 text-lg font-semibold">{plan.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-ink-muted">{plan.description}</p>
                  </Card>
                ))}
              </StaggerList>
            ) : (
              <p className="text-ink-muted">برنامه‌ای اعلام نشده است.</p>
            )}
          </section>
        </Container>
      </main>
      <PublicFooter buildingName={name} />
    </div>
  );
}
