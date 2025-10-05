import { useState } from "react";
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/admin.links";
import { requireAuth } from "~/lib/auth";
import { getUserLinks, createRedirect, updateRedirect, deleteRedirect } from "~/lib/data";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PlusCircle, Pencil, Trash2, ExternalLink } from "lucide-react";
import { eq } from "drizzle-orm";
import * as schema from "../../database/schema";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireAuth(request, context.db);
  
  let links;
  if (user.isAdmin) {
    // Admin can see all links
    links = await context.db.query.links.findMany({
      orderBy: (links, { desc }) => [desc(links.createdAt)],
    });
  } else {
    // Regular user can only see their own links
    links = await getUserLinks(context.db, user.userId);
  }

  // Calculate stats
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum: number, link: any) => sum + link.hits, 0);

  return { user, links, totalLinks, totalClicks };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = await requireAuth(request, context.db);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const alias = formData.get("alias") as string;
    const url = formData.get("url") as string;

    if (!alias || !url) {
      return { success: false, message: "Alias and URL are required" };
    }

    const result = await createRedirect(context.db, url, [alias], user.userId);

    if (result === 0) {
      return { success: true, message: "Link created successfully" };
    } else if (result === 1) {
      return { success: false, message: "Alias already exists" };
    } else {
      return { success: false, message: "Invalid URL" };
    }
  }

  if (intent === "edit") {
    const linkId = parseInt(formData.get("linkId") as string);
    const newAlias = formData.get("alias") as string;
    const newUrl = formData.get("url") as string;

    if (!linkId || !newAlias || !newUrl) {
      return { success: false, message: "All fields are required" };
    }

    // Get current link
    const currentLink = await context.db.query.links.findFirst({
      where: eq(schema.links.id, linkId),
    });

    if (!currentLink) {
      return { success: false, message: "Link not found" };
    }

    // Check if user owns this link or is admin
    if (currentLink.userId !== user.userId && !user.isAdmin) {
      return { success: false, message: "Unauthorized" };
    }

    // Check if new alias already exists (if alias is changing)
    if (currentLink.alias !== newAlias) {
      const existingAlias = await context.db.query.links.findFirst({
        where: eq(schema.links.alias, newAlias),
      });

      if (existingAlias) {
        return { success: false, message: "New alias already exists" };
      }

      // Update with new alias and URL
      await context.db.update(schema.links)
        .set({ alias: newAlias, link: newUrl })
        .where(eq(schema.links.id, linkId));
    } else {
      // Just update URL using existing function
      await updateRedirect(context.db, newUrl, [currentLink.alias]);
    }

    return { success: true, message: "Link updated successfully" };
  }

  if (intent === "delete") {
    const linkId = parseInt(formData.get("linkId") as string);

    if (!linkId) {
      return { success: false, message: "Link ID is required" };
    }

    const link = await context.db.query.links.findFirst({
      where: eq(schema.links.id, linkId),
    });

    if (!link) {
      return { success: false, message: "Link not found" };
    }

    // Check if user owns this link or is admin
    if (link.userId !== user.userId && !user.isAdmin) {
      return { success: false, message: "Unauthorized" };
    }

    await deleteRedirect(context.db, [link.alias]);

    return { success: true, message: "Link deleted successfully" };
  }

  return { success: false, message: "Invalid intent" };
}

export default function AdminLinks() {
  const { user, links, totalLinks, totalClicks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Message */}
      {actionData && (
        <div
          className={`p-4 rounded-lg ${
            actionData.success
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {actionData.message}
        </div>
      )}

      {/* Links Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Links</CardTitle>
              <CardDescription>Manage your short links</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <Form method="post" onSubmit={() => setCreateOpen(false)}>
                  <input type="hidden" name="intent" value="create" />
                  <DialogHeader>
                    <DialogTitle>Create New Link</DialogTitle>
                    <DialogDescription>
                      Add a new short link to your collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="create-alias">Alias</Label>
                      <Input
                        id="create-alias"
                        name="alias"
                        placeholder="my-link"
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="create-url">Destination URL</Label>
                      <Input
                        id="create-url"
                        name="url"
                        type="url"
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Link"}
                    </Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No links yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <a
                        href={`/${link.alias}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline"
                      >
                        {link.alias}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {link.link}
                    </TableCell>
                    <TableCell>{link.hits}</TableCell>
                    <TableCell>
                      {new Date(link.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLink(link);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedLink(link);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form
            method="post"
            onSubmit={() => {
              setEditOpen(false);
              setSelectedLink(null);
            }}
          >
            <input type="hidden" name="intent" value="edit" />
            <input type="hidden" name="linkId" value={selectedLink?.id} />
            <DialogHeader>
              <DialogTitle>Edit Link</DialogTitle>
              <DialogDescription>
                Update the alias or destination URL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-alias">Alias</Label>
                <Input
                  id="edit-alias"
                  name="alias"
                  defaultValue={selectedLink?.alias}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-url">Destination URL</Label>
                <Input
                  id="edit-url"
                  name="url"
                  type="url"
                  defaultValue={selectedLink?.link}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form
            method="post"
            onSubmit={() => {
              setDeleteOpen(false);
              setSelectedLink(null);
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="linkId" value={selectedLink?.id} />
            <DialogHeader>
              <DialogTitle>Delete Link</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedLink?.alias}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
