import { useState } from "react";
import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.users";
import { requireAuth } from "~/lib/auth";
import { getAllUsers, createUserByAdmin, updateUser, deleteUser } from "~/lib/data";
import { getGravatarURL } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { UserPlus, Pencil, Trash2, Shield, User, AlertCircle, CheckCircle, Key } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const users = await getAllUsers(context.db);

  return { users, currentUser: user };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = await requireAuth(request);

  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "create") {
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const isAdmin = formData.get("isAdmin") === "true";

    const result = await createUserByAdmin(
      context.db,
      username,
      email,
      password || null,
      isAdmin
    );

    return result;
  }

  if (actionType === "update") {
    const userId = parseInt(formData.get("userId") as string);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const isAdmin = formData.get("isAdmin") === "true";

    const updates: any = { username, email, isAdmin };
    if (password) {
      updates.password = password;
    }

    return await updateUser(context.db, userId, updates);
  }

  if (actionType === "delete") {
    const userId = parseInt(formData.get("userId") as string);

    // Prevent self-deletion
    if (userId === user.userId) {
      return { success: false, message: "You cannot delete yourself!" };
    }

    return await deleteUser(context.db, userId);
  }

  return { success: false, message: "Invalid action" };
}

export default function AdminUsers() {
  const { users, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Close dialogs on success
  if (actionData?.success) {
    setTimeout(() => {
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setDeleteDialogOpen(false);
    }, 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. Leave password empty to generate a
                random one.
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <input type="hidden" name="actionType" value="create" />
              <div className="grid gap-4 py-4">
                {actionData?.success === false && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{actionData.message}</span>
                  </div>
                )}
                {actionData?.success && "generatedPassword" in actionData && (actionData as any).generatedPassword && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <CheckCircle size={16} />
                      <span>User Created Successfully!</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Key size={16} />
                      <span className="text-sm">
                        Generated Password:{" "}
                        <code className="bg-green-200 px-2 py-1 rounded font-mono">
                          {(actionData as any).generatedPassword}
                        </code>
                      </span>
                    </div>
                    <p className="text-xs mt-2">
                      Make sure to save this password - it won't be shown again!
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password (optional - leave empty for random)
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Leave empty for random password"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    value="true"
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isAdmin" className="cursor-pointer">
                    Admin privileges
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isAdmin).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.isAdmin).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getGravatarURL(u.email || "", 32)} />
                        <AvatarFallback>
                          {u.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.username}</div>
                        {u.id === currentUser.userId && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.isAdmin ? (
                      <Badge variant="default">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(u)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(u)}
                        disabled={u.id === currentUser.userId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Form method="post">
              <input type="hidden" name="actionType" value="update" />
              <input type="hidden" name="userId" value={selectedUser.id} />
              <div className="grid gap-4 py-4">
                {actionData?.success === false && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{actionData.message}</span>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    name="username"
                    defaultValue={selectedUser.username}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={selectedUser.email}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">
                    New Password (leave empty to keep current)
                  </Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    placeholder="Leave empty to keep current password"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isAdmin"
                    name="isAdmin"
                    value="true"
                    defaultChecked={selectedUser.isAdmin}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-isAdmin" className="cursor-pointer">
                    Admin privileges
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Form method="post">
              <input type="hidden" name="actionType" value="delete" />
              <input type="hidden" name="userId" value={selectedUser.id} />
              <div className="py-4">
                {actionData?.success === false && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2 mb-4">
                    <AlertCircle size={16} />
                    <span>{actionData.message}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 bg-muted rounded">
                  <Avatar>
                    <AvatarImage
                      src={getGravatarURL(selectedUser.email || "", 32)}
                    />
                    <AvatarFallback>
                      {selectedUser.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Delete User
                </Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
