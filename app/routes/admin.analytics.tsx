import { useLoaderData } from "react-router";
import type { Route } from "./+types/admin.analytics";
import { requireAuth } from "~/lib/auth";
import { getUserLinks } from "~/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { BarChart3, TrendingUp, Link2 } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  
  let links;
  if (user.isAdmin) {
    // Admin can see all links
    links = await context.db.query.links.findMany({
      orderBy: (links, { desc }) => [desc(links.hits)],
    });
  } else {
    // Regular user can only see their own links
    links = await getUserLinks(context.db, user.userId);
  }

  // Calculate stats
  const totalClicks = links.reduce((sum: number, link: any) => sum + link.hits, 0);
  const totalLinks = links.length;
  const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0;

  // Get top 10 links
  const topLinks = links.slice(0, 10);

  return { user, links, totalClicks, totalLinks, avgClicksPerLink, topLinks };
}

export default function AdminAnalytics() {
  const { totalClicks, totalLinks, avgClicksPerLink, topLinks } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Across all links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
            <p className="text-xs text-muted-foreground">
              Short links created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClicksPerLink}</div>
            <p className="text-xs text-muted-foreground">
              Average performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Links</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No data available yet
                  </TableCell>
                </TableRow>
              ) : (
                topLinks.map((link: any, index: number) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>
                      <a
                        href={`/${link.alias}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {link.alias}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {link.link}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {link.hits}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
