import { AppError, propagateError } from "@packages/utils/errors";
import { asc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { folders, type Folder, type NewFolder } from "../schemas/folders";

export type FolderWithChildren = Folder & { children: FolderWithChildren[] };

function buildTree(items: Folder[]): FolderWithChildren[] {
   const byId = new Map<string, FolderWithChildren>();
   for (const item of items) {
      byId.set(item.id, { ...item, children: [] });
   }
   const roots: FolderWithChildren[] = [];
   for (const item of byId.values()) {
      if (item.parentId == null) {
         roots.push(item);
         continue;
      }
      const parent = byId.get(item.parentId);
      if (parent) parent.children.push(item);
      else roots.push(item);
   }
   const sortByOrder = (a: FolderWithChildren, b: FolderWithChildren) =>
      a.order - b.order;
   roots.sort(sortByOrder);
   for (const node of byId.values()) {
      node.children.sort(sortByOrder);
   }
   return roots;
}

export async function createFolder(db: DatabaseInstance, data: NewFolder) {
   try {
      const [folder] = await db.insert(folders).values(data).returning();
      return folder;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create folder");
   }
}

export async function listFoldersByTeam(db: DatabaseInstance, teamId: string) {
   try {
      return await db
         .select()
         .from(folders)
         .where(eq(folders.teamId, teamId))
         .orderBy(asc(folders.order), asc(folders.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list folders by team");
   }
}

export async function listFoldersWithChildren(
   db: DatabaseInstance,
   teamId: string,
): Promise<FolderWithChildren[]> {
   const flat = await listFoldersByTeam(db, teamId);
   return buildTree(flat);
}

export async function getFolderById(db: DatabaseInstance, folderId: string) {
   try {
      const [folder] = await db
         .select()
         .from(folders)
         .where(eq(folders.id, folderId));
      return folder ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get folder");
   }
}

export async function updateFolder(
   db: DatabaseInstance,
   folderId: string,
   data: Partial<
      Pick<NewFolder, "name" | "description" | "parentId" | "order" | "color">
   >,
) {
   try {
      const [updated] = await db
         .update(folders)
         .set(data)
         .where(eq(folders.id, folderId))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update folder");
   }
}

export async function deleteFolder(db: DatabaseInstance, folderId: string) {
   try {
      await db.delete(folders).where(eq(folders.id, folderId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete folder");
   }
}

