import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { findFolderByName, listFolderContents, getFolderName } from "@/lib/google-drive";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = req.nextUrl.searchParams.get("category");
  const folderId = req.nextUrl.searchParams.get("folderId");

  // If a specific folderId is provided, browse that folder directly
  if (folderId) {
    const [files, name] = await Promise.all([
      listFolderContents(session.accessToken, folderId),
      getFolderName(session.accessToken, folderId),
    ]);
    return NextResponse.json({ files, folderId, folderName: name });
  }

  if (!category) {
    return NextResponse.json({ error: "Missing category or folderId" }, { status: 400 });
  }

  const sharedFolderName = process.env.SHARED_DRIVE_FOLDER_NAME ?? "Family Planning";
  const rootFolderId = await findFolderByName(session.accessToken, sharedFolderName);
  if (!rootFolderId) {
    return NextResponse.json({ error: `Folder "${sharedFolderName}" not found in Drive` }, { status: 404 });
  }

  const categoryFolderId = await findFolderByName(session.accessToken, category, rootFolderId);
  if (!categoryFolderId) {
    return NextResponse.json({ files: [], folderId: null, folderName: category });
  }

  const files = await listFolderContents(session.accessToken, categoryFolderId);
  return NextResponse.json({ files, folderId: categoryFolderId, folderName: category });
}
